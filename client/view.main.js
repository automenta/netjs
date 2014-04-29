function newMainView(v) {
    var d = newDiv().css('overflow', 'hidden').css('height', '100%').appendTo(v);

    //http://gridster.net/#documentation

    var header = newDiv().appendTo(d);


    var optionsDiv = newDiv().appendTo(header);
    var themeSelect = $('<select/>').appendTo(optionsDiv);
    for (var k in themes) {
        themeSelect.append($('<option id="' + k + '">' + themes[k] + '</option>'));
    }
    themeSelect.change(function() {
        var t = $(this).children(":selected").attr("id");
        setTheme(t);
    });

    header.append('<select id="uilanguage"><option>English</option><option>Español</option> <option>Français</option><option>Русский</option><option>עברית</option><option>العربية</option><option>हिन्दी; हिंदी</option><option>中文(简体)</option><option>日本語</option></select>');

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
            stop: function(event, ui) {
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
    var cols = 3;
    
    var m = $('<li class="ui-widget-content mainViewButton"></li>');
    $.get('/doc/index.html', function(h) { m.html(h); } );
    
    gridster.add_widget(m, 2, 4, 1, 1);

    var x = 3, y = 1;

    var conviews = configuration.views;
    _.each(conviews, function(v) {
        if (v === 'main')
            return;

        var c = $('#' + v);
        var name = c.attr('title');
        var icon = c.find('img').attr('src');

        var b = $('<li class="ui-widget-content mainViewButton"></li>');
        b.append(name);

        b.css('background-image', 'url(' + icon + ')');
        b.css('background-repeat', 'no-repeat');
        b.css('background-size', 'contain');
        b.css('background-position', 'center');

        gridster.add_widget(b, 1, 1, x++, y);
        if (x == 2 + cols + 1) {
            x = 3;
            y++;
        }


        b.click(function() {
            if (!preventClick)
                $N.set('currentView', v);
        });

    });



    return d;
}
