/*
References used to build the stack area - https://bl.ocks.org/fabiomainardi/3976176cb36e718a608f
Rotating axes - https://bl.ocks.org/d3noob/3c040800ff6457717cca586ae9547dbf
*/

/*
 * Stacked Area - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the stacked area chart
 * @param _data				-- the pre-aggregated dataset aggregated by year and genre.
 */
StackedArea = function (_parentElement, _data) {
    this.parentElement = _parentElement;
    this.data = _data;
    // Add additional attributes for downstream viz to the vis object.
    this.updated_data = _data.filter(function(d){return d.genre === 'total'}); // Set a placeholder for updated data.
    this.year_ranges = [...new Set(_data.map(x => x.year_range))].sort();
    this.initVis();
};

/*
 * Initialize visualization (static content; e.g. SVG area, scales)
 */
StackedArea.prototype.initVis = function () {
    var vis = this;
    // Color mapping object to map HTML colors to a more harmonious color palette.
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
// Object to map genre tags to user-friendly and formatted text for presentation.
    vis.genres = {
        'All Genres': 'All Genres',
        'young_adult': 'Young Adult',
        'science_fiction': 'Science Fiction',
        'paranormal': 'Paranormal',
        'children': 'Children',
        'romance': 'Romance',
        'thriller': 'Thriller',
        'historic': 'Historical',
        'fantasy': 'Fantasy',
    };
// Object which has the one liner narrative about each genre trend
    vis.genreTrendStory = {
        'All Genres': 'We can see color diversity after 1920 marking the rise of color and color printing.',
            //Reference - https://harvardmagazine.com/2010/07/rise-of-color
        'young_adult': 'Close to 80% of the books published between 1925 and 1930 in our sample use shades of blue.',
        'science_fiction': 'The usage of blue shades seem to follow a the seasonal pattern',
        'paranormal': 'Paranormal books predominantly use shades of red, orange, blue and black.',
        'children': "Children's books seem to use lots of vibrant hues such as yellows and blues and less darker tones.",
        'romance': 'Usage of red and pink shades remain consistent across the years.',
        'thriller': 'It is not a surprise to see how pervasive the usage of red is for thriller genre.',
        'historic': 'It is interesting to note how common black shades are over the years',
        'fantasy': 'Oranges and blues are most predominant and their usage is consistent across years.',
    };

    // Set margin and svg drawing area.
    vis.margin = {top: 100, right: 10, bottom: 10, left: 10},
        vis.width = $("#" + vis.parentElement).width()  - vis.margin.left - vis.margin.right,
        vis.height = 800 - vis.margin.top - vis.margin.bottom;
    // Draw SVG Element.
    vis.svg = d3.select("#" + vis.parentElement)
        .append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom);
    // Define Scales
    vis.x = d3.scaleBand()
        .domain(vis.year_ranges)
        .rangeRound([0, 0.75*vis.width]);
    vis.y = d3.scaleLinear()
        .domain([0,1])
        .rangeRound([vis.height - 230, 0]);
    // Define area
    vis.area = d3.area()
        .curve(d3.curveBasis)
        .x(function(d) {
            return vis.x(d.data.year_range); })
        .y0(function(d) { return vis.y(d[0]); })
        .y1(function(d) { return vis.y(d[1]); });
    //Define the stack area plotter. Plot only totals by default.
    vis.stack = d3.stack()
        .keys(Object.keys(vis.colorMap));
    var series = vis.stack(vis.data.filter(function(d){return d.genre === 'total';}));
    // Draw stacked area
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
        .attr("transform", "translate(150,125)");
    // Plot X axis
    vis.svg.append("g")
        .attr("class", "x_axis")
        .attr("transform", "translate(140,585)")
        .call(d3.axisBottom(vis.x).ticks(20))
        .selectAll("text")
        .style("text-anchor", "end")
        .style("font-size", 12)
        .attr('fill', '#A8A8A8')
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-65)");
    // Plot Y axis
    vis.svg.append("g")
        .attr("class", "y_axis")
        .call(d3.axisLeft(vis.y).tickFormat(d3.format(".0%")))
        .attr("transform", "translate(155,125)")
        .selectAll("text")
        .style("font-size", 12)
        .attr('fill', '#A8A8A8');
    // Plot X axis labels
    vis.svg.append("text")
        .attr("class", "x_axis_label")
        .text("Years")
        .attr("transform", "translate("+ (vis.width/2 + 30) +",675)");
    // Plot Y axis labels
    vis.svg.append("text")
        .attr("class", "y_axis_label")
        .text("Count Distribution %")
        .attr("transform", "translate(100,425) rotate(270)")
        .attr('fill', 'grey');
    // Add default header for the stack bar.
    vis.svg
        .append("text")
        .attr("class", "stack-header section-title")
        .text("All Genres - Color Usage Trends")
        .attr("transform", "translate(150,75)");

    vis.svg
        .append("text")
        .attr("class", "stack-descriptions")
        .text("We can see color diversity after 1920 marking the rise of color and color printing.")
        .attr("transform", "translate(150,100)");

    //Set up the hover functionality. This dims the paths not selected and highlights the chosen path.
    vis.svg
        .selectAll(".stacked_bar")
        .on('mouseover', function(d) {
            var chosenOne = this;
            d3.selectAll('.stacked_bar').transition()
                .style('opacity',function () {return (this === chosenOne) ? 1.0 : 0.1;})
                .attr('stroke',function () {return (this === chosenOne) ? '#DCDCDC': 'none';});
        })
        .on('mouseout',function(d) {
            d3.selectAll('.stacked_bar').transition()
                .style("opacity", 0.8)
                .attr("stroke", "none");
        });
//Call the update Stack function.
    vis.updateStack();
};
/*
 * Update visualization when called with updated data.
 */
StackedArea.prototype.updateStack = function () {
    var vis = this;
    // Update Series
    var series = vis.stack(vis.updated_data);
    // Update the chart.
    vis.svg.selectAll(".stacked_bar")
        .select('.area')
        .data(series)
        .transition()
        .duration(1000)
        .attr("d", vis.area);
};
/*
 * This sets the updated data according to the new selection and calls the update stack function.
 */
StackedArea.prototype.selectionChanged = function (filteredData) {
    var vis = this;
    // Compute the new title value.
    vis.updated_data = filteredData;
    vis.selected_genre = vis.genres[window.genre];
    // Remove any existing headers and descriptions.
    d3.selectAll(".stack-header")
        .remove();
    d3.selectAll(".stack-descriptions")
        .remove();
    // Update chart header.
    vis.svg
        .append("text")
        .attr("class", "stack-header section-title")
        .html(vis.selected_genre + ' - Color Usage Trends')
        .attr("transform", "translate(150,75)");

    vis.svg
        .append("text")
        .attr("class", "stack-descriptions")
        .html(vis.genreTrendStory[window.genre])
        .attr("transform", "translate(150,100)");
    // Update the visualization.
    vis.updateStack();
};