/*
 * Innovative View - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the bar charts
 * @param _data						-- the dataset 'book aesthetic analysis'
 */
InnovativeView = function (_parentElement, _data, _summarybygenre) {
    this.parentElement = _parentElement;
    this.data = _data;
    this.summarybygenre = _summarybygenre;
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
    vis.margin = {top: 10, right: 20, bottom: 10, left: 10},
        vis.width = 1100 - vis.margin.left - vis.margin.right,
        vis.height = 900 - vis.margin.top - vis.margin.bottom,
        vis.outerRadius = Math.min(vis.width, vis.height) /5,
        vis.mainRadius = 250, vis.mainCirclex = vis.width/2,
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
        genreCircleMetadata['line-start-x'] = vis.mainCirclex + Math.sin(i*45* Math.PI/180)* vis.mainRadius * 1.4;
        genreCircleMetadata['line-start-y'] = vis.mainCircley - Math.cos(i*45* Math.PI/180)* vis.mainRadius * 1.4;
        genreCircleMetadata['line-end-x'] = vis.mainCirclex + Math.sin(i*45* Math.PI/180)* vis.mainRadius * 1.56;
        genreCircleMetadata['line-end-y'] = vis.mainCircley - Math.cos(i*45* Math.PI/180)* vis.mainRadius * 1.56;
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
                .attr("stroke", "#DCDCDC")
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
    .attr("text-anchor",function(d,i){ if(i ===2){return 'start'} else if (i === 6){return "end"} else {return "middle"}})
    .text(function(d){return vis.genres[d['genre']]});

// Add legend title
    vis.svg
        .append("text")
        .attr("id", "legend-title")
        .attr("x", vis.mainCirclex)
        .attr('y', vis.mainCircley - 125)
        .attr("text-anchor", 'middle')
        .text('Color Usage across 8 Genre Book Covers');

    // Add legend text
    vis.svg
        .append("foreignObject")
        .attr('class', 'legend-details')
        .attr("x", 325)
        .attr('y', vis.mainCircley - 110)
        .attr('height', 140)
        .attr('width', 425)
        .text("We picked books from 8 most common genres published between 1900 and 2017 and extracted the most dominant " +
            "color from book covers. We've custom designed a 'hub & spoke' visual to represent each genre. " +
            "The hub (center circle) represents a genre and the spoke length & area of the colored circles represent the " +
            "color prevalence in a genre. Click on the circles to learn more about color prevalence trends. Click on the white space to clear " +
            "any filters.");

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
    // var summarybygenre = [], aggregatedAreaData = [], reshapedAreaDataStage = [], reshapedAreaData = [];
    //
    // vis.data = vis.data.filter(function(d){return d.dominant_color_categorized !== 'missing'});
    //
    // vis.colorgroups = ["black", "orange", "white","green", "blue", "red",  "violet", "yellow"];
    //
    // vis.genres.forEach(function(genre){
    //     var filtered = vis.data.filter(function(d){return d["tags"].includes(genre);});
    //     filtered.forEach(function(row){row.genre_key = genre;});
    //     // Aggregate values
    //     var countColors = d3.nest()
    //         .key(function(d) { return d.dominant_color_categorized; })
    //         .rollup(function(leaves) { return leaves.length; })
    //         .entries(filtered);
    //
    //     // Compute percentages
    //     countColors.forEach(function(d) {d.percentage = d.value / filtered.length;});
    //     // Sort values
    //     countColors.sort(function(a,b){return b.value - a.value});
    //     //Collect all values.
    //     summarybygenre.push(countColors);
    //
    //     var countColorsArea = d3.nest()
    //         .key(function(d) { return d.year_range; })
    //         .key(function(d) { return d.dominant_color_categorized; })
    //         .rollup(function(leaves) { return leaves.length; })
    //         .entries(filtered);
    //     countColorsArea.forEach(function(year_count)
    //     {
    //         var record = {};
    //         year_count["values"].forEach(
    //             function(d){
    //                 record.year_range = year_count["key"];
    //                 record.genre = genre;
    //                 record.color = d.key;
    //                 record.count = d.value;
    //             });
    //         aggregatedAreaData.push(record)});
    //
    //
    // });
    // vis.summarybygenre = summarybygenre;
    //
    // aggregatedAreaData.sort(function(a,b){return (a.year_range > b.year_range) - (a.year_range < b.year_range)});
    //
    // reshapedAreaDataStage = d3.nest()
    //     .key(function(d){return d.year_range})
    //     .key(function(d){return d.color})
    //     .rollup(function(v) { return d3.sum(v, function(d) { return d.count; })})
    //     .entries(aggregatedAreaData);
    //
    // reshapedAreaDataStage.forEach(function(year){
    //     var record = {};
    //     record.year_range = year.key;
    //     vis.colorgroups.forEach(function(color){return record[color] = 0});
    //     year.values.forEach(function(d){
    //         vis.colorgroups.forEach(function(color){if(d.key === color){record[color] = d.value}});
    //     });
    //     reshapedAreaData.push(record);
    // });
    // vis.aggregatedAreaData = reshapedAreaData;
    // vis.rawAggregatedAreaData = aggregatedAreaData;
    // // Update the visualization
    vis.updateVis();
};

InnovativeView.prototype.updateVis = function (){

    var vis = this;
    // vis.areay.domain([0, 70]);
    //
    // var stack = d3.stack()
    //     .keys(vis.colorgroups);
    // // var series = stack(vis.aggregatedAreaData);
    // var series = stack(vis.aggregatedAreaData);
    //
    // vis.summarybygenre.forEach(function(d, i){
    //     vis.circleplotter([...Array(18).keys()],i,d);});
    //
    // // var tip_stack = d3.tip()
    // //     .attr('class', 'd3-tip-stack tooltip')
    // //     .offset([-10, 0])
    // //     .html(function(d) {
    // //         return "<span style='color:grey'>" + d.data.year_range + "</span>";
    // //     });
    // //
    // // vis.svg.call(tip_stack);
    //
    // //Draw the stacked bar chart
    // vis.svg
    //     .selectAll(".stacked_bar")
    //     .data(series)
    //     .enter()
    //     .append("g")
    //     .attr("class", "stacked_bar")
    //     .attr("fill", function(d){return vis.colorMap[d.key]})
    //     .selectAll("rect")
    //     .data(function(d) { return d; })
    //     .enter().append("rect")
    //     .attr("x", function(d) { return vis.areax(d.data.year_range); })
    //     .attr("y", function(d) { return vis.areay(d[1]); })
    //     .attr("height", function(d) { return (vis.areay(d[0]) - vis.areay(d[1])); })
    //     .attr("width",vis.areax.bandwidth())
    //     // .on('mouseover', tip_stack.show)
    //     // .on('mouseout', tip_stack.hide)
    //     .attr("stroke", 'grey')
    //     .attr("stroke-width", 0.3)
    //     .attr("transform", "translate(180,275)");
    //
    // //On click event handler for filters - On clicking genre function, the stack bar should update.
    // vis.svg.selectAll(".sub_circle")
    //
    //     .on("click", function() {
    //         //Identify the genre which the circle represents.
    //         var genre = d3.select(this).attr("class").split('_')[0];
    //         var filterReshaped = [];
    //         //FIlter the data for the genre.
    //         vis.filteredGenreData = vis.rawAggregatedAreaData.filter(function (d) {
    //             return d.genre === genre;
    //         });
    //         // Reshape each color as a column for stacked bar
    //         // Lekshmi -> TODO Ceate a function for this and clean up the code.
    //         var filterStage = d3.nest()
    //             .key(function (d) {
    //                 return d.year_range
    //             })
    //             .key(function (d) {
    //                 return d.color
    //             })
    //             .rollup(function (v) {
    //                 return d3.sum(v, function (d) {
    //                     return d.count;
    //                 })
    //             })
    //             .entries(vis.filteredGenreData);
    //
    //         filterStage.forEach(function (year) {
    //             var record = {};
    //             record.year_range = year.key;
    //             vis.colorgroups.forEach(function (color) {
    //                 return record[color] = 0
    //             });
    //             year.values.forEach(function (d) {
    //                 vis.colorgroups.forEach(function (color) {
    //                     if (d.key === color) {
    //                         record[color] = d.value
    //                     }
    //                 });
    //             });
    //             filterReshaped.push(record);
    //
    //         });
    //         filterReshaped.forEach(function(d)
    //         {
    //             var total = 0;
    //             vis.colorgroups.forEach(function(color)
    //             {
    //                 total += d[color];
    //             });
    //             d['total'] = total;
    //         });
    //
    //         // Create the stack variable from reshaped data to draw the stacked bar.
    //         var filtered_series = stack(filterReshaped);
    //
    //         // Add a titie in the middle on the circle
    //
    //         vis.svg.selectAll('.genre-name')
    //             .remove();
    //
    //         vis.svg
    //             .append("text")
    //             .attr("class", "genre-name")
    //             .attr("x", 270)
    //             .attr("y", 200)
    //             .attr("text-anchor", "start")
    //             .text(genre + ' color trends')
    //             .attr("fill", "grey");
    //
    //         // Update domain for y axis.
    //         vis.areay.domain(d3.extent(filterReshaped, function(d){return d.total;}));
    //
    //         // Update bars
    //         vis.bars = vis.svg.selectAll(".stacked_bar")
    //             .data(filtered_series)
    //             .enter()
    //             .selectAll("rect")
    //             .data(function(d) { return d; });
    //
    //         vis.bars
    //             .enter()
    //             .append("rect")
    //             .merge(vis.bars);
    //
    //         // vis.bars
    //         //     .transition()
    //         //     .duration(500)
    //         //     .attr("x", function(d) { return vis.areax(d.data.year_range); })
    //         //     .attr("y", function(d) { return vis.areay(d[1]); })
    //         //     .attr("height", function(d) { return (vis.areay(d[0]) - vis.areay(d[1])); });
    //
    //         vis.svg.selectAll(".stacked_bar")
    //             .data(filtered_series)
    //             .selectAll("rect")
    //             .data(function(d) { return d; })
    //             .transition()
    //             .duration(500)
    //             .attr("x", function(d) { return vis.areax(d.data.year_range); })
    //             .attr("y", function(d) { return vis.areay(d[1]); })
    //             .attr("height", function(d) { return (vis.areay(d[0]) - vis.areay(d[1])); });
    //
    //         vis.bars.exit().remove();
    //
    //
    //
    //
    //     });

    // $( function() {
    //     $('#menuNav').hover( function() {
    //         $('#huh').toggleClass('opacity');
    //     });
    // });

    // Attach an on-click event on the circle.
    vis.svg.selectAll('.sub_circle, .colorcircle, .spokes')
        .on("click", function(){
            // Remove any faded elements
            d3.selectAll('.faded').classed('faded', false);
            // identify selected genre
            var selectedGenre = d3.select(this).attr("class").split(' ')[0];
            // Dim everything else but this genre
            d3.selectAll('.colorcircle:not(.' + selectedGenre +')').classed('faded', true);
            d3.selectAll('.spokes:not(.' + selectedGenre +')').classed('faded', true);
            d3.selectAll('.sub_circle:not(.' + selectedGenre +')').classed('faded', true);
            d3.selectAll('.main-circle').classed('faded', true);
            // Do filtering and call updated bar graph viz

        });

    // Set up an event handler to de-select things from the color wheel.
    vis.svg
        .on('click', function(){
            // Grab the target element that got clicked.
            var target_event = d3.select(d3.event.target);
            // if you click on genre components - do not do anything. I'm hard coding the 8 genres here (Not idiomatic)
            var isgenre = target_event.classed('young_adult') ||
                          target_event.classed('fantasy') ||
                          target_event.classed('science_fiction') ||
                          target_event.classed('paranormal') ||
                          target_event.classed('children') ||
                          target_event.classed('romance') ||
                          target_event.classed('historic') ||
                          target_event.classed('thriller');
            if(!isgenre)
            {   // Remove any faded elements
                d3.selectAll('.faded').classed('faded', false);
                // Also update the bar graph to show total.
            }

        });


    $(function(){


        // $('.young_adult').click(function(){
        //
        //     $('circle ,text, path').not('.young_adult').toggleClass('faded opaque');
        //     // $(this).toggleClass('faded opaque');
        //     // $('circle').not('.young_adult').css('opacity', 0.1);
        //     // $('text').not('.young_adult').css('opacity', 0.3);
        //     // $('path').not('.young_adult').css('opacity', 0.1);
        // });


        // $( ".young_adult").addClass("important blue");
        // var bla = $( "circle" );
        // // $( "path" ).not( ".young_adult" ).addClass('hidden-innovative-vis');
        // // $( "text" ).not( ".young_adult" ).addClass('hidden-innovative-vis');
        // console.log(bla.length);
    });

};