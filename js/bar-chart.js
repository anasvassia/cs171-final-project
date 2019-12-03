
/*
 * PrioVis - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the visualization
 * @param _data						-- the actual data: perDayData
 */

BarChart = function(_parentElement, _data, _metaData){
    this.parentElement = _parentElement;
    this.data = _data;

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
        vis.height = 800 - vis.margin.top - vis.margin.bottom;

    // SVG drawing area
    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

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

    vis.displayData = vis.data[genre];


    vis.displayData.sort(function(a, b) {
        return b.score - a.score;
    });

    vis.displayData = vis.displayData.slice(0, 20);

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

    var bars = vis.svg.selectAll(".bar")
        .data(vis.displayData);

    bars.enter().append("rect")
        .attr("class", "bar")

        .merge(bars)
        .transition()
        .attr("x", vis.x(0))
        .attr("y", function(d){
            return vis.y(d.name);
        })
        .attr("width", function(d) {
            return vis.x(d.score); })
        .attr("height", vis.y.bandwidth())
        .attr("fill", "#f09b68");

    bars.exit().remove();

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

