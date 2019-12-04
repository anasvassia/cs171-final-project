
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
        .padding(3)
        (vis.root);

    // console.log(vis.root);



    // use this information to add rectangles:
    vis.leaf = vis.svg
        .selectAll("g.area")
        .data(vis.root.leaves());


    // TODO: FIX CLIPPING
    // vis.clipPaths = vis.svg
    //     .selectAll(".clip-path")
    //     .data(vis.root.leaves());
    //
    // vis.clipPaths.exit().remove();
    //
    // vis.clipPaths.enter()
    //     .append("clipPath")
    //     .attr("id", function (d) {
    //         console.log(d);
    //         return "clipPath-" + d.data["color_name"];
    //     })
    //     .attr("class", "clip-path")
    //     .merge(vis.leaf)
    //     .attr("clipPathUnits", "userSpaceOnUse")
    //     .append("rect")
    //     .attr('width', function (d) { return d.x1 - d.x0; })
    //     .attr('height', function (d) { return d.y1 - d.y0; })
    //     .attr("x", function(d) {
    //
    //         return d.x0;
    //     } )
    //     .attr("y", function(d) {
    //
    //         return d.y0;
    //     } );

    vis.groupsenter = vis.leaf.enter()
        .append("g")
        .attr("class", "area");

    vis.groups = vis.groupsenter.merge(vis.leaf);

    vis.groups
        .transition()
        .attr("transform", function(d) {
            return "translate(" + d.x0 + "," + d.y0 + ")";
        } )
        .attr("clip-path", function(d){
            return "url(#clipPath-" + d.data.color_name + ")";
        });

    vis.tip = d3.tip().attr("class", "tooltip")
        .html(function(d) {
            return d.title;
        })

    vis.groups.call(vis.tip);

    vis.images = vis.groups.selectAll("image")

        .data(function(d){
            return d.data.images.map(function(i) {
                return {
                    ...i,
                    "total_width": d.x1 - d.x0,
                    "total_height": d.y1 - d.y0
                };
            }); })

    vis.imageElements = vis.images.enter()
        .append("image")
        .merge(vis.images)
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
            var row_num = Math.ceil(d.total_width/50);
//            console.log("total_width " +  d.total_width + " row_num " + row_num);
            return "translate(" + ((i%row_num)*50) + ", " + (Math.floor(i/row_num)*74) + ")"
//             var num_cols = Math.max(1,  Math.floor(d.total_width/50));
//             var num_rows = Math.max(1, Math.floor(d.total_height/74));
//             console.log("cols: " + num_cols + " rows: " + num_rows);
//
//             var x = d.total_width / num_cols * (i % num_cols);
//             var y = d.total_height/num_rows  * Math.floor(i /num_rows );
//             return "translate(" + (x) + ", " + (y) + ")"


        })
        .attr("opacity", function (d, i) {
            var row_num = Math.ceil(d.total_width/74);
            // cond: Math.floor(i/row_num)*74 <= d.total_height + 74
            if (Math.floor(i/row_num)*74 <= d.total_height + 74) {
                return 1;
            } else {
                return 0;
            }
        });

    vis.imageElements.transition();
    vis.imageElements.exit().remove();

    // TODO: need to remove rects

    vis.rects = vis.svg
        .selectAll("text")
        .data(vis.root.leaves());

     vis.rects.enter()
        .append("rect")
        .merge(vis.rects)
        .transition()
       .attr("id",  function(d) {
            return "rect-" + d.data.color_name;
        } )
        .attr('width', function (d) { return d.x1 - d.x0; })
        .attr('height', function (d) { return d.y1 - d.y0; })
        .attr("pointer-events", "none")
        .style("fill", function(d) {
            return vis.colorMap[d.data["color_name"]];
        })
        .style("fill-opacity", 0.6)
         .attr("transform", function(d) {
             return "translate(" + d.x0 + "," + d.y0 + ")";
         } );

    vis.rects.exit().remove();


    // and to add the text labels
    vis.textLabels = vis.svg
        .selectAll("text.tree-labels")
        .data(vis.root.leaves());

    vis.textLabels.enter()
        .append("text")
        .attr("class", "tree-labels")
        .merge(vis.textLabels)
        .transition()
        .attr("x", function(d){ return d.x0+5})    // +10 to adjust position (more right)
        .attr("y", function(d){ return d.y0+20})    // +20 to adjust position (lower)
        .text(function(d){
            return d.data["color_name"]; })
        .attr("font-size", "15px")
        .attr("fill", "white")

    vis.textLabels.exit().remove();


}

