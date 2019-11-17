// Variable for innovative view
var innovativeview;

var vis = {};
d3.json("data/book-data-lite.json", function(data)
{

    vis.data = data;
    innovativeview = new InnovativeView("playground-vis-img", data);

});