addView({
	id: 'us',
	name: 'Users',
	icon: 'icon/view.us.svg',
	start: function(v) {

		var panel = newDiv().addClass('User ViewPage panel panel-default').appendTo(v);
		var panelHeading = $('<div class="panel-heading"></div>').appendTo(panel);

		panelHeading.append('<br/>');

		var panelContent = newDiv().addClass('panel-body').appendTo(panel);
		panel.append(panelContent);

		var s = self;
		var plan = getPlan();

		var planTimes = _.keys(plan);





		var centroidTimes = $N.objectsWithTag('GoalCentroid');
		if (!centroidTimes)
			centroidTimes = [];

		var plans = [];
		var centroids = [];
		for (var k = 0; k < centroidTimes.length; k++) {
			centroids.push($N.instance[centroidTimes[k]]);
		}


		function updateUsView(currentUser) {
			panelContent.empty();
			var panelContentLeft = newDiv().addClass('col-md-6').appendTo(panelContent);
			var panelContentRight = newDiv().addClass('col-md-6').appendTo(panelContent);

			var goalList = newDiv();

			//generate panelHeading
			panelHeading.empty();

			var avatarButton = $('<span/>').appendTo(panelHeading);
			newAvatarImage(currentUser).appendTo(avatarButton);

			var userSelect = newAuthorCombo(currentUser);
			userSelect.change(function(v) {
				updateUsView(userSelect.val());
			});
			panelHeading.append(userSelect);


			var exportButton = $('<button title="Summarize"><i class="fa fa-trophy"></i> Summarize</button>');
			exportButton.click(function() {
				$N.saveAll();
				newPopupObjectEdit(newSelfSummary(currentUser), true);
			});

			panelHeading.append(exportButton);


			var operators = getOperatorTags();

			var currentUserFilter = function(o) {
				o = $N.instance[o];
				if (!o) return false;

				if (o.subject)
					if (o.subject != currentUser) return false;

				return (o.author == currentUser);
			};

			function addTheTag(T) {
				return function() {
					var d = newPopup('Add ' + T.name, {
						width: 800,
						height: 600,
						modal: true
					});
					d.append(newTagger([], function(results) {
						var property;
						if ((T.id == 'Do') || (T.id == 'Learn') || (T.id == 'Teach'))
							property = 'know';
						else
							property = _.keys(T.property)[0]; //first property of the tag

						saveAddedTags(results, T.id, property);

						later(function() {
							d.dialog('close');
						});
					}));
				}
			}

			_.each(operators, function(o) {
				var O = $N.class[o];


				if ($N.getTag('DoLearn') || ((o != 'Do') && (o != 'Learn') && (o != 'Teach'))) {
					var sdd = newDiv();


					//not a 3-vector system
					var header = newTagButton(O, addTheTag(O)).addClass('goalRowHeading').append('&nbsp;[+]');

					panelContentLeft.append(
						newBootstrapPanel(header, sdd));

					var nn = _.filter($N.objectsWithTag(O, false, true), currentUserFilter);

					if (nn.length > 0) {
						var uu = $('<ul></ul>');
						_.each(nn, function(g) {
							var G = $N.instance[g];
							var ss = newObjectView(G, {
								showAuthorIcon: false,
								showAuthorName: false,
								showMetadataLine: false,
								showActionPopupButton: false,
								titleClickMode: (G.author == $N.id() ? 'edit' : 'view')
							}).removeClass('ui-widget-content ui-corner-all').addClass('objectViewBorderless');
							if (G.name == O.name) {
								ss.find('h1 a').html('&gt;&gt;');
								ss.find('h1').replaceTag($('<div style="float: left">'), true);
								ss.find('ul').replaceTag($('<div style="float: left">'), true);
								ss.find('li').replaceTag($('<div>'), true);
							}
							uu.append(ss);
						});
						sdd.append(uu);
					} else {
						//header.attr('style', 'font-size: 75%');
						sdd.append('<br/>');
					}

				}

			});

			{
				//3-vector system : sliders
				var nn = _.filter($N.objectsWithTag(['Do', 'Learn', 'Teach']), currentUserFilter);

				var d = newDiv();
				panelContentRight.append(newBootstrapPanel(null, d));

				function rangeToTags(x, newValue) {
					objRemoveTag(x, 'Do');
					objRemoveTag(x, 'Learn');
					objRemoveTag(x, 'Teach');

					if (newValue == 0) {
						objAddTag(x, 'Do');
					} else if (newValue > 0) {
						if (newValue < 1.0)
							objAddTag(x, 'Do', (1.0 - newValue));
						objAddTag(x, 'Teach', (newValue));
					} else if (newValue < 0) {
						if (newValue > -1.0)
							objAddTag(x, 'Do', (1.0 + newValue));
						objAddTag(x, 'Learn', (-newValue));
					}
					//console.log(x);
				}

				function newLeftColDiv() {
					return $('<div style="width: 48%; float: left; clear: both"/>');
				}

				function newRightColDiv() {
					return $('<div style="width: 48%; float: right"/>');
				}

				newLeftColDiv().addClass('goalRowHeading').appendTo(d).append('Know');

				var kb = newDiv();
				var lButton = $('<button title="Learn">Learn</button>').css('width', '32%').css('float', 'left').appendTo(kb);
				var dButton = $('<button title="Do">Do</button>').css('float', 'left').css('width', '34%').appendTo(kb);
				var tButton = $('<button title="Teach">Teach</button>').css('width', '32%').css('float', 'left').appendTo(kb);
				lButton.css('color', '#aa0000').click(addTheTag($N.getTag('Learn')));
				dButton.css('color', '#00aa00').click(addTheTag($N.getTag('Do')));
				tButton.css('color', '#0000aa').click(addTheTag($N.getTag('Teach')));


				newRightColDiv().appendTo(d).append(kb);

				_.each(nn, function(x) {
					var X = $N.instance[x];
					var lc = newLeftColDiv().appendTo(d);
					var rc = newRightColDiv().appendTo(d);

					var nameLink = $('<a">' + X.name + '</a>');
					nameLink.click(function() {
						newPopupObjectView(x);
					});
					var colorSquare = $('<span>&nbsp;&nbsp;&nbsp;</span>&nbsp;');
					lc.append(colorSquare, nameLink);

					var slider = $('<input type="range" min="-1" max="1" step="0.05"/>').addClass('SkillSlider');

					if (X.author != $N.id())
						slider.attr('disabled', 'disabled');

					slider.attr('value', knowTagsToRange(X));

					var SLIDER_CHANGE_MS = 500;

					var updateTags = _.throttle(function() {
						rangeToTags(X, parseFloat(slider.val()));
						$N.pub(X);
					}, SLIDER_CHANGE_MS);


					function updateColor() {
						var sv = parseFloat(slider.val());
						var cb = hslToRgb(((sv + 1.0) / 2.1 + 0.0) / 1.7, 0.9, 0.7);
						var bgString = 'rgba(' + parseInt(cb[0]) + ',' + parseInt(cb[1]) + ',' + parseInt(cb[2]) + ',1.0)';
						colorSquare.css('background-color', bgString);
					}
					updateColor();

					slider.change(function() {
						updateColor();
						later(function() {
							updateTags();
						});
					});
					rc.append(slider);

				});
			}

			var now = true;
			var goalTime = Date.now();


			newGoalList(goalList, currentUser, centroids);
			panelContentRight.append(
				newBootstrapPanel('Agenda', goalList));

		}



		if ($N.myself())
			updateUsView($N.myself().id);
		else {
			var users = $N.objectsWithTag('User');
			updateUsView(users[0]); //start with first user
		}

	},
	stop : function() {
	}
});
	

var GOAL_EXPIRATION_INTERVAL = 2 * 60 * 60 * 1000; //2 hours, in MS

function knowTagsToRange(x) {
	var s = objTagStrength(x, false);

	//if (s['DoLearn'])...

	var DO = s['Do'] || 0;
	var LEARN = s['Learn'] || 0;
	var TEACH = s['Teach'] || 0;

	//console.log(LEARN, DO, TEACH);

	if (LEARN && TEACH) {
		console.log(x + ' has conflicting Learn and Teach strengths');
		TEACH = null;
		LEARN = null;
	}
	if (LEARN) {
		var total = LEARN + DO;
		LEARN /= total;
		DO /= total;

		return -1 * LEARN;
	}
	else if (TEACH) {
		var total = TEACH + DO;
		TEACH /= total;
		DO /= total;

		return 1 * TEACH;
	}
	else {
		return 0;
	}
}



function newGoalWidget(g) {

    var d = newDiv();


    var aa = $('<a><h2>' + g.name + '</h2></a>').appendto(d);
    aa.click(function () {
        newPopupObjectView(g);
    });

    d.addClass('GoalSummary ui-widget-content').attr('style', 'font-size: ' + (100.0 * (0.25 + g.strength)) + '%');

    //display author avatar

    //display ETA - estimated time to activation

    var dismissButton = $('<button title="Dismiss">OK</button>').appendTo(d);

    return d;
}

function saveAddedTags(gt, tag, property, when) {
    _.each(gt, function (g) {
		
		var T = $N.class[tag];
        var G = $N.object[g];
        var ng = objNew();

        if (when) {
            ng.when = when;
            ng.expiresAt = when + GOAL_EXPIRATION_INTERVAL;
            var location = objSpacePoint($N.myself());
            if (location)
                objAddValue(ng, 'spacepoint', location);
        }

		var Tname = T.name;
		if ((T.id == 'Learn') || (T.id == 'Do') || (T.id == 'Teach'))
			Tname = 'Know';
		
        ng.own();
        ng.subject = $N.myself().id;		
        ng = objName(ng, Tname + ': ' + (G ? G.name : g));
        ng = objAddTag(ng, tag);
        ng = objAddValue(ng, property, g);		
        		
        $N.pub(ng, function (err) {
            notify({
                title: 'Error: Unable to save.',
                type: 'Error',
				text: ng.name
            });
        }, function () {
            notify({
                title: 'Saved',
				text: ng.name
            });
        });

    });

}


function newAuthorCombo(currentUser, includeAll) {

    var userSelect = $('<select></select>');

    if (includeAll) {
        var o = $('<option value="">Everyone</option>').appendTo(userSelect);
        if ((currentUser == '') || (!currentUser))
            o.attr('selected', 'selected');
    }

    if ($N.myself()) {
        var o = $('<option value="' + $N.myself().id + '">Me (' + $N.myself().name + ')</option>').appendTo(userSelect);
        if (currentUser == $N.myself().id)
            o.attr('selected', 'selected');
    }

    var users = $N.getTagged('User');
	
    _.each(users, function (uid) {
        if ($N.myself())
            if (uid == $N.myself().id)
                return; //skip self

        var u = $N.instance[uid];
		if (!u) return;
		
		if (u.author !== u.id)
			return;

        if (u) {
            var o = $('<option value="' + u.id + '">' + u.name + '</option>').appendTo(userSelect);
            if (currentUser == u.id)
                o.attr('selected', 'selected');
        }
    });
    return userSelect;
}



	
function getPlan() {
    if (!$N.myself())
        return {};

    var plan = $N.myself().plan;
    if (!plan) {
        plan = $N.myself().plan = {};
    }

    return plan;
}



function newTagBarSaveButton(s, currentTag, tagBar, onSave) {
    var saveButton = $('<button>Save</button>');
    saveButton.addClass('WikiTagSave');
    saveButton.click(function () {
        if (currentTag == null) {
            alert('Choose a wikitag.');
            return;
        }

        var selTags = [];

        tagBar.find('div input').each(function () {
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
            o.author = o.subject = $N.id();

            for (var i = 0; i < selTags.length; i++) {
                var T = selTags[i];
                if (!$N.getTag('DoLearn')) {
                    //apply 3-vector
                    objRemoveTag(o, 'Do');
                    objRemoveTag(o, 'Learn');
                    objRemoveTag(o, 'Teach');

                    if (T == 'Learn') {
                        objAddTag(o, 'Learn');
                    } else if (T == 'Teach') {
                        objAddTag(o, 'Teach');
                    } else if (T == 'Do') {
                        objAddTag(o, 'Do');
                    } else if (T == 'DoLearn') {
                        objAddTag(o, 'Learn', 0.5);
                        objAddTag(o, 'Do', 0.5);
                    } else if (T == 'DoTeach') {
                        objAddTag(o, 'Teach', 0.5);
                        objAddTag(o, 'Do', 0.5);
                    }

                    continue;
                }

                objAddTag(o, T);
            }
            objAddTag(o, currentTag);

            $N.pub(o, function (err) {
                notify({
                    title: 'Error saving:',
                    text: err,
                    type: 'error'
                });
            }, function () {
                $N.notice(o);
                notify({
                    title: 'Saved',
                    text: currentTag
                });
            });

            if (onSave)
                onSave();
        } else {
            alert('Choose 1 or more tags to combine with the wikitag.');
        }


    });
    return saveButton;
}

function newTagBar(s, currentTag) {
    var tagBar = $('<div/>');
    tagBar.addClass('TagBar');

    //http://jqueryui.com/button/#checkbox
    var skillSet = $('<div/>');
    var canNeedSet = $('<div/>');

    function tbutton(tag, target) {
        var b = $('<input/>');
        var cid = duid();// + 'skill_' + tag + '_' + currentTag;
        b.attr('id', cid);
        b.attr('type', 'checkbox');

        b.html(tag);
        b.click(function (event) {
            var t = event.target;
            if (t.checked) {
                target.children('input').each(function () {
                    var x = $(this);
                    if (x.attr('id') != t.id) {
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
        } else
            tagname = tt ? tt.name : tag;

        var icon = getTagIcon(tag);
        var iconString = '';
        if (icon)
            iconString = '<img src="' + icon + '" style="height: 1em"/>&nbsp;';

        var l = $('<label for="' + cid + '">' + iconString + tagname + '</label>');
        l.attr('title', tooltip);
        target.append(l);
        return b;
    }


    {
        /*if (configuration.knowLevels == 6) {
            //6 curiosume levels
            tbutton('Learn', skillSet);
            tbutton('LearnDo', skillSet);
            tbutton('DoLearn', skillSet);
            tbutton('DoTeach', skillSet);
            tbutton('TeachDo', skillSet);
            tbutton('Teach', skillSet);
        } else if (configuration.knowLevels == 5) {
            tbutton('Learn', skillSet);
            tbutton('DoLearn', skillSet);
            tbutton('Do', skillSet);
            tbutton('DoTeach', skillSet);
            tbutton('Teach', skillSet);
        } else if (configuration.knowLevels == 3)*/ {
            tbutton('Learn', skillSet);
            tbutton('Do', skillSet);
            tbutton('Teach', skillSet);
        }
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


function dloc(l) {
	return [parseFloat(l[0].toFixed(3)), parseFloat(l[1].toFixed(3))];
}

function isKnowledgeTag(t) {
	return ['Do', 'DoTeach', 'DoLearn', 'LearnDo', 'TeachDo', 'Teach', 'Learn'].indexOf(t) != -1;
}

function objIsPublic(o) {
	return (o.scope || configuration.defaultScope) >= ObjScope.Global;
}
function getKnowledgeCode(userid) {
    var tags = getKnowledgeCodeTags(userid);

    return JSON.stringify(tags, null, 0);
}


function getOperatorTags() {
    return ['Trust','Can', 'Need', 'Not', 'Value','Learn','Do','Teach'];
}

function newSelfSummary(userid) {
	
	var U = $N.instance[userid];
	
	var operatorTags = getOperatorTags();
	
	var tags = $N.getIncidentTags(userid, operatorTags);

	for (var k in tags) {
		var l = tags[k];
		tags[k] = _.map(tags[k], function(o) {
			var O = $N.instance[o];
			var strength = objTagStrength(O, false);
			var firstNonOperatorTag = null;
			var allTags = objTags(O, false);
			for (var m = 0; m < allTags.length; m++) {
				var s = allTags[m];
				if (operatorTags.indexOf(s) == -1) {
					firstNonOperatorTag = s;
					break;
				}
			}
			return [O.name, strength[k], O];
		});
		tags[k] = tags[k].sort(function(a, b) {
			return b[1] - a[1];
		});

		/*for (var i = 0; i < l.length; i++) {
			l[i] = l[i].substring(l[i].indexOf('-')+1, l[i].length);
		}*/
	}

	tags['@'] = objSpacePointLatLng(U);
	tags['name'] = U.name;

	var n = new $N.nobject();
	n.setName('Summary of ' + U.name );
	n.addDescription('<pre>'+getUserTextCode(tags, U)+'</pre>');
	return n;
}

function getUserTextCode(tags, user) {
	var s = '';
	var nameline = user.name + ' (' + user.id + ')';
	var location = objSpacePointLatLng(user);
	if (location)
		nameline += ' @' + JSON.stringify(dloc(location));

	var operatorTags = getOperatorTags();
	var processed = {};

	function getTitleString(tl) {
		var name = tl[0];
		var tagID = tl[3];
		if (name != tagID)
			return name + ' [' + tagID + ']';
		return name;
	}


	//Knowledge Tags
	var header = 'Know                                    L=========D=========T\n';
	var chartColumn = header.indexOf('L');
	for (var j = operatorTags.length - 1; j >= 0; j--) {
	   	var i = operatorTags[j];
		if (isKnowledgeTag(i)) {
			if (!tags[i]) continue;
			for (var y = 0; y < tags[i].length; y++) {				
				var O = tags[i][y][2];
				var oid = O.id;

				if (!objIsPublic(O)) continue;

				if (processed[oid]) continue;
				processed[oid] = true;

				var vv = tags[i][y][2].value;
				vv.forEach(function(V) {
					if (V.value) {
						var line = V.value;
						var spacePadding = chartColumn - line.length - 2;
						for (var n = 0; n < spacePadding; n++)
							line += ' ';
						var knowLevel = knowTagsToRange(O);
						var chartIndex = Math.round(knowLevel * 10);
						for (var n = -10; n <= 10; n++) {
							if (n == chartIndex) line += '|';
							else line += '-';
						}

						s += '  ' + line + '\n';
					}
				});
						   
				
				

			}
		}
	}
	if (s.length > 0) s = header + s;
	s = nameline + '\n' + s;

	for (var j = 0; j < operatorTags.length; j++) {
	   	var i = operatorTags[j];
		if (!isKnowledgeTag(i)) {
			if (!tags[i]) continue;
			s += i + '\n';
			for (var y = 0; y < tags[i].length; y++) {
				var O = tags[i][y][2];
				var oid = O.id;

				if (!objIsPublic(O)) continue;

				var vv = tags[i][y][2].value;
				vv.forEach(function(V) {
					if (V.value) {
						var line = V.value;
						s += '  ' + line + '\n';
					}
				});				
			}
		}
	}

	return s;
}


function newSelfTagList(s, user, c) {
    if (!user)
        return;

    var b = $('<div/>');

    var tags = $N.getIncidentTags(user.id, _.keys(tagColorPresets));

    function newTagWidget(x, i) {
        var name
        var o = $N.instance[i];
        if (o) {
            var tags = objTags(o);
            var otherTags = _.without(tags, x);
            var theTag = otherTags[0];
            var b = $('<div>' + '</div>');
            var a = $('<a title="Tag Instance">' + theTag + '</a>');
            a.click(function () {
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
        if (!x)
            return;

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

        var pinnedSections = ['Teach', 'DoTeach', 'Do', 'DoLearn', 'Learn'];
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
    } else {
        if ((user) && ($N.myself())) {
            var own = (user.id === $N.myself().id);
            b.append('Click ');

            var addLink = $('<button><b>+ Tag</b></button>');
            if (own) {
                addLink.click(function () {
                    //TODO make tag browser
                    c.html(newWikiBrowser([], onWikiTagAdded));
                });
            } else {
                addLink.click(function () {
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

    $N.pub(m, function (err) {
        notify({
            title: 'Unable to save Self.',
            type: 'Error',
            text: err
        });
    }, function () {
        $N.notice(m);
        notify({
            title: 'Self Saved.'
        });
    });
}



function newRoster(selectUser) {
    var users = $N.objectsWithTag('User');

    var d = newDiv();

    var anonymous = [];

    function h(x) {
        var sx = newObjectView(x, {
            scale: 0.5,
            depthRemaining: 0,
            nameClickable: !selectUser
        });

        if ($N.myself()) {
            if (x.id === $N.myself().id) {
                sx.find('h1').append(' (me)');
                d.prepend(sx);
            } else {
                d.append(sx);
            }
        } else {
            d.append(sx);
        }

        sx.click(function () {
            if (selectUser) {
                later(function () {
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
    var d = newPopup(target, {
        width: 650,
        modal: true
    });
    var tagBar = newTagBar(self, target);
    var saveButton = newTagBarSaveButton(self, target, tagBar, function () {
        d.dialog('close');
    });
    var cancelButton = $('<button>Cancel</button>').click(function () {
        d.dialog('close');
    });

    d.append(saveButton, cancelButton);
    d.prepend(tagBar);
}

function newWikiView(v) {

    var frame = newDiv().attr('class', 'SelfView');
    frame.append(newWikiBrowser($N, onWikiTagAdded));

    v.append(frame);

    frame.onChange = function () {
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
     content.empty();
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

function newOperatorTagTable(keywords) {
    var operators = getOperatorTags();
    var d = newDiv();

    var t = $('<table/>').appendTo(d);
    var heading = $('<tr/>').appendTo(t);

    $('<th>Tag</th>').appendTo(heading);
    for (var j = 0; j < operators.length; j++) {
        $('<th>' + operators[j] + '</th>').appendTo(heading);
    }

    var rows = [];

    for (var i = 0; i < keywords.length; i++) {
        (function (I) {
            var k = keywords[I];
            var tag = k.text; //r = k.relevance

            var tagedit = $('<input type="text" value="' + tag + '"/>');
            var tagsearchbutton = $('<button title="Search Wikipedia">..</button>');
            tagsearchbutton.click(function () {
                var d = newPopup("Tag", {
                    width: 800,
                    height: 600,
                    modal: true
                })
                d.append(newWikiBrowser([], function (t) {
                    d.dialog('close');
                    tagedit.val(t);
                }, {
                    initialSearch: tagedit.val()
                }));
            });

            var row = $('<tr/>').appendTo(t);

            var tagfield = $('<td/>');
            tagfield.append(tagedit, tagsearchbutton);

            tagfield.appendTo(row);

            var rowcheckboxes = [];

            for (var j = 0; j < operators.length; j++) {
                (function (J) {
                    var tdc = $('<td></td>').appendTo(row);
                    var idc = $('<input type="checkbox"/>').appendTo(tdc);
                    rowcheckboxes.push(function () {
                        if (idc.is(':checked')) {
                            return operators[J];
                        }
                        return null;
                    });
                })(j);
            }

            row.data = function () {
                var x = {};
                var count = 0;
                _.each(rowcheckboxes, function (c) {
                    var cr = c();
                    if (cr != null) {
                        x[cr] = true;
                        count++;
                    }
                });
                if (count == 0)
                    return {};
                var y = {};
                y[tagedit.val()] = x;
                return y;
            };

            rows.push(row);
        })(i);
    }

    d.getData = function () {
        var data = {};
        _.each(rows, function (r) {
            var rd = r.data();
            data = _.extend(data, rd);
        });
        return data;
    };



    return d;
}

function newTextReader(text, onSave) {
    var n = newDiv().addClass('TextReader');

    var input = $('<textarea/>').appendTo(n);
    input.val(text);

    var submit = $('<button>Read</button>').appendTo(n);
    var results = newDiv().appendTo(n);

    submit.click(function () {
        var t = input.val();
        $.post('/read/text', {
            text: t
        }, function (r) {

            //results.html(JSON.stringify(r, null, 4));

            var ott = newOperatorTagTable(r);
            ott.appendTo(results);

            $('<br/>').appendTo(results);

            var saveButton = $('<button>Save</button>').appendTo(results);
            saveButton.click(function () {
                var data = ott.getData();
                onSave(data);
            });
        });
    });

    return n;
}



//function newSelfSummary(s, user, content) {
//    var editable = false;
//
//    if (!user)
//        return;
//
//    if ($N.myself())
//        editable = (user.id === $N.myself().id);
//
//
//    var c = $('<div/>');
//    $.get('/$N.header.html', function (d) {
//        c.prepend(d);
//    });
//
//    var tags = {};
//
//    var np = $('<div/>');
//    np.addClass('SelfMeta');
//
//    var nameInput = $('<input type="text" placeholder="Name"/>');
//    nameInput.val(user.name);
//    np.append(nameInput);
//    np.append('<br/>');
//    var emailInput = $('<input type="text" placeholder="E-Mail"/>');
//    emailInput.val(user.email);
//    np.append(emailInput);
//
//    if (!editable) {
//        nameInput.attr('readonly', true);
//        emailInput.attr('readonly', true);
//    }
//
//    np.append('<br/><br/>');
//
//    var exportButton = $('<button>Export..</button>');
//    exportButton.click(function () {
//        var p = newPopup('Code @ ' + new Date(), {
//            width: 550,
//            height: 400
//        });
//        p.html('<textarea class="SelfCode" readonly="true">' + getKnowledgeCode(s, user.id) + '</textarea>');
//
//        var htmlButton = $('<button>HTML Version</button>');
//        htmlButton.click(function () {
//            p.html('<div class="SelfCode">' + getKnowledgeCodeHTML(s, user.id) + '</div>');
//        });
//        p.prepend(htmlButton);
//    });
//    np.append(exportButton);
//
//    if (editable) {
//        var tagButton = $('<button title="Add tags to describe your self"><b>+ Tag</b></button>');
//        tagButton.click(function () {
//            content.html(newWikiBrowser(s, onWikiTagAdded));
//        });
//        np.append(tagButton);
//    } else {
//        var tagButton = $('<button title="Add tags to describe ' + user.name + '"><b>+ Tag</b></button>');
//        tagButton.click(function () {
//            alert('Feature not available yet.');
//        });
//        np.append(tagButton);
//    }
//
//
//    c.append(np);
//
//    var bio = $('<div id="Bio"/>');
//    bio.empty();
//
//    //http://en.wikipedia.org/wiki/HResume
//
//    var objarea = $('<div id="BioText"></div>');
//    if (editable)
//        objarea.attr('contenteditable', 'true');
//
//    var biotext = objDescription(user);
//    if (!biotext) {
//        objarea.html('<h2>Biography</h2>objective / summary / contact method / experience / achievements / eduction / skills / qualifications / affiliations / publications');
//    } else {
//        objarea.html(biotext);
//    }
//
//    bio.append(objarea);
//
//    if (editable) {
//        var resetButton = $('<button>Reset</button>');
//        bio.append(resetButton);
//
//        var saveButton = $('<button><b>Save</b></button>');
//        saveButton.addClass('SelfSaveButton');
//        bio.append(saveButton);
//
//        saveButton.click(function () {
//            saveSelf(function (m) {
//                _.each(['Human', 'User'], function (t) {
//                    if (!objHasTag(m, t)) {
//                        m = objAddTag(m, t);
//                    }
//                });
//
//                m.name = nameInput.val();
//                m.email = emailInput.val();
//                objRemoveDescription(m);
//                objAddDescription(m, objarea.html());
//                objTouch(m);
//
//                return m;
//            });
//        });
//    }
//
//    var cm = $('<div id="SelfMap"/>');
//    c.append(cm);
//    c.append(bio);
//
//    var location = objSpacePointLatLng(user);
//
//    later(function () {
//        var lmap = initLocationChooserMap('SelfMap', location, 7, editable ? undefined : false);
//        cm.append('<br/>');
//        var locAnon = $('<select><option>Exact Location</option><option>Anonymize 1km</option><option>Anonymize 10km</option><option>No Location</option></select>');
//        locAnon.change(function () {
//            //0.1 = ~10km
//            //0.01 = ~1km
//            alert('Feature not available yet');
//        });
//        //cm.append(locAnon);
//
//        lmap.onClicked = function (l) {
//            if (editable) {
//                tags['@'] = [l.lon, l.lat];
//                objSetFirstValue($N.myself(), 'spacepoint', {
//                    lat: l.lat,
//                    lon: l.lon,
//                    planet: 'Earth'
//                });
//            }
//        };
//    });
//
//    c.append('<div style="clear: both"/>');
//
//    //var kc = $('<div id="KnowledgeChart"/>');
//
//    /*var st = _.groupBy(_.without(_.keys(tags), '@'), function(t) { return tags[t]; });                
//     
//     function displayKnowledgeSection(n, t) {
//     kc.append('<span class="KnowledgeSectionLabel" style="background-color: ' + levelColor[n] + '">&nbsp;&nbsp;</span>&nbsp;');
//     kc.append('<span class="KnowledgeSectionLabel">' + levelLabel[n] + '</span>');
//     for (var x=0; x < t.length; x++) {
//     var i = t[x];
//     var l = $('<p/>');
//     var ki = $('<a href="/wiki/' + i + '">' + i + '</a>');
//     l.append(ki);
//     kc.append(l);                    
//     }
//     kc.append('<br/>');
//     }
//     
//     if (st[3]) displayKnowledgeSection(3, st[3]);
//     if (st[2]) displayKnowledgeSection(2, st[2]);
//     if (st[1]) displayKnowledgeSection(1, st[1]);
//     if (st[-1]) displayKnowledgeSection(-1, st[-1]);
//     if (st[-2]) displayKnowledgeSection(-2, st[-2]);
//     if (st[-3]) displayKnowledgeSection(-3, st[-3]);*/
//
//    //c.append(kc);
//
//
//    /*c.append('<div id="KnowledgeCodeLabel">Knowedge Code:</div>');
//     var p = $('<pre>');
//     p.html(JSON.stringify(tags));
//     c.append(p);*/
//
//
//    return c;
//}
