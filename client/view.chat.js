function renderChat(v) {
    var frame = newDiv();
    
    var roster = newRoster().attr('class', 'ChatViewRoster');    
    var content = newDiv().attr('class', 'ChatViewContent');    
    var input = newChatInput(function(x) {
        var o = objNew();
		o = o.own();
        o = objName(o, x);
		o = objAddTag(o, 'Message');
		self.publish(o);

    }).attr('class', 'ChatViewInput');
    
    frame.append(roster);
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
        
        var rel = getRelevant(sort, scope, semantic, s, o, maxItems);
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

        content.scrollTop(content.prop("scrollHeight"));


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
        var a = self.getSelf(x.author);
        if (a) {
            d.append(newInlineSelfButton(a));
        }
        else {
            d.append(x.author);
        }
        d.append(':&nbsp;');
    }
    d.append(x.name);
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

    /*var whatButton = $('<button>What</button>');
    d.append(whatButton);*/
        
    return d;
}
