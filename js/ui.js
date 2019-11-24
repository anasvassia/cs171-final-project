
var books;
var alreadyChose = false;

// selection is the isbn of the book that the user chose
var selection;

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
       $(select).delay(2000).fadeIn(1000);

        $(select).on("click", function() {
            // if user has already chosen something then don't do anything
            if (alreadyChose) {
                return;
            }

            // else let user choose a book
            $("#choice-explanation").text(
                "Excellent choice! '" + val.title + "' by " + val.authors +
                " is a " + genreArray[index].replace("-", " ") + " book with a dominantly " +
                val.dominant_color_categorized + "-shade cover! How does the color " +
                "of this cover compare with other covers of the same genre? Well, we" +
                " can explore that by using the visualization below."

            );
            alreadyChose = true;
        });
    });
});


