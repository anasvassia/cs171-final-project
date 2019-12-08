/*
References used to build the ridgeline- https://www.d3-graph-gallery.com/ridgeline.html
*/

/*
 * PrioVis - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the visualization
 * @param _data						-- the actual data: perDayData
 */

RidgeLine = function(_parentElement, _data, _enterHandler){
    this.parentElement = _parentElement;
    this.data = _data;
    this.enterHandler = _enterHandler;
    this.initVis();
}


/*
 * Initialize visualization (static content, e.g. SVG area or axes)
 */

RidgeLine.prototype.initVis = function(){
    var vis = this;

    vis.margin = { top: 100, right: 100, bottom: 20, left: 60 };

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
        "white": "#f5f5f5",
        "black": "#433d39",
        "gray": "#736f6c"
    };

    vis.categories = Object.keys(vis.colorMap);

    // Add X axis
    vis.x = d3.scaleLinear()
        .range([ 0, vis.width ]);

    // Create a Y scale for densities
    vis.y = d3.scaleLinear()
        .range([ vis.height/10, 0]);

    // Create the Y axis for names
    vis.yName = d3.scaleBand()
        .domain(vis.categories)
        .range([0, vis.height])
        .paddingInner(1);
    vis.svg.append("g")
        .call(d3.axisLeft(vis.yName))
        .attr("class", "data-label");


    // (Filter, aggregate, modify data)
    vis.wrangleData("total", true);
}


/*
 * Data wrangling
 */

RidgeLine.prototype.wrangleData = function(genre, rating){
    var vis = this;

    vis.param = rating ? "average_rating" : "ratings_count";


    vis.current_genre = genre;

    var n = vis.categories.length;

    if (genre != "total") {
        vis.filteredData = vis.data.filter(function (d) {
            return d["tags"].includes(genre);
        })
    } else {
        vis.filteredData = vis.data;
    }

    if (vis.param === "ratings_count") {
        vis.filteredData.sort(function(a, b) {
            return a["ratings_count"] - b["ratings_count"];
        })
        var l = vis.filteredData.length;
        var bound = l - Math.round(l*0.05);
        vis.filteredData = vis.filteredData.slice(0, bound);
    }

    vis.x.domain(d3.extent(vis.filteredData, function (d) {
        return d[vis.param];
    }))


    // Compute kernel density estimation for each column:
    //var kde = kernelDensityEstimator(kernelEpanechnikov(9), vis.x.ticks(40)) // increase this 40 for more accurate density.
    vis.allDensity = [];
    for (i = 0; i < n; i++) {
        var key = vis.categories[i]
        var category_data = vis.filteredData.filter(function(d) {
            return d["dominantColorCategory"] === key;

        })

       // console.log(key + " " + category_data.length);
       // var ratings = category_data.map(function(d){  return +d["average_rating"]});

        // // set the parameters for the histogram
        var histogram = d3.histogram()
            .value(function(d){  return +d[vis.param]})   // I need to give the vector of value
            .domain(vis.x.domain())  // then the domain of the graphic
            .thresholds(vis.x.ticks(30)); // then the numbers of bins

        var bins = histogram(category_data);

        vis.allDensity.push({key: key, bins: bins});
    }

    vis.totalDensity = [];
    for (i = 0; i < n; i++) {
        var key = vis.categories[i]
        var category_data = vis.data.filter(function(d) {
            return d["dominantColorCategory"] === key;

        })

        // // set the parameters for the histogram
        var histogram = d3.histogram()
            .value(function(d){  return +d[vis.param]})   // I need to give the vector of value
            .domain(vis.x.domain())  // then the domain of the graphic
            .thresholds(vis.x.ticks(30)); // then the numbers of bins

        var bins = histogram(category_data);

        vis.totalDensity.push({key: key, bins: bins});

    }


    vis.updateVis();
}


/*
 * The drawing function
 */

RidgeLine.prototype.updateVis = function(){
    var vis = this;


    vis.y.domain([0, d3.max(vis.totalDensity, function (d) {
        return d3.max(d.bins, function (b) {
            return b.length;
        })
    })])


    vis.update = vis.svg.selectAll(".areas")
        .data(vis.allDensity);

    vis.areasenter = vis.update.enter()
        .append("g")
        .attr("class", "areas");

    vis.areas = vis.areasenter.merge(vis.update);

    vis.areas
        .transition()
        .duration(1000)
        .attr("transform", function(d){
        return("translate(0," + (vis.yName(d.key) - vis.yName.step()) +")" )
    });

    vis.tip = d3.tip().attr("class", "tooltip");

    vis.areas.call(vis.tip);

    vis.areas.selectAll("rect.total-bars").remove();

    if (vis.current_genre != "total") {
        vis.totalRectSelection = vis.areas.selectAll("rect.total-bars")
            .data(function (d, i) {
                return vis.totalDensity[i].bins.map(function (bin) {
                    return {
                        'x0': bin.x0,
                        'x1': bin.x1,
                        'bin': bin,
                        'color': d.key
                    }
                })
            });

        vis.totalRects = vis.totalRectSelection.enter()
            .append("rect")
            .attr("class", "total-bars");


        vis.totalRects.attr("x", 1)
            .attr("transform", function (d) {
                return "translate(" + vis.x(d.x0) + "," + vis.y(d.bin.length) + ")";
            })
            .attr("width", function (d) {
                var numbins = vis.totalDensity[0].bins.length;
                if (numbins > 0) {
                    var barWidth = vis.width / numbins - 1;

                    return barWidth
                } else {
                    return 0;
                }
                ;
            })
            .attr("height", function (d) {
                return vis.height / 10 - vis.y(d.bin.length);
            })
            .attr("fill", function (d) {
                return "#ddd";
            });

        vis.totalRects.lower();

        vis.totalRects.transition().duration(1000);

    }


    vis.rect_selection = vis.areas.selectAll("rect.ridgeline-bars")
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

    vis.rect_selection.exit().remove();


    vis.rects = vis.rect_selection.enter()
        .append("rect")
        .attr("class", "ridgeline-bars")
        .merge(vis.rect_selection);


    var mouseover = function(d) {
        if (vis.param === "average_rating") {
            vis.tip.html(d.bin.length + " books with average " + d.x0 + " rating");
        } else {
            vis.tip.html(d.bin.length + " books with " + d.x0 + " reviews");
        }
        vis.tip.show(d);
        vis.enterHandler(vis.current_genre, d.color, [d.x0, d.x1], vis.param);
    }

    var mouseleave = function(d) {
        vis.tip.hide(d);
        console.log(vis.x.domain());
        vis.enterHandler(vis.current_genre, "total", vis.x.domain(), vis.param);
    }


    vis.rects.attr("x", 1)
        .attr("transform", function(d) { return "translate(" + vis.x(d.x0) + "," + vis.y(d.bin.length) + ")"; })

        .on('mouseover', mouseover)
        .on('mouseout', mouseleave)

        .attr("width", function(d) {
            var numbins = vis.allDensity[0].bins.length;
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
        })
        .style("stroke", function(d) {
            if (d.color === "white") {
                return "#ddd"
            }
        })
        .style('stroke-width', function(d) {
            if (d.color === "white") {
                return 1
            }
        });

    vis.rects.transition().duration(1000);


    vis.svg.select(".x-axis").remove();

    vis.svg.append("g")
        .attr("class", "x-axis data-label")
        .attr("transform", "translate(0," + vis.height + ")")
        .call(d3.axisBottom(vis.x));





}


