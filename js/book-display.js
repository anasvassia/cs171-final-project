
/*
 * PrioVis - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the visualization
 * @param _data						-- the actual data: perDayData
 */

BookDisplay = function(_parentElement, _bookData){
    this.parentElement = _parentElement;
    this.bookData = _bookData;

    this.initVis();
}


/*
 * Initialize visualization (static content, e.g. SVG area or axes)
 */

BookDisplay.prototype.initVis = function(){
    var vis = this;

    vis.margin = { top: 20, right: 100, bottom: 20, left: 60 };

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
    vis.wrangleData("total", "total");
}


/*
 * Data wrangling
 */

BookDisplay.prototype.wrangleData = function(genre, color){
    var vis = this;


    // for (var i = 0; i < vis.data[genre].children.length; i++) {
    //     vis.data[genre].children[i]["images"] = [];
    // }

    // console.log(vis.data[genre]);
    vis.images = []

    for (var i = 0; i < vis.bookData.length; i++) {
        var book = vis.bookData[i];
        if (book["tags"].includes(genre) || genre === "total") {
            var book_color = book["dominantColorCategory"];
            if (book_color &&  book_color != "missing") {
                if (book_color === color || color === "total") {
                    if (vis.images.length < 12 && book["ratings_count"] > 100000) {
                        vis.images.push(book);
                    }
                }
            }
        }
        if (vis.images.length >= 12) {
            break;
        }
    }

    // Update the visualization
    vis.updateVis();
}


/*
 * The drawing function
 */

BookDisplay.prototype.updateVis = function(){
    var vis = this;


    vis.tip = d3.tip().attr("class", "tooltip")
        .html(function(d) {
            return d.title;
        })


    vis.imageselect = vis.svg.selectAll("image")
        .data(vis.images);

    // TODO: call tooltip
    vis.imageElements = vis.imageselect.enter()
        .append("image")
        .merge(vis.imageselect)


        .attr('width', function(d) {
            return 50;
            // var num_cols = Math.floor(d.total_width/50);
            // return Math.max(1, d.total_width / num_cols);
        })
        .attr("height", function(d) {
            return 74;
            // var num_rows = Math.floor(d.total_height/74);
            // return Math.max(1, d.total_height / num_rows);
        })
        .attr("xlink:href", function (d) {
            return d.image_url;
        })
        .attr("pointer-events", "all")
        .on('mouseover', vis.tip.show)
        .on('mouseout', vis.tip.hide)

        .attr("transform", function (d, i) {
            var row_num = Math.ceil(vis.width/50);
//            console.log("total_width " +  d.total_width + " row_num " + row_num);
            return "translate(" + ((i%row_num)*50 +30) + ", " + ((Math.floor(i/row_num))*74 + 30) + ")"
//             var num_cols = Math.max(1,  Math.floor(d.total_width/50));
//             var num_rows = Math.max(1, Math.floor(d.total_height/74));
//             console.log("cols: " + num_cols + " rows: " + num_rows);
//
//             var x = d.total_width / num_cols * (i % num_cols);
//             var y = d.total_height/num_rows  * Math.floor(i /num_rows );
//             return "translate(" + (x) + ", " + (y) + ")"


        });

    vis.imageElements.transition();
    vis.imageElements.exit().remove();



}

