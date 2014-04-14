function onChatSend(name, desc) {
    var o = objNew();
    o = o.own();
    o = objName(o, name);
    o = objAddTag(o, 'Message');
    if (desc)
        o = objAddDescription(o, desc);
    $N.pub(o);
}

function newChatView(v) {
    var frame = newDiv();

    //var roster = newRoster().attr('class', 'ChatViewRoster');    
    var content = newDiv().attr('class', 'ChatViewContent');
    var input = newChatInput(onChatSend).attr('class', 'ChatViewInput ui-widget-content');

    //frame.append(roster);
    frame.append(content);
    frame.append(input);

    v.append(frame);

	var scrollbottom = _.debounce(function() {
        v.scrollTop(content.height()*20);
	}, 150);

    function updateContent() {
        content.html('');

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
            var x = self.object(rr[i]);
            content.append(newObjectLogLine(x));
            content.append(newEle('br'));
        }

        content.append(newEle('br'));
        content.append(newEle('br'));

		later(scrollbottom);
    }

    frame.onChange = function() {
        updateContent();
    };

    frame.onChange();


    return frame;
}

function newInlineSelfButton(s) {
    var x = newEle('a').attr('class', 'InlineSelfButton');
    x.prepend(newAvatarImage(s));
    x.append(s.name);
    return x;
}

function newObjectLogLine(x) {
    var line = newEle('div');
    var d = newDiv().addClass('chatViewLineAuthor').appendTo(line);
    var e = newDiv().addClass('chatViewLineContent').appendTo(line);

    if (x.author) {
        var a = self.getObject(x.author);
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
		d.append(b);
    }
    else {
        d.append('(System)');
    }
    
    if (x.name.length > 0)
        e.append('<span>' + x.name + '</span>');
    var desc = objDescription(x);
    if (desc.length > 0) {
        e.append('<span>' + desc + '</span>');
    }
    var firstMedia = objFirstValue(x, 'media');
    if (firstMedia) {
        e.append('<span><img src="' + firstMedia + '"/></span>');
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
            var description = '<a href="' + imgURL + '"><img src="' + imgURL + '"></img></a>';
            if (onSend)
                onSend(inputBar.val(), description);
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
