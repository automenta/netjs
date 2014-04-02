function newMainView(v) {
    //http://gridster.net/#documentation
    
    var d = newDiv().css('overflow', 'hidden').appendTo(v);
    
    var header = newDiv().appendTo(d);
    
    var e = newDiv().addClass('gridster').appendTo(d);
    var grid = $('<ul/>').appendTo(e);
    
    var gridster = grid.gridster({
        widget_base_dimensions: [110, 110],
        widget_margins: [6, 6],
        resize: {
            enabled: true
        }
    }).data('gridster');
    
    //gridster.add_widget('<li class="mainViewButton">ABC</li>', 1, 1, 2, 2);

    var conviews = configuration.views;
    _.each(conviews, function(v) {
        var c = $('#' + v);
        var name = c.attr('title');
        var icon = c.find('img').attr('src');        
        
        var b = $('<li class="ui-widget-content mainViewButton"></li>');
        b.append(name);
        
        b.css('background-image', 'url(' + icon + ')');
        b.css('background-repeat', 'no-repeat');
        b.css('background-size', 'contain');
        gridster.add_widget(b, 1, 1);
                    
    });

    return d;
}