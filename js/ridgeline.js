
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

    vis.margin = { top: 100, right: 100, bottom: 20, left: 60 };

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
        .domain([2.5, 5])
        .range([ 0, vis.width ]);
    vis.svg.append("g")
        .attr("transform", "translate(0," + vis.height + ")")
        .call(d3.axisBottom(vis.x));

    // Create a Y scale for densities
    vis.y = d3.scaleLinear()
        .range([ vis.height/10, 0]);

    // Create the Y axis for names
    vis.yName = d3.scaleBand()
        .domain(vis.categories)
        .range([0, vis.height])
        .paddingInner(1);
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
    //var kde = kernelDensityEstimator(kernelEpanechnikov(9), vis.x.ticks(40)) // increase this 40 for more accurate density.
    vis.allDensity = [];
    for (i = 0; i < n; i++) {
        var key = vis.categories[i]
        var category_data = vis.data.filter(function(d) {
            if (genre === "total") {
                return d["dominantColorCategory"] === key;
            } else {
                return d["dominantColorCategory"] === key && d["tags"].includes(genre);
            }
        })

       // console.log(key + " " + category_data.length);
       // var ratings = category_data.map(function(d){  return +d["average_rating"]});

        // // set the parameters for the histogram
        var histogram = d3.histogram()
            .value(function(d){  return +d["average_rating"]})   // I need to give the vector of value
            .domain(vis.x.domain())  // then the domain of the graphic
            .thresholds(vis.x.ticks(30)); // then the numbers of bins

        var bins = histogram(category_data);

        vis.allDensity.push({key: key, bins: bins});



    //     console.log(ratings);
    //     var density = kde(ratings);
    //     vis.allDensity.push({key: key, density: density})
    }

    // console.log(vis.allDensity);
    // Update the visualization
    vis.updateVis();
}


/*
 * The drawing function
 */

RidgeLine.prototype.updateVis = function(){
    var vis = this;
    
    
    
    vis.y.domain([0, d3.max(vis.allDensity, function (d) {
        return d3.max(d.bins, function (b) {
            return b.length;
        })
    })])
    

    vis.update = vis.svg.selectAll(".areas")
        .data(vis.allDensity);

    vis.areasenter = vis.update.enter()
        .append("g")
        .attr("class", "areas")

    vis.areas = vis.areasenter.merge(vis.update);

    vis.areas
        .transition()
        .attr("transform", function(d){
        return("translate(0," + (vis.yName(d.key) - vis.yName.step()) +")" )
    });

    vis.tip = d3.tip().attr("class", "tooltip")
        .html(function(d) {
            return d.bin.length;
        })

    vis.areas.call(vis.tip);


    vis.rect_selection = vis.areas.selectAll("rect")
        .data(function (d) {
            return d.bins.map(function (bin) {
                return {
                    'x0': bin.x0,
                    'x1': bin.x1,
                    'bin': bin,
                    'color': d.key
                }
            })
        })

    vis.rects = vis.rect_selection.enter()
        .append("rect")
        .attr("class", "ridgeline-bars")
        .merge(vis.rect_selection);

    vis.rects.transition();

    vis.rects.attr("x", 1)
        .attr("transform", function(d) { return "translate(" + vis.x(d.x0) + "," + vis.y(d.bin.length) + ")"; })

        .on('mouseover', vis.tip.show)
        .on('mouseout', vis.tip.hide)

        .attr("width", function(d) {
            var numbins = 26;
            if (numbins > 0) {
                var barWidth = vis.width / numbins - 1;

            return barWidth
            } else {
            return 0;
            };
        })
        .attr("height", function(d) { return vis.height/10 - vis.y(d.bin.length); })
        .attr("fill", function (d) {
            return vis.colorMap[d.color];
        });


    vis.rects.exit().remove();
    
}


