/*
 * Innovative View - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the bar charts
 * @param _data						-- the dataset 'book aesthetic analysis'
 */
InnovativeView = function (_parentElement, _data, _genrebyyear, _summarybygenre, _selectedBook) {
    this.parentElement = _parentElement;
    this.data = _data;
    this.summarybygenre = _summarybygenre;
    this.genrebyyear = _genrebyyear;
    this.year_ranges = [...new Set(_data.map(x => x.year_range))].sort();
    this.selectedBook = _selectedBook;
    this.initVis();
    console.log(vis.selectedBook);
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
        "white": "#f5f5f5",
        "black": "#433d39",
        "gray": "#736f6c"
    };

    vis.genres = {
        'young_adult': 'Young Adult',
        'science_fiction': 'Science Fiction',
        'thriller': 'Thriller',
        'children': 'Children',
        'romance': 'Romance',
        'paranormal': 'Paranormal',
        'historic': 'Historical',
        'fantasy': 'Fantasy',
    };

// Set margin and svg drawing area.
    vis.margin = {top: 10, right: 20, bottom: 10, left: 10},
        vis.width  = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right,
        vis.height = 900 - vis.margin.top - vis.margin.bottom,
        vis.outerRadius = Math.min(vis.width, vis.height) /5,
        vis.mainRadius = 245, vis.mainCirclex = vis.width/2,
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

    // Scale for the color circles per genre
    vis.ColorCircleRadScale = d3.scaleLinear().domain([0,100]).range([4,40]);

    // NEEDS TO BE UPDATED.
    vis.areay = d3.scaleLinear()
        .rangeRound([100, 0]);

    vis.areax = d3.scaleBand()
        .domain(vis.year_ranges)
        .rangeRound([0, 400])
        .padding(0.4)
        .align(0.3);

    // Identify the position of each sub-circle which represents a genre. Since we are showing top 8 genres, we have
    // 8 circles, spaced 45 degrees apart.
    vis.genrecirclelocation = [];

    vis.summarybygenre.forEach(function(d,i){
        var genreCircleMetadata = {};
        genreCircleMetadata['genre-circle-cx'] = vis.mainCirclex + Math.sin(i*45* Math.PI/180)* vis.mainRadius;
        genreCircleMetadata['genre-circle-cy'] = vis.mainCircley - Math.cos(i*45* Math.PI/180)* vis.mainRadius;
        genreCircleMetadata['line-start-x'] = vis.mainCirclex + Math.sin(i*45* Math.PI/180)* vis.mainRadius * 1.38;
        genreCircleMetadata['line-start-y'] = vis.mainCircley - Math.cos(i*45* Math.PI/180)* vis.mainRadius * 1.38;
        genreCircleMetadata['line-end-x'] = vis.mainCirclex + Math.sin(i*45* Math.PI/180)* vis.mainRadius * 1.5;
        genreCircleMetadata['line-end-y'] = vis.mainCircley - Math.cos(i*45* Math.PI/180)* vis.mainRadius * 1.5;
        genreCircleMetadata['color-circle-cx'] = [];
        genreCircleMetadata['color-circle-cy'] = [];
        vis.genrecirclelocation.push(genreCircleMetadata)
    });

    // Set the spoke length and angular seperation.
    vis.reach = 4;
    vis.angle = 18;

    vis.summarybygenre.forEach(function(d,i){

        d.color.forEach(function(color, index)
            {
                vis.genrecirclelocation[i]['color-circle-cx'].push(vis.genrecirclelocation[i]['genre-circle-cx'] + Math.sin(d.angle_index[index] * vis.angle * Math.PI / 180) * (vis.subRadius + (20 - index) * vis.reach));
                vis.genrecirclelocation[i]['color-circle-cy'].push(vis.genrecirclelocation[i]['genre-circle-cy'] - Math.cos(d.angle_index[index] * vis.angle * Math.PI / 180) * (vis.subRadius + (20 - index) * vis.reach));
                // Plot the lines
                var linedata = [{"x": vis.genrecirclelocation[i]['genre-circle-cx'], "y": vis.genrecirclelocation[i]['genre-circle-cy']}, {"x": vis.genrecirclelocation[i]['color-circle-cx'][index], "y": vis.genrecirclelocation[i]['color-circle-cy'][index]}];
                var lineFunction = d3.line()
                    .x(function (d) {return d.x;})
                    .y(function (d) {return d.y;});
                vis.svg.append("path")
                    .attr("d", lineFunction(linedata))
                    .attr("class", d.genre + " spokes")
                    .attr("stroke", "#DCDCDC")
                    .attr("stroke-width", 1)
                    .attr("fill", "none");

                var tip_circles = d3.tip()
                    .attr('class', 'd3-tip-circles tooltip')
                    .offset([-5, 10])
                    .html(function() {
                        return "<span style='color:grey'> <span class='tooltip-percent'>" +
                            d.percentage[index]+ "</span>% of " +
                            vis.genres[d['genre']]
                        + ' covers <br> have shades of'
                        + '<div class = "tooltip-color" style="color:' +  vis.colorMap[color] + '">' + color + "</div> </span>";
                    });

                vis.svg.call(tip_circles);
                // Plot the color circles
                vis.svg.append("circle")
                    .attr("class",  d.genre +' ' + color+' colorcircle')
                    .attr("cx", vis.genrecirclelocation[i]['color-circle-cx'][index])
                    .attr("cy", vis.genrecirclelocation[i]['color-circle-cy'][index])
                    .attr("r", vis.ColorCircleRadScale(d.percentage[index]))
                    .attr("fill",vis.colorMap[color])
                    .on('mouseover', tip_circles.show)
                    .on('mouseout', tip_circles.hide)
                    .attr("stroke", '#E8E8E8');

            });
    });

    //Draw 8 genre circles spaced 45 degrees apart.
    vis.svg.selectAll(".sub_circle")
        .data(vis.summarybygenre)
        .enter()
        .append("circle")
        .attr("class", function(d){return d['genre']+" sub_circle"})
        .attr("cx", function(d,i){return vis.mainCirclex + Math.sin(i*45* Math.PI/180)* vis.mainRadius})
        .attr("cy", function(d, i){return vis.mainCircley - Math.cos(i*45* Math.PI/180)* vis.mainRadius})
        .attr("r", vis.subRadius)
        .attr("fill", '#E8E8E8');

    //Add symmetric call-out connectors
    vis.genrecirclelocation.forEach(
        function(d, i){
            var linedata = [{"x": d['line-start-x'], "y": d['line-start-y']},
                {"x": d['line-end-x'], "y": d['line-end-y']}];
            var lineFunction = d3.line()
                .x(function (d) {return d.x;})
                .y(function (d) {return d.y;});
            vis.svg.append("path")
                .attr("d", lineFunction(linedata))
                .attr("class", vis.summarybygenre[i]['genre']+" callout")
                .attr("stroke", '#DCDCDC')
                .attr("stroke-width", 2)
                .attr("fill", "none");});

    var label_offset_y = [-10, -10, 5, 15, 15, 15, 5, -10];

    //Add Genre names
vis.svg.selectAll('.genre-label')
    .data(vis.summarybygenre)
    .enter()
    .append("text")
    .attr("class", function(d) {return d.genre + " genre-label"})
    .attr("x", function(d,i){return vis.genrecirclelocation[i]['line-end-x']})
    .attr("y", function(d,i){return vis.genrecirclelocation[i]['line-end-y'] + label_offset_y[i]})
    .attr("text-anchor",function(d,i){ if(i ===2){return 'middle'} else if (i === 6){return "middle"} else {return "middle"}})
    .text(function(d){return vis.genres[d['genre']]});

    // Add legend title
    vis.svg
        .append("text")
        .attr("class", "legend-title")
        .attr("x", vis.mainCirclex)
        .attr('y', vis.mainCircley - 140)
        .attr("text-anchor", 'middle')
        .text('Color Usage across 8 Genre Book Covers');

    // Add legend text
    vis.svg
        .append("foreignObject")
        .attr('class', 'legend-details')
        .attr("x", vis.width/4.3)
        .attr('y', vis.mainCircley - 125)
        .attr('height', 160)
        .attr('width', 425)
        .text("We analyzed books from 8 most common genres published between 1900 and 2017 and extracted the most dominant " +
            "color. We've custom designed a hub & spoke' visual to represent each genre. " +
            "The center represents a genre and spoke length & area of the colored circles represent the " +
            "color prevalence in a genre. Click on the circles to learn more about color prevalence trends. Click on the white space to clear " +
            "filters.");

    // Add a sample drawing for legend
   var legend_loc_x = vis.mainCirclex - 50;
   var legend_loc_y = vis.mainCircley + 100;
   var legend_scale = d3.scaleLinear().domain([0,100]).range([2,30]);

   var legend_spoke_location = {}, legend_reach = 3;
    legend_spoke_location['color-circle-cx'] = [];
    legend_spoke_location['color-circle-cy'] = [];
    // Draw the hub and spoke.
    vis.summarybygenre[0].color.forEach(function(color, index) {
        legend_spoke_location['color-circle-cx'].push(legend_loc_x + Math.sin(vis.summarybygenre[0].angle_index[index] * vis.angle * Math.PI / 180) * (vis.subRadius + (20 - index) * legend_reach));
        legend_spoke_location['color-circle-cy'].push(legend_loc_y - Math.cos(vis.summarybygenre[0].angle_index[index] * vis.angle * Math.PI / 180) * (vis.subRadius + (20 - index) * legend_reach));
        // Plot the lines
        var linedata_legend = [{"x": legend_loc_x, "y": legend_loc_y},
            {"x": legend_spoke_location['color-circle-cx'][index], "y": legend_spoke_location['color-circle-cy'][index]}];
        var lineFunction_legend = d3.line()
            .x(function (d) {return d.x;})
            .y(function (d) {return d.y;});
        vis.svg.append("path")
            .attr("d", lineFunction_legend(linedata_legend))
            .attr("class", 'legend')
            .attr("stroke", "#E8E8E8")
            .attr("stroke-width", 1)
            .attr("fill", "none");
        vis.svg.append("circle")
            .attr("class",  'legend')
            .attr("cx", legend_spoke_location['color-circle-cx'][index])
            .attr("cy", legend_spoke_location['color-circle-cy'][index])
            .attr("r", legend_scale(vis.summarybygenre[0].percentage[index]))
            .attr("fill",vis.colorMap[color])
            .attr("stroke", '#E8E8E8');

    });
   vis.svg
       .append("circle")
       .attr("class", "legend")
       .attr("cx",legend_loc_x)
       .attr("cy",legend_loc_y)
       .attr("r", vis.subRadius)
       .attr("fill", '#E8E8E8');
   // Draw the callout arrows
    var legend_arrow_data =[
        [
            {'x': legend_spoke_location['color-circle-cx'][0],'y': legend_spoke_location['color-circle-cy'][0]},
            {'x': legend_spoke_location['color-circle-cx'][0],'y': legend_spoke_location['color-circle-cy'][0] + 60},
            {'x': legend_spoke_location['color-circle-cx'][0] + 120,'y': legend_spoke_location['color-circle-cy'][0] + 60}
        ],
        [
            {'x': legend_spoke_location['color-circle-cx'][0] + 40,'y': legend_spoke_location['color-circle-cy'][0]},
            {'x': legend_spoke_location['color-circle-cx'][0] + 40,'y': legend_spoke_location['color-circle-cy'][0] + 40},
            {'x': legend_spoke_location['color-circle-cx'][0] + 120,'y': legend_spoke_location['color-circle-cy'][0] + 40}
        ],
        [
            {'x': legend_loc_x,'y': legend_loc_y},
            {'x': legend_loc_x,'y': legend_loc_y + 20},
            {'x': legend_loc_x + 45,'y': legend_loc_y + 20}
        ]
    ];

    var lineFunction_legend = d3.line()
        .x(function (d) {return d.x;})
        .y(function (d) {return d.y;});

    var callout_text = ['Color prominance as area', 'Spoke length as prominance ranks', 'Genre'];

    legend_arrow_data.forEach(function(d, i)
        {
            vis.svg
                .append("path")
                .attr("d", lineFunction_legend(d))
                .attr("class", 'legend legend-arrow')
                .attr("stroke", '#A0A0A0')
                .attr("stroke-width", 1)
                .attr("stroke-dasharray", [3,3])
                .attr("fill", "none");

            vis.svg
                .append("text")
                .attr("class", "legend legend-arrow-text")
                .attr('x', function(){return d[2]["x"]})
                .attr('y', function(){return d[2]["y"]})
                .text(function(){return callout_text[i]});

        }
    );

// Do data wrangling.
    vis.wrangleData();
};

/*
 * Data wrangling
 */
InnovativeView.prototype.wrangleData = function () {
    var vis = this;
    vis.updateVis();
};

InnovativeView.prototype.updateVis = function (){

    var vis = this;
    // user's book selection
    // console.log(vis.selectedBook);

};