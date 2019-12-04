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
    vis.margin = {top: 30, right: 20, bottom: 10, left: 10},
        vis.width = 850 - vis.margin.left - vis.margin.right,
        vis.height = 800 - vis.margin.top - vis.margin.bottom;

    // Draw SVG Element.
    vis.svg = d3.select("#" + vis.parentElement)
        .append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom);

    // Define Scales
    vis.x = d3.scaleBand()
        .domain(vis.year_ranges)
        .rangeRound([0, vis.width - 120])
        .padding(0.3)
        .align(0.3);

    vis.y = d3.scaleLinear()
        .domain(d3.extent(vis.data, function(d){return d.sum}))
        .rangeRound([vis.height - 230, 0]);

    //Define the stack bar plotter. Plot only totals by default.
    vis.stack = d3.stack()
        .keys(Object.keys(vis.colorMap));
    var series = vis.stack(vis.data.filter(function(d){return d.genre === 'total';}));

    vis.svg
        .selectAll(".stacked_bar")
        .data(series)
        .enter()
        .append("g")
        .attr("class", "stacked_bar")
        .attr("fill", function(d){return vis.colorMap[d.key]})
        .selectAll("rect")
        .data(function(d) { return d; })
        .enter().append("rect")
        .attr("x", function(d,i) { return vis.x(d.data.year_range); })
        .attr("y", function(d) { return vis.y(d[1]); })
        .attr("height", function(d) { return (vis.y(d[0]) - vis.y(d[1])); })
        .attr("width",vis.x.bandwidth())
        //     // .on('mouseover', tip_stack.show)
        //     // .on('mouseout', tip_stack.hide)
        .attr("stroke", 'grey')
        .attr("stroke-width", 0.3)
        .attr("transform", "translate(150,200)");

    vis.svg.append("g")
        .attr("class", "x_axis")
        .attr("transform", "translate(150,730)")
        .call(d3.axisBottom(vis.x).ticks(20))
        .selectAll("text")
        .style("text-anchor", "end")
        .style("font-size", 12)
        .attr('fill', 'grey')
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-65)");

    vis.svg.append("g")
        .attr("class", "y_axis")
        .call(d3.axisLeft(vis.y))
        .attr("transform", "translate(150,200)")
        .selectAll("text")
        .style("font-size", 12)
        .attr('fill', 'grey');

    vis.svg.append("text")
        .attr("class", "x_axis_label")
        .text("Years")
        .attr("transform", "translate(100,770)");

    vis.svg.append("text")
        .attr("class", "y_axis_label")
        .text("Number of books")
        .attr("transform", "translate(100,400) rotate(270)")
        .attr('fill', 'grey');

    vis.updateStack();
};

StackedBar.prototype.updateStack = function () {
    var vis = this;
    // Update Series
    var series = vis.stack(vis.updated_data);
    // Update domain of Y axes.
    vis.y.domain(d3.extent(vis.updated_data, function(d){return d.sum}));

    // Call the X and Y scales

    vis.svg.selectAll(".stacked_bar")
        .data(series)
        .selectAll("rect")
        .data(function(d) { return d; })
        .transition()
        .duration(1000)
        .attr("x", function(d) { return vis.x(d.data.year_range); })
        .attr("y", function(d) { return vis.y(d[1]); })
        .attr("height", function(d) { return (vis.y(d[0]) - vis.y(d[1])); });

    vis.svg.select(".y_axis")
        .transition()
        .duration(1000)
        .call(d3.axisLeft(vis.y))

};

StackedBar.prototype.selectionChanged = function (filteredData) {
    var vis = this;
    // Filter data accordingly without changing the original data
    // Update the data property to the filtered dataset.
    vis.updated_data = filteredData;
    // Update the visualization.
    vis.updateStack();
};