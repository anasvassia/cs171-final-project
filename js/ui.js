
d3.json("data/book-data-lite.json", function(data) {
    var genreArray = [
        "fantasy", "science-fiction", "nonfiction", "young-adult",
        "childrens", "horror", "romance", "mystery"
    ];

    var books = d3.range(0, 8).map( function(val) {
        return random(genreArray[val]);

        });

    function random(genre) {
        var result = data[Math.floor(Math.random()*data.length)];
        if (result.tags.includes(genre) && !(result.image_url.includes("nophoto"))) {
            return result;
        }
        else {
            return random(genre);
        }
    }

    $.each(books, function(index, val) {
        var select = "#img"+index;
        $(select)
            .attr("src", val.image_url)
            .attr("alt", val.title);
    });



    console.log(books);


    console.log(data);
});



