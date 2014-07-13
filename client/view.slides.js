function renderSlides(s, o, v) {
    //http://twitter.github.com/bootstrap/javascript.html#carousel

    var c = $('<div></div>');
    c.addClass('carousel');
    c.addClass('slide');

    var i = $('<div></div>');
    i.addClass('carousel-inner');

    for (var y = 0; y < 3; y++) {
        var x = $('<div class="' + ((y == 0) ? 'active' : '') + ' item"></div>');
        x.append('<img src="http://placehold.it/1200x480" alt=""/>');
        x.append('<div class="carousel-caption"><h4>First Thumbnail label</h4><p>Cras justo odio, dapibus ac facilisis in, egestas eget quam. Donec id elit non mi porta gravida at eget metus. Nullam id dolor id nibh ultricies vehicula ut id elit.</p></div>');
        x.appendTo(i);
    }
    c.append(i);


    c.append('<a class="carousel-control left" href="#myCarousel" data-slide="prev">&lsaquo;</a>');
    c.append('<a class="carousel-control right" href="#myCarousel" data-slide="next">&rsaquo;</a>');


    v.append(c);

    $('.carousel').carousel();
}
