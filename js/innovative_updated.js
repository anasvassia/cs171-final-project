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

    // Set margin and svg drawing area.
     vis.margin = {top: 10, right: 50, bottom: 10, left: 10},
        vis.width = 950 - vis.margin.left - vis.margin.right,
        vis.height = 850 - vis.margin.top - vis.margin.bottom,
        vis.outerRadius = Math.min(vis.width, vis.height) /5,
        //  vis.outerRadius = 110,
         vis.mainRadius = 300, vis.mainCirclex = vis.width/2,
         vis.mainCircley = vis.height/2, vis.subRadius =20;

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
        .rangeRound([280, 0]);

    vis.areax = d3.scaleBand()
        .domain(vis.year_ranges)
        .rangeRound([0, 500])
        .padding(0.3)
        .align(0.3);

    vis.smallcirclerad = d3.scaleLinear().domain([0,1]).range([6,25]);

    var circlexval= [], circleyval = [];
    vis.genres.forEach(function(d,i){circlexval.push(vis.mainCirclex + Math.sin(i*45* Math.PI/180)* vis.mainRadius)});
    vis.genres.forEach(function(d,i){circleyval.push(vis.mainCircley - Math.cos(i*45* Math.PI/180)* vis.mainRadius)});

    vis.subcenterx = circlexval;
    vis.subcentery = circleyval;

    vis.reach = 4;

    // Draw the circular structure.
    vis.circleplotter = function(array_index, key_val, data ) {
        array_index.slice(key_val, key_val + 8).forEach(function (d, index) {
            //
            var edgex = vis.subcenterx[key_val] + Math.sin(d * 23 * Math.PI / 180) * (vis.subRadius + (18 - index) * vis.reach);
            var edgey = vis.subcentery[key_val] - Math.cos(d * 23 * Math.PI / 180) * (vis.subRadius + (18 - index) * vis.reach);
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
                .attr("fill",data[index].key)
                .attr("stroke", '#E8E8E8');
        })};

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

        // Compute percentages
        countColors.forEach(function(d) {d.percentage = d.value / filtered.length;});
        // Sort values
        countColors.sort(function(a,b){return b.value - a.value});
        //Collect all values.
        summarybygenre.push(countColors);
    });
vis.summarybygenre = summarybygenre;

//On click event handler for filters
    /////////////////// (Placeholder)
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
    // // Update the visualization
    vis.updateVis();
};

InnovativeView.prototype.updateVis = function (){


    var vis = this;
    vis.areay.domain([0, 120]);

    var stack = d3.stack()
        .keys(vis.colorgroups);
    var series = stack(vis.aggregatedAreaData);

    vis.summarybygenre.forEach(function(d, i){
        vis.circleplotter([...Array(18).keys()],i,d);
    });

    // Draw subcircles spaced at 45 degrees
    vis.svg.selectAll(".sub-circle")
        .data(vis.genres)
        .enter()
        .append("circle")
        .attr("class", "sub-circle")
        .attr("cx", function(d,i){return vis.mainCirclex + Math.sin(i*45* Math.PI/180)* vis.mainRadius})
        .attr("cy", function(d, i){return vis.mainCircley - Math.cos(i*45* Math.PI/180)* vis.mainRadius})
        .attr("r", vis.subRadius)
        .attr("fill", "white")
        .style("stroke", "pink");

    //Draw the stacked bar chart
    vis.svg
        .selectAll(".stacked_bar")
        .data(series)
        .enter()
        .append("g")
        .attr("class", "stacked_bar")
        .attr("fill", function(d){return d.key})
        .selectAll("rect")
        .data(function(d) { return d; })
        .enter().append("rect")
        .attr("x", function(d) { return vis.areax(d.data.year_range); })
        .attr("y", function(d) { return vis.areay(d[1]); })
        .attr("height", function(d) { return (vis.areay(d[0]) - vis.areay(d[1])); })
        .attr("width",vis.areax.bandwidth())
        .attr("stroke", 'grey')
        .attr("transform", "translate(175,150)");

};