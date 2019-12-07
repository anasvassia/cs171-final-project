
/*
 * PrioVis - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the visualization
 * @param _data						-- the actual data: perDayData
 */

TreeMap = function(_parentElement, _data, _bookData,  _enterEventHandler, _leaveEventHandler){
    this.parentElement = _parentElement;
    this.data = _data;
    this.bookData = _bookData;
    this.enterEventHandler = _enterEventHandler;
    this.leaveEventHandler = _leaveEventHandler;

    this.initVis();
}


/*
 * Initialize visualization (static content, e.g. SVG area or axes)
 */

TreeMap.prototype.initVis = function(){
    var vis = this;

    vis.margin = { top: 20, right: 60, bottom: 40, left: 60 };

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
        "white": "#f5f5f5",
        "black": "#433d39",
        "gray": "#736f6c"
    }

    // (Filter, aggregate, modify data)
    vis.wrangleData("total");
}


/*
 * Data wrangling
 */

TreeMap.prototype.wrangleData = function(genre){
    var vis = this;

    vis.current_genre = genre;

    for (var i = 0; i < vis.data[genre].children.length; i++) {
        vis.data[genre].children[i]["images"] = [];
    }

    // console.log(vis.data[genre]);


    for (var i = 0; i < vis.bookData.length; i++) {
        var book = vis.bookData[i];

        if (book["tags"].includes(genre) || genre === "total") {
            var color = book["dominantColorCategory"];
            if (color &&  color != "missing") {
                var data = vis.data[genre].children.find(element => element["color_name"] === color)
                if (data["images"].length < 20 && book["ratings_count"] > 100000) {
                    //console.log(data);
                    data["images"].push(book);
                }
            }
        }
        var cond = true;
        vis.data[genre].children.forEach(function (color) {
            if (color["images"].length < 20) {
                cond = false;
            }
        });
        if (cond) {
            break;
        }
    }

    // console.log(vis.data[genre]);

    vis.root = d3.hierarchy(vis.data[genre])
        .sum(function(d) { return d.frequency; });

    // Update the visualization
    vis.updateVis();
}


/*
 * The drawing function
 */

TreeMap.prototype.updateVis = function(){
    var vis = this;

    d3.treemap()
        .size([vis.width, vis.height])
        .padding(3)
        (vis.root);

    vis.rectsSelect = vis.svg
        .selectAll("rect")
        .data(vis.root.leaves());

    vis.rectsSelect.exit().remove();

    vis.tip = d3.tip().attr("class", "tooltip")
        .html(function(d) {
            return d3.format(".1%")(d.data.frequency/d.parent.value);
        })


     vis.rects = vis.rectsSelect.enter()
        .append("rect")
         .merge(vis.rectsSelect)
       .attr("id",  function(d) {
            return "rect-" + d.data.color_name;
        } )
        .attr('width', function (d) { return d.x1 - d.x0; })
        .attr('height', function (d) { return d.y1 - d.y0; })
        .attr("pointer-events", "all")
        .style("fill", function(d) {
            return vis.colorMap[d.data["color_name"]];
        })
         .style("stroke", function(d) {
             if (d.data["color_name"] === "white") {
                 return "#ddd"
             }
         })
         .style('stroke-width', function(d) {
             if (d.data["color_name"] === "white") {
                 return 2
             }
         })
        .style("fill-opacity", 1)
         .attr("transform", function(d) {
             return "translate(" + d.x0 + "," + d.y0 + ")";
         } );

    vis.rects.call(vis.tip);

    var mouseover = function(d) {
        vis.tip.show(d);
        vis.enterEventHandler(vis.current_genre, d.data.color_name);
        vis.svg.selectAll("rect")
            .style("fill-opacity", 0.5);

        vis.svg.select("#rect-" + d.data.color_name)
            .style("fill-opacity", 1);
    }

    var mouseleave = function(d) {
        vis.tip.hide(d);
        vis.svg.selectAll("rect")
            .style("fill-opacity", 1);
        vis.leaveEventHandler(vis.current_genre, "total");

    }


    vis.rects.on('mouseover', mouseover)
        .on('mouseout', mouseleave)

    vis.rects.transition();



    // and to add the text labels
    vis.textLabels = vis.svg
        .selectAll("text.tree-labels")
        .data(vis.root.leaves());
    vis.textLabels.exit().remove();

    vis.textLabels.enter()
        .append("text")
        .attr("class", "tree-labels")
        .merge(vis.textLabels)
        .transition()
        .attr("x", function(d){ return d.x0+5})    // +10 to adjust position (more right)
        .attr("y", function(d){ return d.y0+20})    // +20 to adjust position (lower)
        .text(function(d){
            return d.data["color_name"]; })
        .attr("width", function(d){
            return vis.svg.select("#rect-" + d.data["color_name"]).attr("width") - 5; })
        .style("font-size", "12px")
        .attr("fill", function (d) {
            if (d.data["color_name"] === "white") {
                    return "#bbb"
                } else {
                return "white";
            }
        });


}

TreeMap.prototype.selectColor = function(color) {
    var vis = this;

    vis.svg.selectAll("rect")
        .style("fill-opacity", 0.5);

    vis.svg.select("#rect-" + color)
        .style("fill-opacity", 1);
}

TreeMap.prototype.deselectColor = function() {
    var vis = this;


    vis.svg.selectAll("rect")
        .style("fill-opacity", 1);
}