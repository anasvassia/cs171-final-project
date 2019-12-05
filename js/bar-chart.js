



/*
 * PrioVis - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the visualization
 * @param _data						-- the actual data: perDayData
 */

BarChart = function(_parentElement, _data, _eventHandler){
    this.parentElement = _parentElement;
    this.data = _data;
    this.eventHandler = _eventHandler;

    this.initVis();
}


/*
 * Initialize visualization (static content, e.g. SVG area or axes)
 */

BarChart.prototype.initVis = function(){
    var vis = this;

    vis.margin = { top: 20, right: 60, bottom: 20, left: 100 };
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
        "white": "#f5e9c0",
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

    // vis.xAxis = d3.axisBottom()
    //     .scale(vis.x);

    vis.yAxis = d3.axisLeft()
        .scale(vis.y);

    // vis.svg.append("g")
    //     .attr("class", "x-axis axis")
    //     .attr("transform", "translate(0," + vis.height + ")");


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

    console.log(vis.layers);

        // console.log(vis.displayData);

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

    vis.tip = d3.tip().attr("class", "tooltip")
        .html(function(d) {
            console.log(this);
            var subgroupName = d3.select(this.parentNode).datum().key;
            var subgroupValue = d.data[subgroupName];
            return "Object Type: " + d.data.name + "<br>" + "Color: " + capitalize(subgroupName) + "<br>" + "Score: " + Math.round(subgroupValue);
        })

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

    var mouseover = function(d) {
        console.log(d);

        var subgroupName = d3.select(this.parentNode).datum().key; // This was the tricky part
        console.log(this.parentNode);
        vis.tip.show(d, this);
        vis.eventHandler(vis.current_genre, subgroupName);
        vis.svg.selectAll(".layer")
            .style("fill-opacity", 0.6);

        vis.svg.select("#layer-" + subgroupName)
            .style("fill-opacity", 1);
    }

    var mouseleave = function(d) {

        vis.tip.hide(d);
        vis.svg.selectAll(".layer")
            .style("fill-opacity", 1);
        vis.eventHandler(vis.current_genre, "total");

    }

    vis.rectsselect = vis.groups.selectAll("rect")
        .data(function(d) { return d; })

    vis.rectsenter = vis.rectsselect.enter().append("rect");

    vis.rects = vis.rectsenter.merge(vis.rectsselect)
    vis.rects.call(vis.tip);

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

    // var bars = vis.svg.selectAll(".bar")
    //     .data(vis.displayData);
    //
    // bars.enter().append("rect")
    //     .attr("class", "bar")
    //
    //     .merge(bars)
    //     .transition()
    //     .attr("x", vis.x(0))
    //     .attr("y", function(d){
    //         return vis.y(d.name);
    //     })
    //     .attr("width", function(d) {
    //         return vis.x(d.score); })
    //     .attr("height", vis.y.bandwidth())
    //     .attr("fill", "#736f6c");
    //
    // bars.exit().remove();

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

    // vis.svg.select(".x-axis").call(vis.xAxis);
    vis.svg.select(".y-axis").call(vis.yAxis);
}

