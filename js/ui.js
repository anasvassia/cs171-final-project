/*
    Sources used:
    jQuery transitions:
        https://stackoverflow.com/questions/12721029/use-jquery-to-show-a-div-in-5-seconds
 */
var books = [];


// load data
d3.json("data/book-data-lite.json", function(data) {
    var genreArray = [
        "fantasy", "science-fiction", "nonfiction", "young-adult",
        "childrens", "horror", "romance", "mystery"
    ];

    // book covers to be displayed
   books = d3.range(0, 8).map( function(val) {
        return random(genreArray[val]);

        });

    // generate new books on each page load
    function random(genre) {
        var result = data[Math.floor(Math.random()*data.length)];
        // if the book doesn't have a cover photo
        if (result.tags.includes(genre) && !(result.image_url.includes("nophoto"))) {
            return result;
        }
        else {
            return random(genre);
        }
    }

    // set images and on click listener
    $.each(books, function(index, val) {
        var select = "#img"+index;
        $(select)
            .attr("src", val.image_url)
            .attr("alt", val.title);

       $(select).hide();
       $(select).delay(2500).fadeIn(1000);

        $(select).on("click", function() {
            // let user choose a book
            $("#choice-explanation").html(
                "Excellent choice! '" + val.title + "' by " + val.authors +
                " is a " + genreArray[index].replace("-", " ") + " book with a dominantly " +
                val.dominant_color_categorized + "-shade cover! How does the color " +
                "of this cover compare with other covers of the same genre? Well, we" +
                " can explore that by using the visualization below. </hr>"

            );
            innovativeview.selectedBook = val;
            innovativeview.updateVis();
        });
    });
});



