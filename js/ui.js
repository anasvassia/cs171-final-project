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
        "fantasy", "science-fiction", "historical", "young-adult",
        "children", "thriller", "romance", "paranormal"
    ];

    var genretoColorView =
        {
            "fantasy":2,
            "science fiction":1,
            "thriller":5,
            "historical":4,
            "young adult":0,
            "children":3,
            "romance":6,
            "paranormal":7
        };

    // book covers to be displayed
   books = d3.range(0, 8).map( function(val) {
        return random(genreArray[val]);
        });

    // generate new books
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
                        '<div class="col-md-7 step inner-div" id="choice-explanation"></div>\n' +
                        '<div class="col-md-3" id="selected-book"></div>'
                    );

                    $(".book-covers")
                        .css("opacity", "0.9")
                        .css("border", "none");
                    $(select)
                        .css("opacity", "1.0")
                        .css("border", "3px double wheat");
                    var genre = genreArray[index].replace("-", " ");
                    var authors = val.authors.replace(",", " &");
                    var thisGenre = data.filter(function(d) {
                        return d.tags.includes(genreArray[index]) && !(d.image_url.includes("nophoto"));
                    });
                    var thisColor = thisGenre.filter(function(d) {
                        return d.dominantColorCategory == val.dominantColorCategory;
                    });
                    var percent = thisColor.length/thisGenre.length.toFixed(2);
                    var isCommon = percent >= .15 ? "pretty" : "not very";

                    // let user choose a book
                    $("#choice-explanation").html(
                        "<g class='section-title'>Explanation of Your Choice" +
                        "<br/></g>" +
                        "<p class='storyline'><b>" + val.title + "</b> by " + authors + "? " +
                        "Not a bad choice. This is " +
                        "actually a<b> " + genre +
                        "</b> book, published in <b>" +
                        val.original_publication_year +
                        "</b>, with a predominantly <emp style='color:" +
                        innovativeview.colorMap[val.dominantColorCategory]
                        + "'>" + val.dominantColorCategory + "</emp>" +
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
                        "that <b>" + val.title + "</b> by " + authors + " is " +
                        "a " + genre +
                        " book with a predominantly  <emp style='color:" +
                        innovativeview.colorMap[val.dominantColorCategory]
                        + "'>" + val.dominantColorCategory + "</emp>" + " colored " +
                        "cover. This is actually " + isCommon +
                        " common for " + genre +
                        " books. Has this always been " +
                        "the case for this genre? What about colors used in " +
                        "other genres? Let’s find " +
                        "out. </p>"
                    );

                    $("#selected-book")
                        .html(
                        "<img src=" + val.image_url +
                        " alt='Book Cover' id='selected-book-image'/>"
                        );

                    // pass selection to innovative view
                    d3.select('.UserSelection').remove();
                    var genre_index = genretoColorView[genre];
                    console.log(genre, genretoColorView[genre]);
                    if(genre_index !== null)
                    {
                        var label_offset_select_y = [-25, -25, 35, 45, 45, 45, 35, -25];
                        var label_offset_select_x = [0,0, 10, 0, 0, 0, 0, 0];

                        d3.select('#color-vis').select("svg")
                            .append('text')
                            .attr('x', window.colorview_genre_location[genre_index]['line-end-x'] + label_offset_select_x[genre_index])
                            .attr('y',window.colorview_genre_location[genre_index]['line-end-y'] + label_offset_select_y[genre_index])
                            .attr('class', 'UserSelection')
                            .attr('text-anchor','middle' )
                            .attr("font-size", 20)
                            .text("📖");

                        var tip_selection = d3.tip()
                            .attr('class', 'd3-tip-selection tooltip')
                            // .offset([-5, 10])
                            .offset(function() {
                                if(genre_index === 0) {return [100, 170]} // Young Adult tooltip was getting cut-off
                                if(genre_index === 6) {return [0, 120]} // Romance tooltip was getting cut-off
                                else {return [-5, 10]}
                            })
                            .html(function() {return '<span><strong>Your selection</strong></span><br><span><img src=' +
                                val.image_url +
                                ' width="20" height="30" display: inline>' +
                                val.title +
                                '</span><br>'+
                                '<span>It has <emp style=\'color:'+
                                innovativeview.colorMap[val.dominantColorCategory]
                                + "'>" + val.dominantColorCategory +
                                '</emp> as dominant color<span>'
                            });

                        d3.select('#color-vis').select("svg").call(tip_selection);
                        // Plot the color circles

                        d3.select('.UserSelection')
                            .on('mouseover', tip_selection.show)
                            .on('mouseout', tip_selection.hide);


                    }

                    // on click, move to choice explanation div
                   $.scrollify.next();
                }
            });
    });
});



