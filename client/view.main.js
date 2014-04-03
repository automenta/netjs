function newMainView(v) {
    //http://gridster.net/#documentation
    
    var d = newDiv().css('overflow', 'hidden').appendTo(v);
    
    var header = newDiv().appendTo(d);
    
    var e = newDiv().addClass('gridster').appendTo(d);
    var grid = $('<ul/>').appendTo(e);
    
    var preventClick = false;
    
    var go = {
        widget_base_dimensions: [110, 110],
        widget_margins: [6, 6],
        resize: {
            enabled: true      
        },
        draggable: {
            start: function() {
               preventClick = true;     
            },
            stop: function(event, ui){
                later(function() {
                   preventClick = false; 
                });
                return false;
            }
        }
    };
    go.resize.start = go.draggable.start;
    go.resize.stop = go.draggable.stop;
    var gridster = grid.gridster(go).data('gridster');
    
    //gridster.add_widget('<li class="mainViewButton">ABC</li>', 1, 1, 2, 2);

    var conviews = configuration.views;
    _.each(conviews, function(v) {
        if (v === 'main') return;
        
        var c = $('#' + v);
        var name = c.attr('title');
        var icon = c.find('img').attr('src');        
        
        var b = $('<li class="ui-widget-content mainViewButton"></li>');
        b.append(name);
        
        b.css('background-image', 'url(' + icon + ')');
        b.css('background-repeat', 'no-repeat');
        b.css('background-size', 'contain');
        b.css('background-position','center');
        
        gridster.add_widget(b, 1, 1);
        
        
        b.click(function() {
            if (!preventClick)
                $N.set('currentView', v);     
        });
                    
    });

    return d;
}