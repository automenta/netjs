var _myNewObject = null;

function onChatSend(name, desc, tag) {
    var o = objNew();
    o = o.own();
    o = objName(o, name);
    //o = objAddTag(o, 'Message');
    if (desc)
        o = objAddDescription(o, desc);
    if (tag)
        o = o.add(tag);

    $N.pub(o/*, function() {
    }, function() {
    }*/);
	_myNewObject = o;
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
    var updates = newDiv().addClass('ChatViewUpdates').addClass('ui-widget-content');
    
    //frame.append(roster);
    v.append(content);
    v.append(input);
    v.append(roster);
    v.append(updates);

	var nearBottom = false;
	var displayedObjects = [];
	var updatesAvailable = false;

	$(content).scroll(function() {
		var height = content.prop('scrollHeight');
		var position = content.scrollTop();
		var visible = content.height();

		if (position+visible > height-25) {
			if (!nearBottom)
				if (updatesAvailable)
					updateContent(true);

			updates.html('Streaming...');
			nearBottom = true;
	   	}
		else {
			if (nearBottom)
				updates.html('');
			nearBottom = false;
		}
	});

    var scrollbottom = _.debounce(function() {
        content.scrollTop(content.height() * 20);
    }, 150);

	function forceUpdate() {
		updateContent(true);
		scrollbottom();
	}
	var updateButton = $('<button>Update</button>').click(forceUpdate);

    function updateContent(force) {
        var sort = 'Recent';
        var scope = 'Public';
        var semantic = 'Any';
        var maxItems = 75;
        var o = newDiv();

        var rel = getRelevant(sort, scope, semantic, $N, maxItems);
		var toDisplay = rel[0];
		var difference = _.difference(toDisplay, displayedObjects);



		if (!force) {
			if (difference.length == 0) {
				updatesAvailable = false;
				return;
			}
			else if (!nearBottom) {
				//buffer changes
				updatesAvailable = true;

				//TODO indicate which threads have changed
			
				updates.html(difference.length + ' Updates available.');			
				updates.append(updateButton);
				updates.fadeIn();

				return;
			}
		}

		updates.hide();

        content.empty();

        if (toDisplay.length === 0) {
            content.html('No messages.');
            return;
        }
		
		displayedObjects = [];
        for (var i = toDisplay.length - 1; i >= 0; i--) {
            var x = $N.getObject(toDisplay[i]);
			displayedObjects.push(x.id);
            content.append(newObjectLogLine(x));
        }


		if (typeof force != "boolean") {			
			var scrollToObject = force;
			//existing scroll position should be good if it's a reply
			if (scrollToObject.replyTo)
				return;
		}
		
        later(scrollbottom);
    }

    content.onChange = function() {
        updateContent(_myNewObject);
		_myNewObject = null;
    };
    content.destroy = function() {
        roster.destroy();
    };
    
    updateContent(true);


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
    
    //var showingMini = (e.children().length > 0) && (!e.children().first().hasClass('objectView'));
    
    /*function showMini() {
		var name = x.name;

        var numReplies = $N.getReplies(x.id).length;
        if (numReplies > 0) {
            name += '<span style="opacity: 0.5">(...)</span>';
        }


        if (name.length > 0)
            e.append(name + '<br/>');

        var desc = objDescription(x);
        if (desc.length > 0) {
            e.append(desc + '<br/>');
        }
        var firstMedia = objFirstValue(x, 'media');
        if (firstMedia) {
            e.append('<img src="' + firstMedia + '"/><br/>');
        }        


    }*/

    function showFull() {
        var s = newObjectSummary(x, {
            showActionPopupButton: false,
            showSelectionCheck: false,
			transparent: true
        });
        s.hide();
        
        e.append(s);
        
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

    
    var s = newObjectSummary(x, {
        showActionPopupButton: false,
        showSelectionCheck: false,
		transparent: true,
		hideAuthorNameAndIconIfZeroDepth: true,
		replyCallback: function(r) {
			_myNewObject = r;
		}
    }).appendTo(e);

    
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
                onSend(inputBar.val(), null, {id: 'media', value: imgURL});
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
