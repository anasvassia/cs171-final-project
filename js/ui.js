/*
    Sources used:
    jQuery transitions:
        https://stackoverflow.com/a/12721353
    toggling click:
        https://stackoverflow.com/a/41012579
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
            .attr("alt", val.title)
            .css("opacity", "0.7");

       // $(select).hide();
       // $(select).delay(2500).fadeIn(1000);

       // save state of click
        var clicked = false;

        $(select)
            .on("mouseover", function() {
                if(!clicked) {
                    $(select)
                        .css("opacity", "1.0")
                        .css("border", "3px dotted wheat");
                }
            })
            .on("mouseout", function() {
                if(!clicked) {
                    $(select)
                        .css("opacity", "0.7")
                        .css("border", "none");
                }
            })
            .on("click", function() {
                clicked = !clicked;
                // user can select whichever book they like
                if(clicked) {
                    $(".book-covers")
                        .css("opacity", "0.7")
                        .css("border", "none");
                    $(select)
                        .css("opacity", "1.0")
                        .css("border", "3px double wheat");
                    // let user choose a book
                    $("#choice-explanation").html(
                        "Excellent choice! '" + val.title + "' by " + val.authors +
                        " is a " + genreArray[index].replace("-", " ") + " book with a dominantly " +
                        val.dominantColorCategory + "-shade cover! How does the color " +
                        "of this cover compare with other covers of the same genre? Well, we" +
                        " can explore that by using the visualization below. </hr>"
                    );
                    innovativeview.selectedBook = val;
                    innovativeview.updateVis();
                }
            });
    });
});



