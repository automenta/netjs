function getOperatorTags() {
	return _.filter(_.keys($N.tags), function(t) {
        return $N.tag(t).operator;        
    });
}


function newGoalWidget(g)  {

	var d = newDiv();


	var aa = $('<a href="#"><h2>' + g.name + '</h2></a>').appendto(d);
	aa.click(function() {
		newPopupObjectView(g);
	});

	d.addClass('GoalSummary ui-widget-content').attr('style', 'font-size: ' + (100.0 * (0.25 + g.strength) )+ '%');

	//display author avatar

	//display ETA - estimated time to activation

	var dismissButton = $('<button title="Dismiss">OK</button>').appendTo(d);

	return d;
}

function saveAddedTags(gt, tag, when) {
	_.each(gt, function(g) {
	    var G = $N.tag(g);
		var ng = objNew();

		if (when) {
			ng.when = when;
			var location = objSpacePoint($N.myself());
			if (location)
				objAddValue(ng, 'spacepoint', location);
		}

		ng.own();
		if (G)
			ng = objName(ng, G.name);
		else
			ng = objName(ng, g);

		ng = objAddTag(ng, tag);
		ng = objAddTag(ng, g);
		ng.subject = $N.myself().id;
		
		$N.pub(ng, function(err) {
			$.pnotify({
					title: 'Unable to save Goal.',
					type: 'Error'            
				});                
			}, function() {
				$.pnotify({
					title: 'Goal saved (' + ng.id.substring(0,6) + ')'
				});        
			$N.notice(ng);
		});		

	});

	//saveSelf();

}


function renderUs(v) {
	var numHours = 24;
	var timeUnitLengthMS = 60 * 60 * 1000;

    var s = self;
	var plan = getPlan();
    
    var planTimes = _.keys(plan);
    
    var time = new Date();
    time.setMinutes(0);
    time.setSeconds(0);
    time.setMilliseconds(0);
    time = time.getTime();
    
    var d = newDiv().attr('style', 'width:100%; overflow: auto;');

    
    var centroidTimes = $N.objectsWithTag('GoalCentroid');
    if (!centroidTimes) centroidTimes = [];

    var plans = [];
    var centroids = [];
    for (var k = 0; k < centroidTimes.length; k++) {
        centroids.push( $N.object(centroidTimes[k]) );
    }
    

	function updateUsView(currentUser) {
		v.empty();

		var currentGoalHeader = $('<div id="GoalHeader"></div>').addClass("ui-widget-content ui-corner-all");
		var sidebar = newDiv('goalviewSidebar').addClass('goalviewColumn');
		var goalList = newDiv('goalviewList').addClass('goalviewColumn');
		var involvesList = newDiv('goalviewInvolves').addClass('goalviewColumn');

		function updateNowDiv() {
			sidebar.empty();

			//sidebar.html(newProtogoalMenu());	

			var avatarButton = $('<span/>');

			var avatarImg = getAvatar($N.myself());
			avatarImg.attr('style', 'height: 1.5em; vertical-align: middle').appendTo(avatarButton);

			var exportButton = $('<button>Export</button>');
			exportButton.click(function() {
				var newwindow=window.open();
				var newdocument=newwindow.document;
				newdocument.write(getSelfSummaryHTML(currentUser));
			});

			currentGoalHeader.append(avatarButton, exportButton);

			if (currentUser == $N.myself().id) {
				var editButton = $('<button>Edit</button>').appendTo(currentGoalHeader);
				editButton.click(function() {
				    newPopup("Profile", {width: 375, height: 450, modal: true, position: 'center'} ).
					append(newObjectEdit($N.getObject(currentUser), true));
				});
			}

			//.append('<button disabled title="Set Focus To This Goal">Focus</button>')
			//.append('<button disabled title="Clear">[x]</button>');

			var userSelect = $('<select></select>');
			if ($N.myself()) {
				var o = $('<option value="' + $N.myself().id + '">Me (' + $N.myself().name + ')</option>').appendTo(userSelect);
				if (currentUser == $N.myself().id)
					o.attr('selected','selected');
			}
			//userSelect.append('<option>Everyone\'s</option>');

			var users = $N.objectsWithTag('User');
			_.each(users, function(uid) {
				if (uid == $N.myself().id)
					return; //skip self

				var u = $N.getObject(uid);			
				if (u) {
					var o = $('<option value="' + u.id + '">' + u.name + '</option>').appendTo(userSelect);
					if (currentUser == u.id)
						o.attr('selected','selected');
				}
			});

			currentGoalHeader.prepend(userSelect);
		
			userSelect.change(function(v) {
				updateUsView(userSelect.val());
			});

			var operators = getOperatorTags();

		    _.each(operators, function(o) {
		        var O = $N.tag(o);

				var sdd = newDiv().addClass('alternatingDiv');

				var header = newTagButton(O, function() {
					var d = newPopup("Add " + O.name, {width: 800, height: 600, modal: true});
				    d.append(newTagger([], function(results) {
						saveAddedTags(results, o);

				        later(function() {
				            d.dialog('close');                        
							updateNowDiv();
				        });
				    }));
				}).addClass('goalRowHeading').append('&nbsp;[+]').appendTo(sdd);

				var currentUserFilter = function(o) {
					o = $N.getObject(o);
					return o.author == currentUser.substring(5);
				};

				var nn = _.filter($N.objectsWithTag(o),currentUserFilter);

				if (nn.length > 0) {
					var uu = $('<ul></ul>');
					_.each(nn, function(g) {
						uu.append( newObjectSummary( $N.getObject(g), {
							showAuthorIcon: false,
							showAuthorName: false
						} ).removeClass("ui-widget-content ui-corner-all") );
					});
					sdd.append(uu);
				}
				else {
					//header.attr('style', 'font-size: 75%');
					sdd.append('<br/>');
				}
					            
				sidebar.append(sdd);
			
		    });
		    


		}

		updateNowDiv();



		var now = true;
		var goalTime = Date.now();

		function updateGoalList() {
			goalList.html('');

			var GOALS = $N.objectsWithTag('Goal', true);

			for (var i = 0; i < numHours; i++) {

				var ti = time + (i * timeUnitLengthMS);
			
				var goals = _.filter(GOALS, function(x) {
					if (x.author!=currentUser.substring(5))
						return;

					var w = x.when || 0;
					return ((w >= ti) && (w < ti+timeUnitLengthMS));
				});				


				var ts = new Date(ti);
				if (ts.getHours()!=0) {
					ts = ts.getHours() + ":00";
				}

				var d = newDiv().addClass('alternatingDiv').append('<span class="goalRowHeading">' + ts + '</span>');

				var addbutton = $('<button title="Add Tag">[+]</button>').appendTo(d);

				var y = function() {
					var tti = ti;
					var tts = ts;
					addbutton.click(function() {
						var d = newPopup("Add a Goal at " + tts, {width: 800, height: 600, modal: true})
						d.append(newTagger([], function(results) {
							saveAddedTags(results, 'Goal', tti+timeUnitLengthMS/2);

						    //now = _.unique(now.concat(results));
						    later(function() {
						        d.dialog('close');                        
								updateGoalList();
						    });
						    //container.html(newSelfTimeList(s, x, container));
						}));
					});
				}; y();

				_.each(goals, function(g) {
					var ogg = objTags(g);
					if (_.contains(ogg, 'GoalCentroid'))
						return;

					var gg = newObjectSummary( g ).addClass("miniGoalSummary");
					d.append(gg);
				});


				_.each( _.filter(centroids, function(c) {
					return (c.when >= ti) && (c.when < ti + timeUnitLengthMS);
				}), function(g) {
					newObjectSummary( g ).addClass("miniGoalSummary centroidSummary").appendTo(d);
				});

				goalList.append(d);			
			}


		}
		//setInterval(updateGoalList, updatePeriod);
		updateGoalList();

		{
			var iu = $N.objectsWithTag('involvesUser');
			_.each(iu, function(x) {
				var X = $N.getObject(x);
				involvesList.append(newObjectSummary(X));
			});
			
		}

		v.append(currentGoalHeader, sidebar, goalList, involvesList);
	}

	if ($N.myself())
		updateUsView($N.myself().id);
	else {
		//..
	}

}

function getPlan() {
	if (!$N.myself())
		return { };

    var plan = $N.myself().plan;
    if (!plan) {
        plan = $N.myself().plan = { };
	}

	return plan;
}


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
            var id = $N.id() + '-' + currentTag;
            var o = objNew(id, currentTag);
            o.author = $N.id();
            objAddTag(o, currentTag);

            for (var i = 0; i < selTags.length; i++) {
                objAddTag(o, selTags[i]);
            }

            
            $N.pub(o, function(err) {
                $.pnotify({title: 'Error saving:', text: err, type:'error'});
            }, function() {
                $N.notice(o);
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

        var tt = $N.tag(tag);
        
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
        tbutton('Learn', skillSet);
        tbutton('DoLearn', skillSet);
        tbutton('Do', skillSet);
        tbutton('DoTeach', skillSet);
        tbutton('Teach', skillSet);
    }
    tagBar.append(skillSet);
    skillSet.buttonset();

    tagBar.append('<br/>');
    
    tbutton('Can', canNeedSet);
    tbutton('Need', canNeedSet);
    tbutton('Not', canNeedSet);
    tagBar.append(canNeedSet);                
    canNeedSet.buttonset();        

    tagBar.append('<br/>');        

    return tagBar;
}

function getKnowledgeCodeTags(userid) {
    userid = userid.substring(5);
    
    var tags = $N.getIncidentTags(userid, getOperatorTags());
            
    for (var k in tags) {
        var l = tags[k];
		tags[k] = _.map(tags[k], function(o) {
			return $N.getObject(o).name;
		});
        /*for (var i = 0; i < l.length; i++) {
            l[i] = l[i].substring(l[i].indexOf('-')+1, l[i].length);
		}*/
    }
    
	var user = $N.object('Self-' + userid);
    tags['@'] = objSpacePointLatLng(user);
	tags['name'] = user.name;

    return tags;
}

function getSelfSummaryHTML(userid) {
    var tags = getKnowledgeCodeTags(userid);
    var x = '';
	var user = $N.getObject(userid);

	x += '<title>' + user.name + '</title>';
	x += '<link href="summary.css" type="text/css" rel="stylesheet"/>';
	x += '<link class="themecss" href="theme/summary.complete.css" type="text/css" rel="stylesheet"/>';
	//</head>
	x += '<script>function setTheme(t) { document.getElementsByClassName(\'themecss\')[0].setAttribute(\'href\', \'theme/summary.\' + t + \'.css\'); }</script>';
	x += '<script>function removeThemeSelect() { document.getElementById(\'ThemeSelect\').remove(); }</script>';
	x += '<body>';

	x += '<h1>' + user.name + '</h1>';

	delete tags['name'];

	var location = tags['@'];
	if (location) {
		x += '<div class="Location">' + _n(location[0],3) + ',' + _n(location[1],3) + '</div>';
		delete tags['@'];
	}

	var desc = objDescription(user);
	if (desc) {
		x += '<h3>' + desc + '</h3>';
	}

	x += '<hr/>';

	
    for (var i in tags) {
                
        var il = i;
        var stt = $N.getTag(i);
        if (stt)
            il = stt.name;

        var color = tagColorPresets[i] || 'black'; 
            
        //x += '<b style="color: ' + color + '">' + il + '</b>: ';
		x += '<div class="tagSection ' + i + '_section">';
		x += '<h2 class="' + i + '_heading">' + il + '</h2><ul>';
        for (var y = 0; y < tags[i].length; y++) {
            var tt = tags[i][y];
            x += '<li><a href="' + getENWikiURL(tt) + '">' + tags[i][y] + '</a></li>';
        }
		x += '</ul></div>';
    }

	//theme switcher
	x += '<div id="ThemeSelect">';
	x += 'Mode: ';
	x += '<button onclick="setTheme(\'complete\')">Complete</button>';
	x += '<button onclick="setTheme(\'professional\')">Professional</button>';
	x += '<button onclick="setTheme(\'canneed\')">Cans & Needs</button>';
	x += '<button onclick="setTheme(\'silly\')">Silly</button>';
	x += '<button onclick="removeThemeSelect()" title="Remove This Mode Selector">(x)</button>';
	x += '</div>';

	x+='</body>';
    
    return x;    
}

function getKnowledgeCode(userid) {
    var tags = getKnowledgeCodeTags(userid);
    
    return JSON.stringify(tags,null,0);
}



function newSelfTagList(s, user, c) {
	if (!user)
		return;

    var b = $('<div/>');
         
    var tags = $N.getIncidentTags(user.id.substring(5), _.keys(tagColorPresets));            
    
    function newTagWidget(x, i) {
        var name
        var o = $N.getObject(i);
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
        
        var xn = $N.tag(x).name;
        b.append('<div><h4><span style="padding-right: 0.2em; background-color: ' + color + '">&nbsp;&nbsp;</span>&nbsp;' + xn + '</h4></div>');
        
        for (var i = 0; i < cl.length; i++) {
            b.append(newTagWidget(x, cl[i]));
        }
        
        b.append('<br/>');
    }
    var k = _.keys(tags);
    if (k.length > 0) {

        var pinnedSections = ['Teach', 'DoTeach', 'Do', 'DoLearn', 'Learn' ];
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
        if ((user) && ($N.myself())) {
            var own = (user.id === $N.myself().id);
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
    var m = $N.myself();
    if (editFunction)
        m = editFunction(m);
    objTouch(m);

    $N.pub(m, function(err) {
        $.pnotify({
           title: 'Unable to save Self.',
           type: 'Error',
           text: err
        });           
    }, function() {
        $N.notice(m);
        $.pnotify({
           title: 'Self Saved.'            
        });
    });    
}

function newSelfSummary(s, user, content) {
	var editable = false;

	if (!user)
		return;

	if ($N.myself())
		editable = (user.id === $N.myself().id);
    

    var c = $('<div/>');        
    $.get('/$N.header.html', function(d) {
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
                objSetFirstValue( $N.myself(), 'spacepoint', {lat: l.lat, lon: l.lon, planet: 'Earth'} );            
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
    var users = $N.objectsWithTag('User');

    var d = newDiv();

    var anonymous = [];
    
    function h(x) {
        var sx = newObjectSummary(x, {
			scale: 0.5,
			depthRemaining: 0,
			nameClickable: !selectUser
		});        
        
        if ($N.myself()) {
            if (x.id === $N.myself().id) {
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
        var x = $N.object(users[i]);
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

function onWikiTagAdded(target) {
    var d = newPopup(target, {width: 550});
    var tagBar = newTagBar(self, target);
    var saveButton = newTagBarSaveButton(self, target, tagBar, function() {
        d.dialog('close');
    });

    d.append(saveButton);        
    d.prepend(tagBar);
}

function renderWiki(s, o, v) {
       
    var frame = newDiv().attr('class','SelfView');
	frame.append( newWikiBrowser(s, onWikiTagAdded) );

    v.append(frame);

    frame.onChange = function() {
        updateTags(currentUser);
        //update user summary?
    };

    return frame;
    
/*
    var roster = newRoster();
    roster.addClass('SelfRoster');
    
    var contentTags = newDiv().attr('class', 'SelfViewTags');
    var contentTime = newDiv().attr('class', 'SelfViewTime');
    var content = newDiv().attr('class', 'SelfViewContent');
    
    frame.append(roster);
    frame.append(content);

    var currentUser = $N.myself();
    
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
*/    
    
}

