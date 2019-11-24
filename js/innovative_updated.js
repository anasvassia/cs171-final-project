/*
 * Innovative View - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the bar charts
 * @param _data						-- the dataset 'book aesthetic analysis'
 */
InnovativeView = function (_parentElement, _data, _genres) {
    this.parentElement = _parentElement;
    this.data = _data;
    this.genres = _genres;
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

    vis.smallcirclerad = d3.scaleLinear().domain([0,1]).range([6,25]);

    var circlexval= [], circleyval = [];
    vis.genres.forEach(function(d,i){circlexval.push(vis.mainCirclex + Math.sin(i*45* Math.PI/180)* vis.mainRadius)});
    vis.genres.forEach(function(d,i){circleyval.push(vis.mainCircley - Math.cos(i*45* Math.PI/180)* vis.mainRadius)});

    vis.subcenterx = circlexval;
    vis.subcentery = circleyval;

    vis.reach = 3;

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
    var summarybygenre = [];

    vis.genres.forEach(function(genre){
        var filtered = vis.data.filter(function(d){return d["tags"].includes(genre);});
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
    });
vis.summarybygenre = summarybygenre;
    // // Update the visualization
    vis.updateVis();
};

InnovativeView.prototype.updateVis = function (){

    var vis = this;

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


    //
    // vis.svg.selectAll(".edgeCircle")
    //     .data(vis.summarybygenre)
    //     .attr("r", function(d){return d*vis.smallcirclerad(d.percentage)});

    // vis.summarybygenre.forEach(function(d,i){
    //     //update domain
    //     vis.circlex.domain(d.map(function(summary) { return summary.key; }));
    //     //Identify the location of the radial plot
    //     var num1 = vis.mainCirclex + Math.sin(i*45* Math.PI/180)* vis.mainRadius;
    //     var num2 = vis.mainCircley - Math.cos(i*45* Math.PI/180)* vis. mainRadius;
    //     //Draw radial barplot
    //     vis.svg.append("g")
    //         .attr("transform", "translate("+num1+","+ num2+") rotate("+ i*45+ ")")
    //         .selectAll("path")
    //         .data(d)
    //         .enter()
    //         .append("path")
    //         .attr("class","circular_bars")
    //         .attr("fill", function(d){if(d.key==='missing') {return 'grey'} else {return d.key}})
    //         .attr("stroke", '#e0e0e0')
    //         .attr("d", d3.arc()
    //             .innerRadius(vis.subRadius)
    //             .outerRadius(function(d) { return vis.circley(d['percentage']); })
    //             .startAngle(function(d) { return vis.circlex(d.key); })
    //             // .endAngle(function(d) { return vis.circlex(d.key) + vis.circlex.bandwidth(); })
    //             .endAngle(function(d) { return vis.circlex(d.key) + 0.2 })
    //             .padAngle(0)
    //             .padRadius(vis.subRadius));
    // })
};
