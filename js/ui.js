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
                    $("#choice").html(
                        '<div class="col-md-2"></div>\n' +
                        '                <div class="col-md-7 step" id="choice-explanation"></div>\n' +
                        '                <div class="col-md-3" id="selected-book"></div>'
                    );

                    $(".book-covers")
                        .css("opacity", "0.9")
                        .css("border", "none");
                    $(select)
                        .css("opacity", "1.0")
                        .css("border", "3px double wheat");
                    console.log(val);
                    var genre = genreArray[index].replace("-", " ");
                    var authors = val.authors.replace(",", " &");
                    console.log(innovativeview.summarybygenre);

                    // let user choose a book
                    $("#choice-explanation").html(
                        "<br/><br/><br/><g class='section-title'>Explanation of Your Choice" +
                        "<br/></g>" +
                        "<p class='storyline'>" + val.title + " by " + authors + "? " +
                        "Not a bad choice. This is " +
                        "actually a " + genre +
                        " book, published in " + val.original_publication_year +
                        ", with a predominantly " + val.dominantColorCategory +
                        " colored cover. " +
                        "<br/><br/>" +
                        "But think for a moment - why did you " +
                        "choose this book? Is " + val.dominantColorCategory +
                        " your favorite " +
                        "color? Maybe you particularly liked the art style of " +
                        "this cover? Maybe you’re not entirely sure why. " +
                        "Regardless, there was probably something (or things) " +
                        "about this cover that appealed to you and made you " +
                        "want to choose it. This is the power of aesthetics. " +
                        "It’s not always a fancy sign that screams 'PICK ME!!'," +
                        " but is actually typically a bunch of small, subtle " +
                        "features that come together to make you feel an " +
                        "attraction to the object. Aesthetics help to influence" +
                        " your emotions, and this influence is what makes " +
                        "design so powerful and important. There’s actually an" +
                        " entire psychological field, known as " +
                        "<a href='https://en.wikipedia.org/wiki/Neuroesthetics'>" +
                        "neuroaesthetics</a>, that researches how and why these" +
                        " visual stimuli affect our everyday decisions. " +
                        "<br/><br/>" +
                        "While neuroaesthetics is a topic that we could talk " +
                        "about for days, we’ll " +
                        "provide a short introduction to this awesome field by " +
                        "looking at book covers. " +
                        "Bringing it back to the book you selected, recall " +
                        "that " + val.title + " by " + authors + " is " +
                        "a" + genre +
                        " book with a predominantly " +
                        val.dominantColorCategory + " colored " +
                        "cover. This is actually " +
                        "[pretty (>15%)/ not very (<15%)] common for " + genre +
                        "books. Has this always been " +
                        "the case for this genre? What about colors used in " +
                        "other genres? Let’s find " +
                        "out. </p>"
                    );
                    $("#selected-book").html(
                        "<img src=" + val.image_url +
                        " alt='Book Cover' id='selected-book-image'/>"
                    );
                    // pass selection to innovative view
                    innovativeview.selectedBook = val;
                    innovativeview.updateVis();

                    $()
                    // on click, move to choice explanation div
                   $.scrollify.next();
                }
            });
    });
});



