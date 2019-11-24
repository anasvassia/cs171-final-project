// Variable for innovative view
var innovativeview;
var barchart;

var vis = {};

queue()
    .defer(d3.json,"data/book-data-lite.json")
    .defer(d3.json,"data/tag_object.json")
    .await(createVis);


function createVis(error, data, tagObjectData){
    if(error) { console.log(error); }

    vis.data = data;
    barchart = new BarChart("bar-chart", tagObjectData);
    treemap = new TreeMap("treemap", data)
    innovativeview = new InnovativeView("color-vis", data);

};
