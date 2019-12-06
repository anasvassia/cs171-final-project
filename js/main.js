// Variable for innovative view
var innovativeview;
var stackedbar;
var barchart;
var treemap;
var ridgeline;
var bookdisplay;
var ratingbookdisplay;

var vis = {};

var enterEventHandler = function(genre, color) {
    bookdisplay.wrangleData(genre, color);
    treemap.selectColor(color);
    barchart.selectColor(color);

}

var leaveEventHandler = function(genre, color) {
    bookdisplay.wrangleData(genre, color);
    treemap.deselectColor();
    barchart.deselectColor();
}

var enterRatingEventHandler = function (genre, color, rating, param) {
    console.log(param);
    ratingbookdisplay.wrangleData(genre, color, rating, param);
}

const capitalize = (s) => {
    if (typeof s !== 'string') return ''
    return s.charAt(0).toUpperCase() + s.slice(1)
}

queue()
    .defer(d3.json,"data/book-data-lite.json")
    .defer(d3.json,"data/tag_object.json")
    .defer(d3.json,"data/hierarchy_tag_color.json")
    .defer(d3.json, "data/tag_frequency.json")
    .defer(d3.json,"data/summarybygenre.json")
    .defer(d3.json,"data/genrebyyearpct.json")
    .await(createVis);


function createVis(error, data, tagObjectData, hierarchyTagColorData, tagFrequencyData, summaryByGenre, genreByYear){
    if(error) { console.log(error); }

    vis.data = data;

    barchart = new BarChart("barchart", tagObjectData, enterEventHandler, leaveEventHandler);

    bookdisplay = new BookDisplay("book-display", data);

    treemap = new TreeMap("treemap", hierarchyTagColorData, data,  enterEventHandler, leaveEventHandler);

    innovativeview = new InnovativeView("color-vis", data, genreByYear, summaryByGenre, {});

    stackedbar = new StackedBar("stacked-bar", genreByYear);

    ratingbookdisplay = new RatingBookDisplay("rating-book-display", data);

    ridgeline = new RidgeLine("ridgeline", data, enterRatingEventHandler);

    createSelect(tagFrequencyData);

    // On click event handler for the color viz
    d3.selectAll('.sub_circle, .colorcircle, .spokes')
        .on('click', function()
        {
            let filter_genre_color = _.cloneDeep(genreByYear);
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
            if(d3.select(this).classed('colorcircle'))
            {
                // Find out the color
                var selectedColor = d3.select(this).attr("class").split(' ')[1];
                // Set every other color to zero except for the selected color and the key fields.
                filter_genre_color.forEach(
                    function(d){
                        Object.keys(d).forEach(
                            function(keys){
                                if (!(keys === 'genre'||keys === 'year_range' || keys === selectedColor || keys === 'sum'))
                                {
                                    d[keys] = 0;
                                }
                                else if (keys === 'sum')
                                {
                                    d[keys] = d[selectedColor];
                                }
                            })}
                );
                window.filter_genre_global = filter_genre_color.filter(function(d){return d.genre === selectedGenre});

            }
            else{
                window.filter_genre_global = genreByYear.filter(function(d){return d.genre === selectedGenre});
            }
            stackedbar.selectionChanged(window.filter_genre_global);

        });
// Set on-click event handlers to deselect filters.
    d3.select("#color-vis")
        .on('click', function(){
            // Grab the target element that got clicked.
            var target_event = d3.select(d3.event.target);
            // if you click on genre components - do not do anything. I'm hard coding the 8 genres here.
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
                window.filter_genre_global = genreByYear.filter(function(d){ return d.genre === 'total';});
            }
            // Update stacked bar
            stackedbar.selectionChanged(window.filter_genre_global);
        });
}

function createSelect(tagFrequencyData) {
    tagFrequencyData.sort(function(a, b) {
        return b.frequency - a.frequency;
    });

    tagFrequencyData = tagFrequencyData.filter(function (d) {
        return !(["nonfiction", "ya", "book-club"]).includes(d.tag_name);
    });

    var topTags = tagFrequencyData.slice(0, 60);

    var select = $('#genre-select');
    var ratingSelect = $('#rating-genre-select');
    var ratingCheckbox = $('#rating-checkbox');
    var ratingOptions;
    if(ratingSelect.prop) {
        ratingOptions = ratingSelect.prop('options');
    }
    else {
        ratingOptions = ratingSelect.attr('options');
    }

    if(select.prop) {
        var options = select.prop('options');
    }
    else {
        var options = select.attr('options');
    }
    options[0] = new Option("All", "total");
    ratingOptions[0] = new Option("All", "total");

    topTags.forEach(function(tag) {
        var displayTag = capitalize(tag["tag_name"].replace("-", " "));
        options[options.length] = new Option(displayTag, tag["tag_name"]);
        ratingOptions[ratingOptions.length] = new Option(displayTag, tag["tag_name"]);
    });

    select.val("total");
    select.on('change', function() {
        treemap.wrangleData(this.value);
        bookdisplay.wrangleData(this.value, "total");
        barchart.wrangleData(this.value);
    });

    ratingSelect.val("total");
    ratingSelect.on('change', function() {
        ridgeline.wrangleData(this.value, !$('#rating-checkbox').is(':checked'));
    });

    ratingCheckbox.change(function () {
        console.log($('#rating-genre-select').val());
            ridgeline.wrangleData($('#rating-genre-select').val(), !this.checked);
        }
    )

}

// scrolly-telling setup
$(function() {
    $.scrollify({
        section : ".step",
        touchScroll: false,
        scrollSpeed: 1500,
    });
});