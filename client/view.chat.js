function onChatSend(name, desc) {
    var o = objNew();
	o = o.own();
    o = objName(o, name);
	o = objAddTag(o, 'Message');
	if (desc)
		o = objAddDescription(o, desc);
	self.publish(o);
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
        if (rr.length == 0) {
            content.html('No messages.');
            return;
        }
        for (var i = rr.length-1; i >=0 ; i--) {
            var x = self.object(rr[i]);
            content.append(newObjectLogLine(x));
            content.append(newEle('br'));
        }
        
        content.append(newEle('br'));
		content.append(newEle('br'));

		/*setTimeout(function() {
	        $('#View').scrollTop(content.height());
		}, 500);*/
		//content.animate({scrollTop: content.height()}, 1000);
		//window.scrollTo(0, document.body.scrollHeight);

    }
        
    frame.onChange = function() {
        updateContent();
    };
    
    frame.onChange();

    
    return frame;
}

function newInlineSelfButton(s) {
    var x = newEle('a').attr('class', 'InlineSelfButton');
    x.click(function() {
        newPopupObjectView(s.id);
    });
    x.append(s.name);
    return x;
}

function newObjectLogLine(x) {    
    var d = newEle('span');
    if (x.author) {
        var a = self.getObject(x.author);
        if (a) {
            d.append(newInlineSelfButton(a));
        }
        else {
            d.append(x.author);
        }
        d.append(':&nbsp;');
    }
	if (x.name.length > 0)
	    d.append(x.name);
	var desc = objDescription(x);
	if (desc.length > 0) {
		d.append('<ul>' + desc + '</ul>');
	}
    return d;
}

function newChatInput(onSend) {
    var d = newDiv();   
    
    var inputBar = $('<input class="nameInput" x-webkit-speech/>');
    inputBar.keyup(function(event){
        if(event.keyCode == 13) {
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
		newPopupObjectEdit( n );
	});
    d.append(moreButton);

    /*var whatButton = $('<button>What</button>');
    d.append(whatButton);*/
        
    return d;
}
