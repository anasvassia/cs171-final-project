
/*
 * PrioVis - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the visualization
 * @param _data						-- the actual data: perDayData
 */

RidgeLine = function(_parentElement, _data){
    this.parentElement = _parentElement;
    this.data = _data;

    this.initVis();
}


/*
 * Initialize visualization (static content, e.g. SVG area or axes)
 */

RidgeLine.prototype.initVis = function(){
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
    };

    vis.categories = Object.keys(vis.colorMap)

    // Add X axis
    vis.x = d3.scaleLinear()
        .domain([0, 5])
        .range([ 0, vis.width ]);
    vis.svg.append("g")
        .attr("transform", "translate(0," + vis.height + ")")
        .call(d3.axisBottom(vis.x));

    // Create a Y scale for densities
    vis.y = d3.scaleLinear()
        .domain([0, 0.2])
        .range([ vis.height, 0]);

    // Create the Y axis for names
    vis.yName = d3.scaleBand()
        .domain(vis.categories)
        .range([0, vis.height])
        .paddingInner(1)
    vis.svg.append("g")
        .call(d3.axisLeft(vis.yName));


    // (Filter, aggregate, modify data)
    vis.wrangleData("total");
}


/*
 * Data wrangling
 */

RidgeLine.prototype.wrangleData = function(genre){
    var vis = this;

    var n = vis.categories.length;

    // Compute kernel density estimation for each column:
    var kde = kernelDensityEstimator(kernelEpanechnikov(9), vis.x.ticks(40)) // increase this 40 for more accurate density.
    vis.allDensity = [];
    for (i = 0; i < n; i++) {
        var key = vis.categories[i]
        var category_data = vis.data.filter(function(d) { return d["dominantColorCategory"] === key; })
        console.log(key + " " + category_data.length);

        // set the parameters for the histogram
        var histogram = d3.histogram()
            .value(function(d){  return +d["average_rating"]})   // I need to give the vector of value
            .domain(vis.x.domain())  // then the domain of the graphic
            .thresholds(vis.x.ticks(40)); // then the numbers of bins

        var bins = histogram(category_data);

        vis.allDensity.push(bins);

    //     console.log(ratings);
    //     var density = kde(ratings);
    //     vis.allDensity.push({key: key, density: density})
    }

    console.log(vis.allDensity)
    // Update the visualization
    vis.updateVis();
}


/*
 * The drawing function
 */

RidgeLine.prototype.updateVis = function(){
    var vis = this;


    // var areas = vis.svg.selectAll(".areas")
    //     .data(vis.allDensity)
    //     .enter()
    //     .append("g")
    //     .attr("transform", function(d){return("translate(0," + (vis.yName(d.key)-vis.height - vis.yName.bandwidth()) +")" )});

    // areas.selectAll("rect")
    //     .data(bins)
    //     .enter()
    //     .append("rect")
    //     .attr("x", 1)
    //     .attr("transform", function(d) { return "translate(" + x(d.x0) + "," + y(d.length) + ")"; })
    //     .attr("width", function(d) { return x(d.x1) - x(d.x0) -1 ; })
    //     .attr("height", function(d) { return height - y(d.length); })
    //     .style("fill", "#69b3a2")


    // vis.svg.selectAll("areas")
    //     .data(vis.allDensity)
    //     .enter()
    //     .append("path")
    //     .attr("transform", function(d){return("translate(0," + (vis.yName(d.key)-vis.height - vis.yName.bandwidth()) +")" )})
    //     .attr("fill", function (d) {
    //         return vis.colorMap[d.key];
    //     })
    //     .datum(function(d){return(d.density)})
    //     .attr("stroke", "#000")
    //     .attr("stroke-width", 1)
    //     .attr("d",  d3.line()
    //         .curve(d3.curveBasis)
    //         .x(function(d) {
    //             return vis.x(d[0]); })
    //         .y(function(d) { return vis.y(d[1]); })
    //     )

}

function kernelDensityEstimator(kernel, X) {
    return function(V) {
        return X.map(function(x) {
            return [x, d3.mean(V, function(v) { return kernel(x - v); })];
        });
    };
}
function kernelEpanechnikov(k) {
    return function(v) {
        return Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0;
    };
}

