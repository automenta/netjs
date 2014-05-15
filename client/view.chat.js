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
        if (!r)
            return;

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
    var oldestNewObjectMS = 10 * 60 * 1000; //10 min

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
    var newObjects = {};
    var rootsUnaffected = {};
    var modifiedDate = {};

    $(content).scroll(function() {
        var height = content.prop('scrollHeight');
        var position = content.scrollTop();
        var visible = content.height();

        if (position + visible > height - 25) {
            if (!nearBottom)
                if (updatesAvailable)
                    updateContent(true);

            nearBottom = true;
        }
        else {
            nearBottom = false;
        }
    });

    var scrollbottom = _.debounce(function() {
        content.scrollTop(content.prop('scrollHeight'));
    }, 150);

    var viewMenu = $('#AvatarViewMenu');
    $('<button>Scroll to Bottom</button>').appendTo(viewMenu).click(scrollbottom);
    //TODO toggle replies
    //TODO adjust highlight history period

    function forceUpdate() {
        updateContent(true);
        //scrollbottom();
    }

    var changed = [];

    function updateContent(force) {
        var numPreviousDisplayed = displayedObjects.length;

        var sort = 'Recent';
        var scope = 'Public';
        var semantic = 'Any';
        var maxItems = 75;
        var o = newDiv();

        var rel = getRelevant(sort, scope, semantic, $N, maxItems);
        var toDisplay = rel[0];
        var toDisplayObj = {};
        toDisplay.forEach(function(d) {
            toDisplayObj[d] = $N.object[d];
        });

        var toDisplayWithReplies = $N.getAllReplies(toDisplay);

        var added = _.difference(toDisplayWithReplies, displayedObjects);
        var removed = _.difference(displayedObjects, toDisplayWithReplies);
        var newlyChanged = _.filter(toDisplayWithReplies, function(D) {
            var dd = D.modifiedAt || D.createdAt;
            var changed = false;
            if (modifiedDate[D.id]) {
                if (modifiedDate[D.id] === dd) {
                    changed = false;
                }
                else {
                    changed = true;
                }
            }
            modifiedDate[D.id] = dd;
            return changed;
        });

        changed = _.union(changed, newlyChanged);

        if (!force) {
            if ((added.length == 0) && (removed.length == 0) && (changed.length == 0)) {
                updatesAvailable = false;
                updates.hide();
                return;
            }
            else if (!nearBottom) {
                //buffer changes
                updatesAvailable = true;

                updates.html('Updates available.<br/>');
                var updateButton = $('<button>Update</button>').click(forceUpdate).appendTo(updates);
                updates.fadeIn();

                return;
            }
            else if (nearBottom) {
                var addedContainsReplies = false;
                for (var i = 0; i < added.length; i++) {
                    var A = $N.getObject(added[i]);
                    if (A.replyTo) {
                        addedContainsReplies = true;
                        break;
                    }
                }
                if (addedContainsReplies) {
                    updates.html('Replies available.<br/>');
                    var updateButton = $('<button>Update</button>').click(forceUpdate).appendTo(updates);
                    updates.fadeIn();
                    return;
                }
            }
        }

        updates.hide();

        var rootsAffected = null;


        if (numPreviousDisplayed != 0) {
            rootsAffected = {};
            _.union(added, removed, changed).forEach(function(c) {
                var roots = $N.getReplyRoots(c);
                roots.forEach(function(r) {
                    rootsAffected[r] = true;

                    //affected, so remove from cache
                    if (rootsUnaffected[r]) {
                        rootsUnaffected[r].remove();
                        delete rootsUnaffected[r];
                    }
                });
            });
            content.find('.objectView').each(function() {
                var xid = $(this).attr('xid');
                var X = toDisplayObj[xid];

                if (!X)
                    return;
                if (X.replyTo)
                    return;

                if (!rootsAffected[xid])
                    rootsUnaffected[xid] = $(this).parent().parent().detach();
            });
        }


        content.empty();

        if (toDisplay.length === 0) {
            content.html('No messages.');
            return;
        }

        displayedObjects = [];


        for (var i = toDisplay.length - 1; i >= 0; i--) {
            var td = toDisplay[i];
            if (rootsUnaffected[td]) {
                content.append(rootsUnaffected[td]);
            }
            else {
                var x = $N.getObject(td);
                content.append(newObjectLogLine(x));
            }
        }


        var now = Date.now();
        if (numPreviousDisplayed != 0) {
            _.each(newObjects, function(v, k) {
                if (now - v > oldestNewObjectMS)
                    delete newObjects[k];
            });
            _.union(added, changed).forEach(function(a) {
                newObjects[a] = now;
            });
        }

        content.find('.objectView').each(function() {
            var xid = $(this).attr('xid');
            displayedObjects.push(xid);

            var when = newObjects[xid];
            if (!when) {
                var O = toDisplayObj[xid] || $N.getObject(xid);
                if (O)
                    when = O.modifiedAt || O.createdAt;
            }
            if (when) {
                var age = now - when;
                if (age < oldestNewObjectMS) {
                    age /= oldestNewObjectMS;
                    var c = 'rgba(0,255,0,' + 0.2 * (1.0 - age) + ');';
                    var highlightStyle = 'background-color: ' + c + '; border-right: 4px solid ' + c;
                    $(this).attr('style', highlightStyle);
                }
            }
        });

        updatesAvailable = false;
        changed = [];

        if (force)
            if (typeof force != "boolean") {
                var scrollToObject = force;
                //existing scroll position should be good if it's a reply
                if (scrollToObject.replyTo)
                    return;
            }

        //later(scrollbottom);
    }

    content.onChange = function() {
        updateContent(_myNewObject);
        _myNewObject = null;
    };
    content.destroy = function() {
        roster.destroy();
        _.values(rootsUnaffected).forEach(function(x) {
            x.remove();
        }); //destroy the DOM cache
    };

    updateContent(true);


    return content;
}

function newInlineSelfButton(s, x) {
    return newEle('a').attr({
        'aid': s.id, 'xid': x.id, 'class': 'InlineSelfButton'
    }).append(newEle('span').text(s.name), newAvatarImage(s));
}

function newObjectLogLineOnHover() {
    $(this).addClass('ChatViewContentLineHover');
}
function newObjectLogLineOffHover() {
    $(this).removeClass('ChatViewContentLineHover');
}
function newObjectLogLineClick() {
    var author = $(this).attr('aid');
    var xid = $(this).attr('xid');

    newPopupObjectView(author);
}

function lineClickFunction() {
    var line = $(this);

    var e = $(line.children()[1]);

    var x = $N.getObject(line.attr('xid'));


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
            b = newEle('a').text(x.author).attr({'xid': x.id, 'aid': x.author});
        }
        if (b) {
            b.click(newObjectLogLineClick);
            d.append(b);
        }
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
            if (onSend)
                onSend(inputBar.val(), null, {id: 'gif', value: imgURL});
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


    return d;
}
