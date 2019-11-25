/*
 * Innovative View - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the bar charts
 * @param _data						-- the dataset 'book aesthetic analysis'
 */
InnovativeView = function (_parentElement, _data) {
    this.parentElement = _parentElement;
    this.data = _data;
    this.genres = ['science-fiction', 'fantasy', 'romance', 'fiction', 'young-adult', 'thriller', 'paranormal', 'childrens'];
    this.year_ranges = [...new Set(_data.map(x => x.year_range))].sort();
    this.initVis();
};

/*
 * Initialize visualization (static content; e.g. SVG area, scales)
 */
InnovativeView.prototype.initVis = function () {
    var vis = this;

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

    // Set margin and svg drawing area.
    vis.margin = {top: 10, right: 50, bottom: 10, left: 10},
        vis.width = 800 - vis.margin.left - vis.margin.right,
        vis.height = 700 - vis.margin.top - vis.margin.bottom,
        vis.outerRadius = Math.min(vis.width, vis.height) /5,
        vis.mainRadius = 225, vis.mainCirclex = vis.width/2,
        vis.mainCircley = vis.height/2, vis.subRadius =15;

    // Draw SVG Element.
    vis.svg = d3.select("#" + vis.parentElement)
        .append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom);

    // Draw main circle
    vis.svg.append("circle")
        .attr("class", "main-circle")
        .attr("cx", vis.mainCirclex)
        .attr("cy", vis.mainCircley)
        .attr("r", vis.mainRadius)
        .attr("fill", "none")
        .style("stroke-dasharray","2,2")
        .style("strokewidth","0.5")
        .style("stroke", "#DCDCDC");

    vis.circlex = d3.scaleBand()
        .range([0, 2 * Math.PI]);

    vis.circley = d3.scaleRadial()
        .range([vis.subRadius, vis.outerRadius])
        .domain([0, 1]);

    vis.areay = d3.scaleLinear()
        .rangeRound([100, 0]);

    vis.areax = d3.scaleBand()
        .domain(vis.year_ranges)
        .rangeRound([0, 400])
        .padding(0.4)
        .align(0.3);

    vis.smallcirclerad = d3.scaleLinear().domain([0,1]).range([4,15]);

    // Grab the color circle radii
    var circlexval= [], circleyval = [];
    vis.genres.forEach(function(d,i){circlexval.push(vis.mainCirclex + Math.sin(i*45* Math.PI/180)* vis.mainRadius)});
    vis.genres.forEach(function(d,i){circleyval.push(vis.mainCircley - Math.cos(i*45* Math.PI/180)* vis.mainRadius)});
    vis.subcenterx = circlexval;
    vis.subcentery = circleyval;

    // Set the spoke length
    vis.reach = 3;

    // Draw the color structure.
    vis.circleplotter = function(array_index, key_val, data ) {

        // test code for rotational symmetry. TO BE REPLACED.
        var test = 0;
        if (key_val > 3){test = key_val + 5 } else {test = key_val};

        array_index.slice(test, test + 8).forEach(function (d, index) {

        // array_index.slice(key_val, key_val + 8).forEach(function (d, index) {
            //
            var edgex = vis.subcenterx[key_val] + Math.sin(d * 20 * Math.PI / 180) * (vis.subRadius + (18 - index) * vis.reach);
            var edgey = vis.subcentery[key_val] - Math.cos(d * 20 * Math.PI / 180) * (vis.subRadius + (18 - index) * vis.reach);
            //

            var linedata = [{"x": vis.subcenterx[key_val], "y": vis.subcentery[key_val]}, {"x": edgex, "y": edgey}];

            //
            var lineFunction = d3.line()
                .x(function (d) {
                    return d.x;
                })
                .y(function (d) {
                    return d.y;
                });
            //
            vis.svg.append("path")
                .attr("d", lineFunction(linedata))
                .attr("class", "spokes")
                .attr("stroke", "#DCDCDC")
                .attr("stroke-width", 1)
                .attr("fill", "none");
            //
            vis.svg.append("circle")
                .attr("class", data[index].key+' edgecircle')
                .attr("cx", edgex)
                .attr("cy", edgey)
                .attr("r", vis.smallcirclerad(data[index].percentage))
                .attr("fill",vis.colorMap[data[index].key])
                .attr("stroke", '#E8E8E8');
        })};

    //Draw the genre circles.
    vis.svg.selectAll(".sub_circle")
        .data(vis.genres)
        .enter()
        .append("circle")
        .attr("class", function(d){return d+"_subcircle sub_circle"})
        .attr("cx", function(d,i){return vis.mainCirclex + Math.sin(i*45* Math.PI/180)* vis.mainRadius})
        .attr("cy", function(d, i){return vis.mainCircley - Math.cos(i*45* Math.PI/180)* vis.mainRadius})
        .attr("r", vis.subRadius)
        .attr("fill", '#E8E8E8')
        .attr("opacity", 1);


    vis.wrangleData();
};

/*
 * Data wrangling
 */
InnovativeView.prototype.wrangleData = function () {

    var vis = this;
    var summarybygenre = [], aggregatedAreaData = [], reshapedAreaDataStage = [], reshapedAreaData = [];

    vis.data = vis.data.filter(function(d){return d.dominant_color_categorized !== 'missing'});

    vis.colorgroups = ["black", "orange", "white","green", "blue", "red",  "violet", "yellow"];

    vis.genres.forEach(function(genre){
        var filtered = vis.data.filter(function(d){return d["tags"].includes(genre);});
        filtered.forEach(function(row){row.genre_key = genre;});
        // Aggregate values
        var countColors = d3.nest()
            .key(function(d) { return d.dominant_color_categorized; })
            .rollup(function(leaves) { return leaves.length; })
            .entries(filtered);

        // Compute percentages
        countColors.forEach(function(d) {d.percentage = d.value / filtered.length;});
        // Sort values
        countColors.sort(function(a,b){return b.value - a.value});
        //Collect all values.
        summarybygenre.push(countColors);

        var countColorsArea = d3.nest()
            .key(function(d) { return d.year_range; })
            .key(function(d) { return d.dominant_color_categorized; })
            .rollup(function(leaves) { return leaves.length; })
            .entries(filtered);
        countColorsArea.forEach(function(year_count)
        {
            var record = {};
            year_count["values"].forEach(
                function(d){
                    record.year_range = year_count["key"];
                    record.genre = genre;
                    record.color = d.key;
                    record.count = d.value;
                });
            aggregatedAreaData.push(record)});


    });
    vis.summarybygenre = summarybygenre;

    aggregatedAreaData.sort(function(a,b){return (a.year_range > b.year_range) - (a.year_range < b.year_range)});

    reshapedAreaDataStage = d3.nest()
        .key(function(d){return d.year_range})
        .key(function(d){return d.color})
        .rollup(function(v) { return d3.sum(v, function(d) { return d.count; })})
        .entries(aggregatedAreaData);

    reshapedAreaDataStage.forEach(function(year){
        var record = {};
        record.year_range = year.key;
        vis.colorgroups.forEach(function(color){return record[color] = 0});
        year.values.forEach(function(d){
            vis.colorgroups.forEach(function(color){if(d.key === color){record[color] = d.value}});
        });
        reshapedAreaData.push(record);
    });
    vis.aggregatedAreaData = reshapedAreaData;
    vis.rawAggregatedAreaData = aggregatedAreaData;
    // // Update the visualization
    vis.updateVis();
};

InnovativeView.prototype.updateVis = function (){

    var vis = this;
    vis.areay.domain([0, 70]);

    var stack = d3.stack()
        .keys(vis.colorgroups);
    // var series = stack(vis.aggregatedAreaData);
    var series = stack(vis.aggregatedAreaData);

    vis.summarybygenre.forEach(function(d, i){
        vis.circleplotter([...Array(18).keys()],i,d);});

    //Draw the stacked bar chart
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
        .attr("x", function(d) { return vis.areax(d.data.year_range); })
        .attr("y", function(d) { return vis.areay(d[1]); })
        .attr("height", function(d) { return (vis.areay(d[0]) - vis.areay(d[1])); })
        .attr("width",vis.areax.bandwidth())
        .attr("stroke", 'grey')
        .attr("stroke-width", 0.3)
        .attr("transform", "translate(180,275)");

    //On click event handler for filters - On clicking genre function, the stack bar should update.
    vis.svg.selectAll(".sub_circle")
        .on("click", function() {
            //Identify the genre which the circle represents.
            var genre = d3.select(this).attr("class").split('_')[0];
            var filterReshaped = [];
            //FIlter the data for the genre.
            vis.filteredGenreData = vis.rawAggregatedAreaData.filter(function (d) {
                return d.genre === genre;
            });
            // Reshape each color as a column for stacked bar
            // Lekshmi -> TODO Ceate a function for this and clean up the code.
            var filterStage = d3.nest()
                .key(function (d) {
                    return d.year_range
                })
                .key(function (d) {
                    return d.color
                })
                .rollup(function (v) {
                    return d3.sum(v, function (d) {
                        return d.count;
                    })
                })
                .entries(vis.filteredGenreData);

            filterStage.forEach(function (year) {
                var record = {};
                record.year_range = year.key;
                vis.colorgroups.forEach(function (color) {
                    return record[color] = 0
                });
                year.values.forEach(function (d) {
                    vis.colorgroups.forEach(function (color) {
                        if (d.key === color) {
                            record[color] = d.value
                        }
                    });
                });
                filterReshaped.push(record);

            });
            filterReshaped.forEach(function(d)
            {
                var total = 0;
                vis.colorgroups.forEach(function(color)
                    {
                        total += d[color];
                    });
                d['total'] = total;
            });

            // Create the stack variable from reshaped data to draw the stacked bar.
            var filtered_series = stack(filterReshaped);

            // Update domain for y axis.
            vis.areay.domain(d3.extent(filterReshaped, function(d){return d.total;}));

            // Update bars
            vis.bars = vis.svg.selectAll(".stacked_bar")
                .data(filtered_series)
                .enter()
                .selectAll("rect")
                .data(function(d) { return d; });

            vis.bars
                .enter()
                .append("rect")
                .merge(vis.bars);

            // vis.bars
            //     .transition()
            //     .duration(500)
            //     .attr("x", function(d) { return vis.areax(d.data.year_range); })
            //     .attr("y", function(d) { return vis.areay(d[1]); })
            //     .attr("height", function(d) { return (vis.areay(d[0]) - vis.areay(d[1])); });

            vis.svg.selectAll(".stacked_bar")
                .data(filtered_series)
                .selectAll("rect")
                .data(function(d) { return d; })
                .transition()
                .duration(500)
                .attr("x", function(d) { return vis.areax(d.data.year_range); })
                .attr("y", function(d) { return vis.areay(d[1]); })
                .attr("height", function(d) { return (vis.areay(d[0]) - vis.areay(d[1])); });

            vis.bars.exit().remove();


        });
};