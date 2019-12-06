/*
 * Innovative View - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the bar charts
 * @param _data						-- the dataset 'book aesthetic analysis'
 */
StackedBar = function (_parentElement, _data) {
    this.parentElement = _parentElement;
    this.data = _data;
    this.updated_data = _data.filter(function(d){return d.genre === 'total'}); // Set a placeholder for updated data.
    this.year_ranges = [...new Set(_data.map(x => x.year_range))].sort();
    this.initVis();
};

/*
 * Initialize visualization (static content; e.g. SVG area, scales)
 */
StackedBar.prototype.initVis = function () {
    var vis = this;

    vis.colorMap = {
        "pink": "#f797a1",
        "black": "#433d39",
        "yellow": "#f1d063",
        "red": "#eb5f6c",
        "blue": "#93d7f0",
        "green": "#99d58f",
        "orange": "#f09b68",
        "white": "#f5f5f5",
        "gray": "#736f6c",
        "violet": "#bb96d8"
    };

    vis.genres = {
        'young_adult': 'Young Adult',
        'science_fiction': 'Science Fiction',
        'paranormal': 'Paranormal',
        'children': 'Children',
        'romance': 'Romance',
        'thriller': 'Thriller',
        'historic': 'Historical',
        'fantasy': 'Fantasy',
    };

// Set margin and svg drawing area.
    vis.margin = {top: 30, right: 10, bottom: 10, left: 10},
        vis.width = $("#" + vis.parentElement).width()  - vis.margin.left - vis.margin.right,
        vis.height = 800 - vis.margin.top - vis.margin.bottom;

    console.log(vis.width);

    // Draw SVG Element.
    vis.svg = d3.select("#" + vis.parentElement)
        .append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom);

    // Define Scales
    vis.x = d3.scaleBand()
        .domain(vis.year_ranges)
        .rangeRound([0, 0.85*vis.width]);

    vis.y = d3.scaleLinear()
        .domain([0,1])
        .rangeRound([vis.height - 230, 0]);

    vis.area = d3.area()
        .curve(d3.curveBasis)
        .x(function(d) {
            return vis.x(d.data.year_range); })
        .y0(function(d) { return vis.y(d[0]); })
        .y1(function(d) { return vis.y(d[1]); });

    vis.line = d3.line()
        .curve(d3.curveBasis)
        .x(function(d) {
            return vis.x(d.data.year_range); })
        .y(function(d) { return vis.y(d[1]); });

    //Define the stack bar plotter. Plot only totals by default.
    vis.stack = d3.stack()
        .keys(Object.keys(vis.colorMap));

    var series = vis.stack(vis.data.filter(function(d){return d.genre === 'total';}));

    console.log(series);

    vis.svg
        .selectAll(".stacked_bar")
        .data(series)
        .enter()
        .append("g")
        .attr("class", "stacked_bar")
        .attr("fill", function(d){return vis.colorMap[d.key]})
        .style("opacity", 0.8)
        .append("path")
        .attr('class', 'area')
        .attr('d', vis.area)
        .attr("transform", "translate(150,200)");

    // Plot X axis
    vis.svg.append("g")
        .attr("class", "x_axis")
        .attr("transform", "translate(150,730)")
        .call(d3.axisBottom(vis.x).ticks(20))
        .selectAll("text")
        .style("text-anchor", "end")
        .style("font-size", 12)
        .attr('fill', '#A8A8A8')
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-65)");

    vis.svg.append("g")
        .attr("class", "y_axis")
        .call(d3.axisLeft(vis.y).tickFormat(d3.format(".0%")))
        .attr("transform", "translate(155,200)")
        .selectAll("text")
        .style("font-size", 12)
        .attr('fill', '#A8A8A8');

    vis.svg.append("text")
        .attr("class", "x_axis_label")
        .text("Years")
        .attr("transform", "translate(100,770)");

    vis.svg.append("text")
        .attr("class", "y_axis_label")
        .text("Count Distribution %")
        .attr("transform", "translate(100,400) rotate(270)")
        .attr('fill', 'grey');

    vis.svg
        .selectAll(".stacked_bar")
        .on('mouseover', function(d) {
            var chosenOne = this;
            d3.selectAll('.stacked_bar').transition().style('opacity',function () {
                return (this === chosenOne) ? 1.0 : 0.1;
            });})
        .on('mouseout',function(d) {
            d3.selectAll('.stacked_bar').transition().style("opacity", 0.8); });

    vis.updateStack();
};

StackedBar.prototype.updateStack = function () {
    var vis = this;
    // Update Series
    var series = vis.stack(vis.updated_data);
    // Call the X and Y scales

    vis.svg.selectAll(".stacked_bar")
        .select('.area')
        .data(series)
        .transition()
        .duration(1000)
        .attr("d", vis.area);

    vis.svg.selectAll(".stacked_bar")
        .selectAll(".line-paths")
        .data(series)
        .transition()
        .duration(1000)
        .style('stroke', function(d){
            if(vis.selected_color === ''){return vis.colorMap[d.key]}
            else {return vis.colorMap[vis.selected_color]}
        })
        .attr('d', vis.line)


};

StackedBar.prototype.selectionChanged = function (filteredData) {
    var vis = this;
    // Filter data accordingly without changing the original data
    // Update the data property to the filtered dataset.
    vis.updated_data = filteredData;
    // Update the visualization.
    vis.updateStack();
};