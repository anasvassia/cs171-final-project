
/*
 * PrioVis - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the visualization
 * @param _data						-- the actual data: perDayData
 */

TreeMap = function(_parentElement, _data, _metaData){
    this.parentElement = _parentElement;
    this.data = _data;

    this.initVis();
}


/*
 * Initialize visualization (static content, e.g. SVG area or axes)
 */

TreeMap.prototype.initVis = function(){
    var vis = this;

    vis.margin = { top: 20, right: 60, bottom: 20, left: 60 };

    console.log($("#" + vis.parentElement).width());

    vis.width = $("#" + vis.parentElement).width()  - vis.margin.left - vis.margin.right,
        vis.height = 800 - vis.margin.top - vis.margin.bottom;

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
    vis.wrangleData("total");
}


/*
 * Data wrangling
 */

TreeMap.prototype.wrangleData = function(genre){
    var vis = this;

    vis.root = d3.hierarchy(vis.data[genre])
        .sum(function(d) { return d.frequency; })

    console.log(vis.root);
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
        .padding(2)
        (vis.root);

    // use this information to add rectangles:
    var rectangles = vis.svg
        .selectAll("rect")
        .data(vis.root.leaves());

    rectangles.exit().remove();

    rectangles
        .enter()
        .append("rect")

        .merge(rectangles)
        .transition()
        .attr('x', function (d) { return d.x0; })
        .attr('y', function (d) { return d.y0; })
        .attr('width', function (d) { return d.x1 - d.x0; })
        .attr('height', function (d) { return d.y1 - d.y0; })
        .style("stroke", "black")
        .style("fill", function(d) {
            return vis.colorMap[d.data["color_name"]];
        })

    // and to add the text labels
    var textLabels = vis.svg
        .selectAll("text")
        .data(vis.root.leaves());

    textLabels.exit().remove();

    textLabels.enter()
        .append("text")
        .merge(textLabels)
        .transition()
        .attr("x", function(d){ return d.x0+5})    // +10 to adjust position (more right)
        .attr("y", function(d){ return d.y0+20})    // +20 to adjust position (lower)
        .text(function(d){
            console.log(d);
            return d.data["color_name"]; })
        .attr("font-size", "15px")
        .attr("fill", "white")
}

