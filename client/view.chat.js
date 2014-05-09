function onChatSend(name, desc, tag) {
    var o = objNew();
    o = o.own();
    o = objName(o, name);
    o = objAddTag(o, 'Message');
    if (desc)
        o = objAddDescription(o, desc);
    if (tag)
        o = o.add(tag);

    $N.pub(o, function() {
    }, function() {
        console.log('sent');
    });

}

function newRosterWidget() {
    if (!$N.get('roster')) {
        $N.updateRoster();
    }
    
    var d = newDiv();
    
    var updateRosterDisplay = function() {
        var r = $N.get('roster');
        d.empty();
        if (!r) return;
        
        _.keys(r).forEach(function(uid) {
            var U = $N.getObject(uid);
            if (U) {
                var a = newAvatarImage(U).appendTo(d);
                a.click(function() {
                    newPopupObjectView(U);
                });
            }
        });
    };
    
    $N.on("change:roster", updateRosterDisplay);
    
    d.destroy = function() {
        $N.off("change:roster", updateRosterDisplay);
    };
    
    updateRosterDisplay();
    
    return d;
}

function newChatView(v) {
    //var roster = newRoster().attr('class', 'ChatViewRoster');    
    var content = newDiv().addClass('ChatViewContent');
    var input = newChatInput(onChatSend).addClass('ChatViewInput');
    var roster = newRosterWidget().addClass('ChatViewRoster');
    
    //frame.append(roster);
    v.append(content);
    v.append(input);
    v.append(roster);


    var scrollbottom = _.debounce(function() {
        content.scrollTop(content.height() * 20);
    }, 150);

    function updateContent() {
        content.empty();

        var sort = 'Recent';
        var scope = 'Public';
        var semantic = 'Any';
        var maxItems = 75;
        var s = self;
        var o = newDiv();

        var rel = getRelevant(sort, scope, semantic, s, maxItems);
        var rr = rel[0];
        if (rr.length === 0) {
            content.html('No messages.');
            return;
        }
        for (var i = rr.length - 1; i >= 0; i--) {
            var x = $N.getObject(rr[i]);
            content.append(newObjectLogLine(x));
        }

        later(scrollbottom);
    }

    content.onChange = function() {
        updateContent();
    };
    content.destroy = function() {
        roster.destroy();
    };
    
    content.onChange();


    return content;
}

function newInlineSelfButton(s, x) {
    return newEle('a').attr({
        'aid': s.id, 'xid': x.id, 'class': 'InlineSelfButton'
    }).append('<span>' + s.name + '</span>', newAvatarImage(s));
}

function newObjectLogLineOnHover() {   $(this).addClass('ChatViewContentLineHover'); }
function newObjectLogLineOffHover() {   $(this).removeClass('ChatViewContentLineHover'); }
function newObjectLogLineClick() {
    var author = $(this).attr('aid');
    var xid = $(this).attr('xid');

    newPopupObjectView(author);
}

function lineClickFunction() {
    var line = $(this);
    
    var e = $(line.children()[1]);
        
    var x = $N.getObject( line.attr('xid') );
    
    var showingMini = (e.children().length > 0) && (!e.children().first().hasClass('objectView'));
    
    function showMini() {
        if (x.name.length > 0)
            e.append('<p>' + x.name + '</p>');

        var desc = objDescription(x);
        if (desc.length > 0) {
            e.append('<p>' + desc + '</p>');
        }
        var firstMedia = objFirstValue(x, 'media');
        if (firstMedia) {
            e.append('<p><img src="' + firstMedia + '"/></p>');
        }        

    }
    function showFull() {
        var s = newObjectSummary(x, {
            showActionPopupButton: false,
            showSelectionCheck: false
        });
        s.hide();
        
        e.append(s);
        
        s.fadeIn();
    }
    
    e.empty();
    if (showingMini) {
        showFull();
    }
    else {
        showMini();
    }
    
}

function newObjectLogLine(x) {
    var line = newEle('div').addClass('ChatViewContentLine').attr('xid', x.id);
    
    if (configuration.device == configuration.DESKTOP)
        line.hover(newObjectLogLineOnHover, newObjectLogLineOffHover);
    
    var d = newDiv().addClass('chatViewLineAuthor').appendTo(line);
    var e = newDiv().addClass('chatViewLineContent').appendTo(line);

    
    line.click(lineClickFunction);
    (lineClickFunction.bind(line))();    
    
    if (x.author) {
        var a = $N.getObject(x.author);
        var b;
        if (a) {
            b = newInlineSelfButton(a, x);
        }
        else {
            b = $('<a href="#">' + x.author + '</a>').attr('xid', x.id).attr('aid', x.author);
        }
        b.click(newObjectLogLineClick);
        d.append(newEle('p').append(b));
    }
    else {
        d.append('&nbsp;');
    }

    return line;
}

function newChatInput(onSend) {
    var d = newDiv();

    var inputBar = $('<input class="nameInput" x-webkit-speech/>');
    inputBar.keyup(function(event) {
        if (event.keyCode === 13) {
            if (onSend)
                onSend(inputBar.val());
            inputBar.val('');
        }

    });
    d.append(inputBar);

    var webcamButton = $('<button title="Add Webcam..."><img style="height: 1em" src="icon/play.png"></button>');
    webcamButton.click(function() {
        newWebcamWindow(function(imgURL) {
            //var description = '<a href="' + imgURL + '"><img src="' + imgURL + '"></img></a>';
            if (onSend)
                onSend(inputBar.val(), null, {'media': imgURL});
            inputBar.val('');
        });
    });
    d.append(webcamButton);

    var moreButton = $('<button title="Add Detailed Object...">..</button>');
    moreButton.click(function() {
        var n = objNew();
        n.setName(inputBar.val());
        inputBar.val('');
        newPopupObjectEdit(n);
    });
    d.append(moreButton);

    /*var whatButton = $('<button>What</button>');
     d.append(whatButton);*/

    return d;
}
