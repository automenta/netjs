function getENWikiURL(t) {
    return 'http://en.wikipedia.org/wiki/' + t;
}

function newTagBarSaveButton(s, currentTag, tagBar, onSave) {
    var saveButton = $('<button>Save</button>');
    saveButton.addClass('WikiTagSave');
    saveButton.click(function() {
        if (currentTag==null) {
            alert('Choose a wikitag.');                
            return;                
        }

        var selTags = [];

        tagBar.find('div input').each(function() {
           var x = $(this);
           var c = x[0].checked;
           if (c) {
               var i = x.attr('id');
               var i = i.split('_')[1];
               selTags.push(i);
           }
        });
        if (selTags.length > 0) {
            var id = self.id() + '-' + currentTag;
            var o = objNew(id, currentTag);
            o.author = self.id();
            objAddTag(o, currentTag);

            for (var i = 0; i < selTags.length; i++) {
                objAddTag(o, selTags[i]);
            }

            
            self.pub(o, function(err) {
                $.pnotify({title: 'Error saving:', text: err, type:'error'});
            }, function() {
                self.notice(o);
                $.pnotify({title: 'Saved', text: currentTag});
            });                            
            
            if (onSave)
                onSave();
        }
        else {
            alert('Choose 1 or more tags to combine with the wikitag.');
        }
        
        
    });
    return saveButton;
}

function newTagBar(s, currentTag) {
    var tagBar = $('<div/>');

    //http://jqueryui.com/button/#checkbox
    var skillSet = $('<div/>');
    var canNeedSet = $('<div/>');

    function tbutton( tag, target) {
        var b = $('<input/>');
        var cid = uuid() + 'skill_' + tag + '_' + currentTag;
        b.attr('id', cid);
        b.attr('type', 'checkbox');            
        
        b.html(tag);
        b.click(function(event) {
            var t = event.target;
            if (t.checked) {
                target.children('input').each(function() {
                   var x = $(this);
                   if (x.attr('id')!=t.id) {
                       x.attr('checked', false);
                   }
                });
                target.buttonset('refresh');
            }
        });
        target.append(b);

        var tt = self.tag(tag);
        
        var tagname;
        var tooltip;
        if (tagAlias[tag]) {
            tagname = tagAlias[tag];            
            if (tt)
                tooltip = tt.name;
        }
        else 
            tagname = tt ? tt.name : tag;
        
        var l = $('<label for="' + cid + '">' + tagname + '</label>');
        l.attr('title', tooltip);
        l.attr('style','color:' + tagColorPresets[tag]);
        target.append(l);
        return b;
    }


    {
        tbutton('BeginnerStudent', skillSet);
        tbutton('IntermediateStudent', skillSet);
        tbutton('CollaboratingStudent', skillSet);
        tbutton('CollaboratingTeacher', skillSet);
        tbutton('IntermediateTeacher', skillSet);
        tbutton('ExpertTeacher', skillSet);
    }
    tagBar.append(skillSet);
    skillSet.buttonset();

    tagBar.append('<br/>');
    
    if (configuration.includeCanNeedNot) {
        tbutton('Can', canNeedSet);
        tbutton('Need', canNeedSet);
        tbutton('Not', canNeedSet);
        tagBar.append(canNeedSet);                
        canNeedSet.buttonset();        
    }

    tagBar.append('<br/>');        
    return tagBar;
}

function getKnowledgeCodeTags(s, userid) {
    userid = userid.substring(5);
    
    var tags = self.getIncidentTags(userid, _.keys(tagColorPresets));                 
        
    
    for (var k in tags) {
        var l = tags[k];
        for (var i = 0; i < l.length; i++)            
            l[i] = l[i].substring(l[i].indexOf('-')+1, l[i].length);
    }
    
    tags['@'] = objSpacePointLatLng(self.object('Self-' + userid));    
    return tags;
}

function getKnowledgeCodeHTML(s, userid) {
    var tags = getKnowledgeCodeTags(s, userid);
    var x = '';
    for (var i in tags) {
                
        if (i == '@') {            
            x += '@: ' + _n(tags[i][0], 3) + ', ' + _n(tags[i][1], 3);
        }
        else {
            var il = i;
            var stt = self.getTag(i);
            if (stt)
                il = stt.name;

            var color = tagColorPresets[i] || 'black'; 
                
            x += '<b style="color: ' + color + '">' + il + '</b>: ';
            for (var y = 0; y < tags[i].length; y++) {
                var tt = tags[i][y];
                x += '<a href="' + getENWikiURL(tt) + '">' + tags[i][y] + '</a>';
                x += '&nbsp;';
            }
        }
        x += '<br/><br/>';
    }
    
    return x;    
}

function getKnowledgeCode(s, userid) {
    var tags = getKnowledgeCodeTags(s, userid);
    
    return JSON.stringify(tags,null,0);
}

function onWikiTagAdded(target) {
    var d = newPopup(target, {width: 550});
    var tagBar = newTagBar(self, target);
    var saveButton = newTagBarSaveButton(self, target, tagBar, function() {
        d.dialog('close');
    });

    d.append(saveButton);        
    d.prepend(tagBar);
}

function newSelfTagList(s, user, c) {
	if (!user)
		return;

    var b = $('<div/>');
         
    var tags = self.getIncidentTags(user.id.substring(5), _.keys(tagColorPresets));            
    
    function newTagWidget(x, i) {
        var name
        var o = self.getObject(i);
        if (o) {
            var tags = objTags(o);
            var otherTags = _.without(tags, x);  
            var theTag = otherTags[0];
            var b = $('<div>' +  + '</div>');
            var a = $('<a href="#" title="Tag Instance">' + theTag + '</a>');
            a.click(function() {
                newPopupObjectView(i);
            });
            a.appendTo(b);

            var wlinkURL = getENWikiURL(theTag);
            var wlink = $('<a href="' + wlinkURL + '" target="_blank" title="Wikipedia Page">[W]</a>');
            b.append('&nbsp;');
            b.append('&nbsp;');
            wlink.appendTo(b);
        }
        return b;        
    }
    
    function addTagSection(x) {
        if (!x) return;
        
        var cl = tags[x];
        
        var color = tagColorPresets[x] || 'gray';
        
        var xn = self.tag(x).name;
        b.append('<div><h4><span style="padding-right: 0.2em; background-color: ' + color + '">&nbsp;&nbsp;</span>&nbsp;' + xn + '</h4></div>');
        
        for (var i = 0; i < cl.length; i++) {
            b.append(newTagWidget(x, cl[i]));
        }
        
        b.append('<br/>');
    }
    var k = _.keys(tags);
    if (k.length > 0) {

        var pinnedSections = ['ExpertTeacher', 'IntermediateTeacher', 'CollaboratingTeacher', 'CollaboratingStudent', 'IntermediateStudent', 'BeginnerStudent' ];
        for (var i = 0; i < pinnedSections.length; i++) {
            var p = pinnedSections[i];
            if (_.contains(k, p)) {
                addTagSection(p);
                k = _.without(k, p);
            }        
        }


        //ADD buttons for each tag
        for (var i = 0; i < k.length; i++) {
            addTagSection(k[i]);
        }
    }
    else {
        if ((user) && (self.myself())) {
            var own = (user.id === self.myself().id);
            b.append('Click ');

            var addLink = $('<button><b>+ Tag</b></button>' );
            if (own) {
                addLink.click(function() {
                    //TODO make tag browser
                    c.html(newWikiBrowser([], onWikiTagAdded));           
                });
            }
            else {
                addLink.click(function() {
                    alert('Feature not available yet.');
                });
            }
            b.append(addLink);
            b.append(' to add tags to describe ' + (own ? 'yourself' : user.name));
        }
        
    }
    
    return b;
}

function saveSelf(editFunction) {
    var m = self.myself();
    if (editFunction)
        m = editFunction(m);
    objTouch(m);

    self.pub(m, function(err) {
        $.pnotify({
           title: 'Unable to save Self.',
           type: 'Error',
           text: err
        });           
    }, function() {
        self.notice(m);
        $.pnotify({
           title: 'Self Saved.'            
        });
    });    
}

function newSelfSummary(s, user, content) {
	var editable = false;

	if (!user)
		return;

	if (self.myself())
		editable = (user.id === self.myself().id);
    

    var c = $('<div/>');        
    $.get('/self.header.html', function(d) {
        c.prepend(d);        
    });

    var tags = { };

    var np = $('<div/>');
    np.addClass('SelfMeta');
    
    var nameInput = $('<input type="text" placeholder="Name"/>');
    nameInput.val(user.name);
    np.append(nameInput);
    np.append('<br/>');
    var emailInput = $('<input type="text" placeholder="E-Mail"/>');
    emailInput.val(user.email);
    np.append(emailInput);

    if (!editable) {
        nameInput.attr('readonly', true);
        emailInput.attr('readonly', true);
    }
    
    np.append('<br/><br/>');
    
    var exportButton = $('<button>Export..</button>');
    exportButton.click(function() {
        var p = newPopup('Code @ ' + new Date(), {width: 550, height: 400});
        p.html('<textarea class="SelfCode" readonly="true">' + getKnowledgeCode(s, user.id) + '</textarea>');
        
        var htmlButton = $('<button>HTML Version</button>');
        htmlButton.click(function() {
           p.html('<div class="SelfCode">' + getKnowledgeCodeHTML(s, user.id) + '</div>');
        });
        p.prepend(htmlButton);
    });
    np.append(exportButton);

    if (editable) {
        var tagButton = $('<button title="Add tags to describe your self"><b>+ Tag</b></button>');
        tagButton.click(function() {
            content.html(newWikiBrowser(s, onWikiTagAdded));
        });
        np.append(tagButton);
    }
    else {
        var tagButton = $('<button title="Add tags to describe ' + user.name + '"><b>+ Tag</b></button>');
        tagButton.click(function() {
            alert('Feature not available yet.');
        });
        np.append(tagButton);
    }
    

    c.append(np);

    var bio = $('<div id="Bio"/>');
    bio.html('');

    //http://en.wikipedia.org/wiki/HResume

    var objarea = $('<div id="BioText"></div>');        
    if (editable)
        objarea.attr('contenteditable', 'true');
    
    var biotext = objDescription(user);
    if (!biotext) {
        objarea.html('<h2>Biography</h2>objective / summary / contact method / experience / achievements / eduction / skills / qualifications / affiliations / publications');
    }
    else {
        objarea.html(biotext);
    }
    
    bio.append(objarea);
 
    if (editable) {
        var resetButton = $('<button>Reset</button>');    
        bio.append(resetButton);
    
        var saveButton = $('<button><b>Save</b></button>');
        saveButton.addClass('SelfSaveButton');
        bio.append(saveButton);

        saveButton.click(function() {
            saveSelf(function(m) {
				_.each(['Human','User'], function(t) {
					if (!objHasTag(m, t)) {
						m = objAddTag(m, t);
					}
				});

                m.name = nameInput.val();
                m.email = emailInput.val();		
                objRemoveDescription(m);
                objAddDescription(m, objarea.html());
                objTouch(m);

                return m;
            });
        });
    }

    var cm = $('<div id="SelfMap"/>');
    c.append(cm);
    c.append(bio);

    var location = objSpacePointLatLng(user);

    later(function() {        
        var lmap = initLocationChooserMap('SelfMap', location, 7, editable ? undefined : false );
        cm.append('<br/>');
        var locAnon = $('<select><option>Exact Location</option><option>Anonymize 1km</option><option>Anonymize 10km</option><option>No Location</option></select>');
        locAnon.change(function() {
            //0.1 = ~10km
            //0.01 = ~1km
           alert('Feature not available yet'); 
        });
        //cm.append(locAnon);

        lmap.onClicked = function(l) {
            if (editable) {
                tags['@'] = [ l.lon, l.lat ];
                objSetFirstValue( self.myself(), 'spacepoint', {lat: l.lat, lon: l.lon, planet: 'Earth'} );            
            }
        };
    });

    c.append('<div style="clear: both"/>');

    //var kc = $('<div id="KnowledgeChart"/>');

    /*var st = _.groupBy(_.without(_.keys(tags), '@'), function(t) { return tags[t]; });                

    function displayKnowledgeSection(n, t) {
        kc.append('<span class="KnowledgeSectionLabel" style="background-color: ' + levelColor[n] + '">&nbsp;&nbsp;</span>&nbsp;');
        kc.append('<span class="KnowledgeSectionLabel">' + levelLabel[n] + '</span>');
        for (var x=0; x < t.length; x++) {
            var i = t[x];
            var l = $('<p/>');
            var ki = $('<a href="/wiki/' + i + '">' + i + '</a>');
            l.append(ki);
            kc.append(l);                    
        }
        kc.append('<br/>');
    }

    if (st[3]) displayKnowledgeSection(3, st[3]);
    if (st[2]) displayKnowledgeSection(2, st[2]);
    if (st[1]) displayKnowledgeSection(1, st[1]);
    if (st[-1]) displayKnowledgeSection(-1, st[-1]);
    if (st[-2]) displayKnowledgeSection(-2, st[-2]);
    if (st[-3]) displayKnowledgeSection(-3, st[-3]);*/

    //c.append(kc);


    /*c.append('<div id="KnowledgeCodeLabel">Knowedge Code:</div>');
    var p = $('<pre>');
    p.html(JSON.stringify(tags));
    c.append(p);*/
                

    return c;
}


function newRoster(selectUser) {
    var users = self.objectsWithTag('User');

    var d = newDiv();

    var anonymous = [];
    
    function h(x) {
        var sx = newObjectSummary(x, null, 0.5, 0, (selectUser ? true : false));        
        
        if (self.myself()) {
            if (x.id === self.myself().id) {
                sx.find('h1').append(' (me)');
                d.prepend(sx);            
            }
            else {
                d.append(sx);
            }
        }
        else {
            d.append(sx);            
        }
        
        sx.click(function() {
            if (selectUser) {
                later(function() {
                    selectUser(x);
                }); 
            }
        });        
    }
    
    for (var i = 0; i < users.length; i++) {
        var x = self.object(users[i]);
        if (x.name === 'Anonymous') {
            anonymous.push(x);
            continue;
        }
        h(x);
    }
    
    for (var i = 0; i < anonymous.length; i++) {
        var x = anonymous[i];
        h(x);
    }
    return d;
}

function hoursFromNow(n) {
    return Date.now() + 60.0 * 60.0 * 1000.0 * n;
}



function renderSelf(s, o, v) {
       
    var frame = newDiv().attr('class','SelfView');
    
    var roster = newRoster();
    roster.addClass('SelfRoster');
    
    var contentTags = newDiv().attr('class', 'SelfViewTags');
    var contentTime = newDiv().attr('class', 'SelfViewTime');
    var content = newDiv().attr('class', 'SelfViewContent');
    
    frame.append(roster);
    frame.append(content);

    var currentUser = self.myself();
    
    function summaryUser(x) {
        currentUser = x;
        content.html('');
        content.append(newSelfSummary(s, x, content));
        content.append(contentTags);       
        content.append(contentTime);       
        updateTags(x);
    }
    
    function updateTags(x) {
        contentTags.html(newSelfTagList(s, x, content));

		if (x)
		    if (configuration.showPlanOnSelfPage) {
		        //contentTime.html(newSelfTimeList(x, contentTime));
			}

        roster.html(newRoster(function(x) {
            summaryUser(x);
        }));
    }
    
    summaryUser(currentUser);
    
    v.append(frame);
        
    frame.onChange = function() {
        updateTags(currentUser);
        //update user summary?
    };
    
    return frame;
    
}

