



/*
 * PrioVis - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the visualization
 * @param _data						-- the actual data: perDayData
 */

BarChart = function(_parentElement, _data, _enterEventHandler, _leaveEventHandler){
    this.parentElement = _parentElement;
    this.data = _data;
    this.enterEventHandler = _enterEventHandler;
    this.leaveEventHandler = _leaveEventHandler;

    this.initVis();
}


/*
 * Initialize visualization (static content, e.g. SVG area or axes)
 */

BarChart.prototype.initVis = function(){
    var vis = this;

    vis.margin = { top: 20, right: 60, bottom: 40, left: 100 };
    // console.log($("#" + vis.parentElement).width());
    vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right,
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

    vis.colors = Object.keys(vis.colorMap);

    // Scales and axes
    vis.x = d3.scaleLinear()
        .range([0,vis.width]);

    vis.y = d3.scaleBand()
        .rangeRound([0, vis.height])
        .paddingInner(0.2);

    vis.yAxis = d3.axisLeft()
        .scale(vis.y);

    vis.svg.append("g")
        .attr("class", "y-axis axis");

    // (Filter, aggregate, modify data)
    vis.wrangleData("total");
}


/*
 * Data wrangling
 */

BarChart.prototype.wrangleData = function(genre){
    var vis = this;

    vis.current_genre = genre;

    vis.displayData = vis.data[genre];


    vis.displayData.sort(function(a, b) {
        return b.score - a.score;
    });

    vis.displayData = vis.displayData.slice(0, 16);

    vis.layers = d3.stack()
        .keys(vis.colors)
        (vis.displayData);


    // Update the visualization
    vis.updateVis();
}


/*
 * The drawing function
 */

BarChart.prototype.updateVis = function(){
    var vis = this;

    // Update domains
    vis.x.domain([0, d3.max(vis.displayData, function(d) {
        return d.score;
    })]);

    vis.y.domain(vis.displayData.map(function(d) {
        return d.name;
    }));



    vis.groupsselect = vis.svg
        .selectAll("g.layer")
        .data(vis.layers)

    vis.groupsenter = vis.groupsselect.enter().append("g")
        .attr("class", "layer")
        .attr("id", function (d) {
            return "layer-" + d.key;

        });

    vis.groups = vis.groupsenter.merge(vis.groupsselect);

    vis.groups.attr("fill", function (d) {
        return vis.colorMap[d.key];
    })
        .transition();


    vis.rectsselect = vis.groups.selectAll("rect")
        .data(function(d) { return d; })

    vis.rectsenter = vis.rectsselect.enter().append("rect");

    vis.rects = vis.rectsenter.merge(vis.rectsselect)

    vis.tip = d3.tip().attr("class", "tooltip");
    vis.rects.call(vis.tip);


    var mouseover = function(d) {

        var subgroupName = d3.select(this.parentNode).datum().key; // This was the tricky part
        var subgroupValue = d.data[subgroupName];

        vis.tip.html(
            "Object Type: " + d.data.name + "<br>" + "Color: " + capitalize(subgroupName) + "<br>" + "Score: " + Math.round(subgroupValue)
        );

        vis.tip.show(d);


        vis.enterEventHandler(vis.current_genre, subgroupName);
        vis.svg.selectAll(".layer")
            .style("fill-opacity", 0.5);

        vis.svg.select("#layer-" + subgroupName)
            .style("fill-opacity", 1);
    }

    var mouseleave = function(d) {

        vis.tip.hide(d);
        vis.svg.selectAll(".layer")
            .style("fill-opacity", 1);
        vis.leaveEventHandler(vis.current_genre, "total");

    }


    vis.rects.on('mouseover', mouseover)
        .on('mouseout', mouseleave)
        .attr("x", function (d) {
            return vis.x(d[0]);
        })
        .attr("y", function(d){
            return vis.y(d.data.name);
        })
        .attr("width", function(d) {
            return vis.x(d[1]) - vis.x(d[0]); })
        .attr("height", vis.y.bandwidth());


    vis.rects.transition();



    vis.groupsselect.exit().remove();
    vis.rectsselect.exit().remove();


    var textLabels = vis.svg
        .selectAll("text.data-label")
        .data(vis.displayData);

    textLabels.enter().append("text")
        .attr("class", "data-label")

        .merge(textLabels)
        .transition()
        .attr("x", function(d){
            return vis.x(d.score) + 10;
        })
        .attr("y", function(d){
            return vis.y(d.name) + vis.y.bandwidth()/2 + 6;
        })
        .text(function(d) {
            return Math.round(d.score);
        })
        .attr("fill", "black");

    textLabels.exit().remove();

    vis.svg.select(".y-axis").call(vis.yAxis);



    // Add legend text
    vis.svg.append("foreignObject")
        .attr('class', 'legend-details')
        .attr("x", vis.width - 200)
        .attr('y', vis.y(vis.layers[9][8].data.name) + 20)
        .attr('height', 300)
        .attr('width', 200)
        .text("This visualization shows which objects and symbols " +
            "tend to be shown on book covers of different genres.\n" +
            "Once again, the book that you selected at the\n" +
            "beginning is highlighted. Choose a genre to see which\n" +
            "symbols are most common within it.");

    console.log(vis.layers);
    console.log(vis.svg.select("foreignObject").attr('x'));
    console.log(vis.y(vis.layers[9][8].data.name))

    // Add legend title
    vis.svg
        .append("text")
        .attr("class", "legend-title")
        .attr("x", vis.svg.select("foreignObject").attr('x') -20)
        .attr('y', vis.y(vis.layers[9][8].data.name))
        .text('Symbol Usage across 8 Genre Book Covers');




}

BarChart.prototype.selectColor = function(color) {
    var vis = this;

    vis.svg.selectAll(".layer")
        .style("fill-opacity", 0.5);

    vis.svg.select("#layer-" + color)
        .style("fill-opacity", 1);
}

BarChart.prototype.deselectColor = function() {
    var vis = this;


    vis.svg.selectAll(".layer")
        .style("fill-opacity", 1);
}

