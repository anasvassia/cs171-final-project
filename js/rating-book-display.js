/*
Custom viz which shows example images upon hovering over the stack bar and tree map.
*/

/*
 * PrioVis - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the visualization
 * @param _data						-- the actual data: perDayData
 */

RatingBookDisplay = function(_parentElement, _bookData){
    this.parentElement = _parentElement;
    this.bookData = _bookData;

    this.initVis();
}


/*
 * Initialize visualization (static content, e.g. SVG area or axes)
 */

RatingBookDisplay.prototype.initVis = function(){
    var vis = this;

    vis.margin = { top: 20, right: 10, bottom: 20, left: 30 };

    vis.width = $("#" + vis.parentElement).width()  - vis.margin.left - vis.margin.right,
        vis.height = 600 - vis.margin.top - vis.margin.bottom;

    // SVG drawing area
    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

    vis.colorMap = {
        "blue": "#93d7f0",
        "red": "#eb5f6c",
        "yellow": "#f1d063",
        "green": "#99d58f",
        "violet": "#bb96d8",
        "orange": "#f09b68",
        "pink": "#f797a1",
        "white": "#f5e9c0",
        "black": "#433d39",
        "gray": "#736f6c"
    }


    // (Filter, aggregate, modify data)
    vis.wrangleData("total", "total", [0, 5], "average_rating");
}


/*
 * Data wrangling
 */

RatingBookDisplay.prototype.wrangleData = function(genre, color, rating, param){
    var vis = this;

    vis.current_genre = genre;
    vis.current_color = color;
    vis.current_rating = rating;


    vis.images = [];

    vis.bookData.sort(function (a, b) {
        return b["ratings_count"] - a["ratings_count"];
    });


    for (var i = 0; i < vis.bookData.length; i++) {
        var book = vis.bookData[i];
        if (book["tags"].includes(genre) || genre === "total") {
            var book_color = book["dominantColorCategory"];
            if (book_color &&  book_color != "missing") {
                if ((book_color === color || color === "total") && (book[param] >= rating[0] && book[param] <= rating[1])) {
                    if (vis.images.length < 6) {
                        vis.images.push(book);
                    }
                }
            }
        }
        if (vis.images.length >= 6) {
            break;
        }
    }
    // Update the visualization
    vis.updateVis();
}


/*
 * The drawing function
 */

RatingBookDisplay.prototype.updateVis = function(){
    var vis = this;


    vis.svg.select("text").remove();
    vis.svg.append("text")
        .attr("class", "book-display-labels")
        .each(function (d) {
            var arr;
            if (vis.current_color != "total" && vis.current_genre != "total") {
                arr = [capitalize(vis.current_genre) + " books", "with dominant",  "color " + vis.current_color];
            } else if (vis.current_color != "total") {
                arr = ["Books with", "dominant color", vis.current_color];
            } else if (vis.current_genre != "total") {
                arr = [capitalize(vis.current_genre) + " books"];
            } else {
                arr = ["Top books"]
            }

            for (i = 0; i < arr.length; i++) {
                d3.select(this).append("tspan")
                    .text(arr[i])
                    .attr("dy", i ? "1.2em" : 0)
                    .attr("x", 25)
                    .attr("text-anchor", "middle")
                    .attr("class", "tspan" + i)
                    .attr("fill", "black");
            }
        });


    vis.tip = d3.tip().attr("class", "tooltip")
        .html(function(d) {
            return d.title;
        })


    vis.imageselect = vis.svg.selectAll("image")
        .data(vis.images);

    vis.imageselect.exit().remove();


    // TODO: call tooltip
    vis.imageElements = vis.imageselect.enter()
        .append("image")
        .merge(vis.imageselect)
        .attr('width', function(d) {
            return 50;
        })
        .attr("height", function(d) {
            return 74;
        })
        .attr("xlink:href", function (d) {
            return d.image_url;
        })
        .attr("pointer-events", "all")
        .attr("transform", function (d, i) {
            var row_num = Math.ceil(vis.width/50);
            return "translate(" + (0) + ", " + (i*74 + 10*i + 50) + ")"


        });

    vis.imageElements.call(vis.tip);

    vis.imageElements.on('mouseover', vis.tip.show)
        .on('mouseout', vis.tip.hide);

    vis.imageElements.transition();



}

