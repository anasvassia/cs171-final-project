// Variable for innovative view
var innovativeview;
var barchart;
var treemap;
var ridgeline;

var vis = {};

queue()
    .defer(d3.json,"data/book-data-lite.json")
    .defer(d3.json,"data/tag_object.json")
    .defer(d3.json,"data/hierarchy_tag_color.json")
    .defer(d3.json, "data/tag_frequency.json")
    .defer(d3.json, "data/book_data.json")
    .defer(d3.json,"data/summarybygenre.json")
    .defer(d3.json,"data/genrebyyear.json")
    .await(createVis);


function createVis(error, data, tagObjectData, hierarchyTagColorData, tagFrequencyData, bookData, summaryByGenre, genreByYear){
    if(error) { console.log(error); }

    vis.data = data;
    barchart = new BarChart("barchart", tagObjectData);

    treemap = new TreeMap("treemap", hierarchyTagColorData, data);
    innovativeview = new InnovativeView("color-vis", data, summaryByGenre);
    ridgeline = new RidgeLine("ridgeline", bookData);

    createSelect(tagFrequencyData);
};

function createSelect(tagFrequencyData) {
    tagFrequencyData.sort(function(a, b) {
        return b.frequency - a.frequency;
    })
    var topTags = tagFrequencyData.slice(0, 100);

    var select = $('#genre-select');
    if(select.prop) {
        var options = select.prop('options');
    }
    else {
        var options = select.attr('options');
    }
    options[0] = new Option("All", "total");
    topTags.forEach(function(tag) {
        options[options.length] = new Option(tag["tag_name"], tag["tag_name"]);
    });
    select.val("total");

    select.on('change', function() {
        treemap.wrangleData(this.value);
        barchart.wrangleData(this.value);
    });
}