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

function newChatView(v) {
    //var roster = newRoster().attr('class', 'ChatViewRoster');    
    var content = newDiv().addClass('ChatViewContent');
    var input = newChatInput(onChatSend).addClass('ChatViewInput');

    //frame.append(roster);
    v.append(content);
    v.append(input);


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

    content.onChange();


    return content;
}

function newInlineSelfButton(s) {
    var x = newEle('a').attr('class', 'InlineSelfButton');
    x.prepend(newAvatarImage(s));
    x.append(s.name);
    return x;
}

function newObjectLogLine(x) {
    var line = newEle('div').addClass('ChatViewContentLine');
    line.hover(function() {
       line.addClass('ChatViewContentLineHover');
    }, function() {
       line.removeClass('ChatViewContentLineHover');        
    });
    
    var d = newDiv().addClass('chatViewLineAuthor').appendTo(line);
    var e = newDiv().addClass('chatViewLineContent').appendTo(line);

    if (x.author) {
        var a = $N.getObject(x.author);
        if (a) {
            b = newInlineSelfButton(a, x);
        }
        else {
            b = $('<a href="#">' + x.author + '</a>');
        }
        b.click(function() {
            if (x.author === $N.id())
                newPopupObjectEdit(x);
            else
                newPopupObjectView(x.id);
        });
        d.append(newEle('p').append(b));
    }
    else {
        d.append('(System)');
    }

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
