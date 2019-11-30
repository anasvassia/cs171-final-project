
/*
 * PrioVis - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the visualization
 * @param _data						-- the actual data: perDayData
 */

TreeMap = function(_parentElement, _data, _bookData){
    this.parentElement = _parentElement;
    this.data = _data;
    this.bookData = _bookData;

    this.initVis();
}


/*
 * Initialize visualization (static content, e.g. SVG area or axes)
 */

TreeMap.prototype.initVis = function(){
    var vis = this;

    vis.margin = { top: 20, right: 100, bottom: 20, left: 60 };

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


    for (var i = 0; i < vis.data[genre].children.length; i++) {
        vis.data[genre].children[i]["images"] = [];
    }

    console.log(vis.data[genre]);


    for (var i = 0; i < vis.bookData.length; i++) {
        var book = vis.bookData[i];

        if (book["tags"].includes(genre) || genre === "total") {
            var color = book["dominant_color_categorized"];
            if (color &&  color != "missing") {
                var data = vis.data[genre].children.find(element => element["color_name"] === color)
                if (data["images"].length < 12) {
                    console.log(data);
                    data["images"].push(book["image_url"]);
                }
            }
        }
        var cond = true;
        vis.data[genre].children.forEach(function (color) {
            if (color["images"].length < 12) {
                cond = false;
            }
        });
        if (cond) {
            break;
        }
    }

    console.log(vis.data[genre]);

    vis.root = d3.hierarchy(vis.data[genre])
        .sum(function(d) { return d.frequency; })

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

    console.log(vis.root);

    // use this information to add rectangles:
    var leaf = vis.svg
        .selectAll("g.area")
        .data(vis.root.leaves());

    var groups = leaf.enter()
        .append("g")
        .attr("class", "area")
        .attr("transform", d => `translate(${d.x0},${d.y0})`);

    groups.merge(groups)
        .transition();

    groups.append("clipPath")
        .attr("id", function (d) {
            return "clipPath-" + d.data.color_name;
        })
        .append("rect")
        .attr('width', function (d) { return d.x1 - d.x0; })
        .attr('height', function (d) { return d.y1 - d.y0; });


    var images = groups.selectAll("image")

        .data(function(d){
            return d.data.images.map(function(i) {
                return {
                    "image": i,
                    "color": d.data.color_name,
                    "total_width": d.x1 - d.x0,
                    "total_height": d.y1 - d.y0
                };
            }); })
        .enter()
        .append("image")
        .attr('width', 50)
        .attr("height", 74)
            .attr("clip-path", function(d){
                console.log(d);
                return "url(#clipPath-" + d.color + ")";
            })
        .attr("xlink:href", function (d) {
            console.log(d);
            return d.image;
        })
        .attr("transform", function (d, i) {
            var row_num = Math.ceil(d.total_width/50);
            console.log("total_width " +  d.total_width + " row_num " + row_num);
            return "translate(" + ((i%row_num)*50) + ", " + (Math.floor(i/row_num)*74) + ")"
        })
        .attr("opacity", function (d, i) {
            var row_num = Math.ceil(d.total_width/74);
            if (Math.floor(i/row_num)*74 <= d.total_height + 74) {
                return 1;
            } else {
                return 0;
            }
        });

    groups.append("rect")
        .attr('width', function (d) { return d.x1 - d.x0; })
        .attr('height', function (d) { return d.y1 - d.y0; })
        .style("fill", function(d) {
            return vis.colorMap[d.data["color_name"]];
        })
        .style("fill-opacity", 0.5);


    groups.exit().remove();


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
            return d.data["color_name"]; })
        .attr("font-size", "15px")
        .attr("fill", "white")
        .attr("class", "tree-labels")
}

