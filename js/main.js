// Variable for innovative view
var innovativeview;

var vis = {};
d3.json("data/cleansed_final.json", function(data)
{

    vis.data = data;
    innovativeview = new InnovativeView("innovative-view", data);

});