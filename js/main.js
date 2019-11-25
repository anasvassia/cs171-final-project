// Variable for innovative view
var innovativeview;
var barchart;

var vis = {};

queue()
    .defer(d3.json,"data/book-data-lite.json")
    .defer(d3.json,"data/tag_object.json")
    .defer(d3.json,"data/hierarchy_tag_color.json")
    .await(createVis);


function createVis(error, data, tagObjectData, hierarchyTagColorData){
    if(error) { console.log(error); }

    vis.data = data;
    barchart = new BarChart("bar-chart", tagObjectData);
    treemap = new TreeMap("treemap", hierarchyTagColorData);
    innovativeview = new InnovativeView("color-vis", data);
    
};
