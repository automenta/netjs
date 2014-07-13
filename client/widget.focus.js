function isFocusClear() {
    var f = $N.focus();
    if (!f)
        return true;

    if (f.name)
        return false;

    if (f.value)
        if (f.value.length > 0)
            return false;
    if (f.when)
        return false;
    if (f.where)
        return false;
    if (f.who)
        return false;
    if (f.userRelation)
        return false;
    return true;
}

function clearFocus() {
    $('#FocusKeywords').val('');
    $N.setFocus({when: null, where: null});

    //userRelation = null
    $('#FocusClearButton').hide();
}

var _focusMap = null;

function renderFocus(skipSet) {
    if (!skipSet) {
        $N.setFocus($N.focus());
    }

    var fe = $('#FocusEdit');

    if (_focusMap != null)
        _focusMap.detach();

    fe.empty();

    var newFocusValue = $N.focus() || { };

    //function newObjectEdit(ix, editable, hideWidgets, onTagRemove, whenSliderChange, excludeTags, onNameChange) {

    var noe = newObjectEdit(newFocusValue, true, true, function(xx) {
        $N.setFocus(xx);
        renderFocus();
    }, function(x) {
        $N.setFocus(x);
    }, ['spacepoint'], function() {
        var keyword = $(this).val();
        later(function() {
            $N.focus().name = keyword;
            $N.setFocus($N.focus());
            //$N.trigger('change:focus');
        });
    }); //do not show spacepoint property, custom renderer is below

    if (!isFocusClear())
        $('#FocusClearButton').show();
    else
        $('#FocusClearButton').hide();

    noe.find('.tagSuggestionsWrap').remove();

    fe.append(noe);

    /*
    if ((configuration.avatarMenuTagTreeAlways) || (newFocusValue.what)) {
        var tt = newFocusTagTree(focusValue, function(tag, newStrength) {

            var tags = objTags(focusValue);
            var existingIndex = _.indexOf(tags, tag);

            if (existingIndex !== -1)
                objRemoveValue(focusValue, existingIndex);

            if (newStrength > 0) {
                objAddTag(focusValue, tag, newStrength);
            }

            renderFocus();
        });
        tt.attr('style', 'height: ' + Math.floor($(window).height() * 0.4) + 'px !important');
        fe.append(tt);
    }
    */

    if (newFocusValue.when) {
    }


    if (newFocusValue.userRelation) {
        if (newFocusValue.userRelation.itrust) {
            fe.append('Sources I Trust<br/>');
        }
        if (newFocusValue.userRelation.trustme) {
            fe.append('Sources Trusting Me<br/>');
        }
    }

	if (!$N.node)
		$N.on('change:p2p', function(node) {
			$N.trigger('change:focus');
		});

    var who = newFocusValue.who;
    if (who) {
        var w = newDiv().addClass('SourceFilter');
        var sources = _.compact($N.authors());
        sources.push(null);

		//peers
		/*
		var peers = $N.get('p2p');
		if (peers) {
			_.each(peers, function(v, k) {
				sources.push('^' + k);
			});
		}
		*/

        sources.forEach(function(s) {
            if (s === null)
                s = 'Anonymous';

            var cb = $('<input type="checkbox" disabled/>')
				.change(function() {
					var checked = cb.is(':checked');
					if (checked)
						newFocusValue.who[s] = 1;
					else
						delete newFocusValue.who[s];

					$N.setFocus(newFocusValue);
					return false;
				});


			var label = $N.label(s);
			var sublabel = null;

			var sourceDiv = newDiv().html(label).appendTo(w)
					.addClass('Source')
					.click(function() {
						cb.attr('disabled', null);
						cb.click();
						return false;
					});
			var buttons = newDiv().appendTo(sourceDiv).addClass('buttons');

			if (s[0] == '^') {
				sublabel = 'Network';
			}
			else if (s[0] == '!') {
				sublabel = 'Channel';
				var c = newEle('button').html('&gt;').attr('title', 'Talk').click(function() {
					newChannelPopup(s);
					return false;
				});
				buttons.append(c);
			}
			else {
				var S = $N.instance[s];
				if (S) {
					var tags = objTags(S);
					if (tags.indexOf('Human') !== -1) {
						sublabel = 'Human';
					}
				}
			}


			if (sublabel) {
				sourceDiv.append(newDiv().html(sublabel).addClass('sublabel'));
			}

			if (who[s]) {
                cb.attr('checked', 'true');
				sourceDiv.addClass('selected');
			}


			var icon = newAvatarImage(s);
			if (icon)
				sourceDiv.prepend(icon);
			sourceDiv.prepend(cb);
        });






        fe.append(w);
    }


    var where = objSpacePointLatLng(newFocusValue);
    if (where) {
        if (_focusMap) {
            fe.append(_focusMap);
        }
        else {
            var uu = duid();
            _focusMap = newDiv(uu).attr('style', 'height: 250px; width: 100%');	//TODO use css
            fe.append(_focusMap);
            var lmap = initLocationChooserMap(uu, where, 3);
            lmap.onClick = function(l) {
                objSetFirstValue($N.focus(), 'spacepoint', {lat: l.lat, lon: l.lng, planet: 'Earth'});
                renderFocus();
            };
            /*
             * .abs-center {
                position: absolute;
                left: 50%;
                top: 50%;
                z-index: 1;
                pointer-events: none;
                }
            <div class="abs-center" style="width: 100px; height: 100px; margin-left: -50px; margin-top: -50px; border-radius: 50px; border: solid 2px #d015b3;"> </div>
            <div class="abs-center" style="width: 200px; height: 200px; margin-left: -100px; margin-top: -100px; border-radius: 100px; border: solid 2px #d015b3;"> </div>
      	    <div class="abs-center" style="width: 2px; height: 100%; background: #d015b3; top: 0px;"> </div>
    	    <div class="abs-center" style="width: 100%; height: 2px; background: #d015b3; left: 0px;"> </div>
            */
        }
    }
    else {
        if (_focusMap) {
            _focusMap.remove();
            _focusMap = null;
        }
    }

    /*
    var tc = newTagCloud(function(filter) {
        later(function() {
            var f = new $N.nobject();
            _.each(filter, function(v, t) {
                f.addTag(t, v);
            });
            $N.setFocus(f);
            renderFocus(true);
        });
    });
    fe.append(tc);
    */
}


function initFocusButtons() {

	var minSidebarWidthWhenToggledOn = 250; //px

	$('#FocusEditWrap').resizable({
		handles: 'e',
		resize: function(event, ui ) {
			$('#FocusEditWrap').css('right', 'auto');
			$('#FocusEditWrap').css('left', '0');
		}
	});


    $('#FocusEditToggleButton').click(function() {
        if ($('#FocusEditWrap').is(':visible')) {
            $('#FocusEditWrap').hide(); //fadeOut();
			reflowView();
        }
        else {
			$('#FocusEditWrap').css('width', $('#FocusEditWrap').css('width'));
			$('#FocusEditWrap').css('width', Math.max($('#FocusEditWrap').width(), minSidebarWidthWhenToggledOn));
			$('#FocusEditWrap').fadeIn();
			reflowView();
        }
    });
	if (configuration.focusEditDisplayStartup) {
		$('#FocusEditToggleButton').click();
	}



    $('#FocusClearButton').click(function() {
        clearFocus();
        renderFocus();
    });

    /*
    $('#FocusWhatButton').click(function() {
        newFocusValue.what = !newFocusValue.what;
        renderFocus();
    });
    */

    $('#FocusWhenButton').click(function() {
        if (!objFirstValue($N.focus(), 'timerange')) {
            objAddValue($N.focus(), {id: 'timerange', value: {
                from: Date.now() - (1000 * 24 * 60 * 60),
                to: Date.now(),
                slider: function(f, t) {
                    $N.focus().when = [f, t];
                    renderFocus();
                }
            }});
            renderFocus();
        }
        else {
            objRemoveTag($N.focus(), 'timerange');
            delete $N.focus.when;
            renderFocus();
        }
    });

    //TODO ABSTRACT this into a pluggable focus template system

	var tagger = null;
    $('#FocusWhatButton').click(function() {
        var ft = $('#FocusTagger');

        function hide() { $('#FocusTaggerPanel').hide(); }

        if (ft.is(':visible')) {
            hide();
        }
        else {
			$('#FocusTaggerPanel').show();

            var taggerOptions = {
                headerTarget: $('#FocusTaggerMenu'),
				cancelButton: false,
                addImmediately: function(t) {
                    objAddTag($N.focus(), t);
                    renderFocus();
                }
            };
			if (tagger == null) {
				later(function() {
					tagger = newTagger(taggerOptions, function(x) {
						hide();
					});
					ft.html(tagger);
				});
			}


        }

    });

    $('#FocusWhereButton').click(function() {
        if (!objSpacePointLatLng($N.focus())) {
            /*focusValue.where = _.clone(objSpacePoint($N.myself()) ||
             {lat: configuration.mapDefaultLocation[0] , lon: configuration.mapDefaultLocation[0], planet: 'Earth'});*/
            objSetFirstValue($N.focus(), 'spacepoint', {lat: configuration.mapDefaultLocation[0], lon: configuration.mapDefaultLocation[1], planet: 'Earth'});
            renderFocus();
        }
        else {
			var tags = objTags($N.focus(), true);
			var spi = _.indexOf(tags, 'spacepoint');
			if (spi != -1)
				objRemoveValue($N.focus(), spi);
			renderFocus();
        }
    });

    $('#FocusWhoButton').click(function() {
       if (!$N.focus().who) {
            $N.focus().who = {};
            renderFocus();
       }
       else {
           delete $N.focus().who;
           renderFocus();
       }
    });

    $('#FocusHowButton').click(function() {
		if ($N.focus().name) {
			delete $N.focus().name;
		}
		else {
			$N.focus().name = true;
		}
		renderFocus();
    });

}

function newFocusTagTree(currentFocus, onTagChanged) {
    var e = newDiv('FocusTagTree');

    //$('.TagChoice').remove();
    var prefix = 'FTT_';

    var p = {
        target: e,
        newTagDiv: function(id, content) {
            var ti = getTagIcon(id);
            if (ti)
                content = '<img style="height: 1em" src="' + ti + '"/>' + content;
            return {
                label: ('<input id="' + prefix + id + '" type="checkbox" class="FTT_TagChoice"/>' + content)
            };
        },
        onCreated: function() {
            e.find('.FTT_TagChoice').each(function(x) {
                var t = $(this);
                t.change(function() {

                    var tag = t.attr('id').substring(prefix.length);
                    if (t.is(':checked')) {



                        function strength(v) {
                            later(function() {
                                if (onTagChanged)
                                    onTagChanged(tag, v);
                            });
                        }

                        strength(1.0);
                        /*

                         var sd = $('<span/>').addClass('tagButtons').addClass('tagButtonsLeft').appendTo(t.parent());
                         //2 placeholders to match the CSS nth child
                         $('<button style="display: none"></button>').appendTo(sd);
                         $('<button style="display: none"></button>').appendTo(sd);
                         var p25Button =  $('<button title="25%">&nbsp;</button>').appendTo(sd).click(function() {  strength(0.25); });
                         var p50Button =  $('<button title="50%">&nbsp;</button>').appendTo(sd).click(function() {  strength(0.5); });
                         var p75Button =  $('<button title="75%">&nbsp;</button>').appendTo(sd).click(function() {  strength(0.75); });
                         var p100Button = $('<button title="100%">&nbsp;</button>').appendTo(sd).click(function() {  strength(1.0); });

                         p100Button.addClass('tagButtonSelected');

                         var bb = [p25Button, p50Button, p75Button, p100Button];
                         _.each(bb, function(b) {
                         b.click(function() {
                         _.each(bb, function(c) { c.removeClass('tagButtonSelected'); });
                         b.addClass('tagButtonSelected');

                         });
                         });*/
                    }
                    else {
                        t.parent().find('span').remove();
                        if (onTagChanged)
                            onTagChanged(tag, 0);
                    }

                    //onTagAdded();
                });
            });
        }
    };
    newTagTree(p);

    return e;

}

//DEPRECATED
function newLayersWidget() {
    var target = newDiv();

    //var isGeographic = $('#GeographicToggle').is(':checked');
    //updateLayers();

    var l = $N.layer();
    if (!l.include)
        l.include = {};
    if (!l.exclude)
        l.exclude = {};
    if (!l.kml)
        l.kml = [];

    var p = {
        'target': target,
        addToTree: function(T) {
            function kmlsubtree(root) {
                var kmlFolder = {
                    label: 'Map Layer',
                    children: []
                };

                function addKML(label, url) {
                    kmlFolder.children.push({
                        label: ('<span url="' + url + '" class="KMLLayer">' + label + '</span>')
                    });
                }
                addKML('HAARP', '/kml/haarp.kml');
                addKML('HPM', '/kml/hpm-radars.kml');
                addKML('NUKE', '/kml/nuke-explosions.kml');

                root.push(kmlFolder);
            }
            function externalsubtree(root) {
                var extFolder = {
                    label: 'External Link',
                    children: []
                };
                var t = [
                    {
                        label: 'Global Alerts',
                        children: [
                            {
                                label: 'ClimateViewer 3D',
                                url: 'http://climateviewer.com/3D/'
                            },
                            {
                                label: 'RSOE EDIS',
                                url: 'http://hisz.rsoe.hu/alertmap/index2.php'
                            }
                        ]
                    }
                ];
                root.push(extFolder);
            }

            kmlsubtree(T);
            externalsubtree(T);

        },
        newTagDiv: function(id, content) {
            var ti = getTagIcon(id);
            if (ti)
                content = '<img style="height: 1em" src="' + ti + '"/>' + content;
            return {
                label: ('<span id="' + id + '" class="TagLayer">' + content + '</span>')
            };
        }
    };
    newTagTree(p);

    function commitLayer() {
        $N.save('layer', l);
        updateLayers();
    }

    if (_.size(l.include) > 0) {
        $('.TagLayer').addClass('TagLayerFaded');
    }

    $('.TagLayer').each(function(x) {
        var t = $(this);
        var id = t.attr('id');
        var included = l.include[id];
        var excluded = l.exclude[id];

        if (included) {
            t.addClass('TagLayerInclude');
        }
        else if (excluded) {
            t.addClass('TagLayerExclude');
        }

        t.click(function() {
            later(function() {
                if ((!included) && (!excluded)) {
                    //make included
                    l.include[id] = true;
                    delete l.exclude[id];
                    commitLayer();
                }
                else if (included) {
                    //make excluded
                    delete l.include[id];
                    l.exclude[id] = true;
                    commitLayer();
                }
                else {
                    //make neither
                    delete l.include[id];
                    delete l.exclude[id];
                    commitLayer();
                }
            });
        });
    });
    $('.KMLLayer').each(function(x) {
        var t = $(this);
        var url = t.attr('url');

        var included = _.contains(l.kml, url);
        if (included) {
            t.addClass('TagLayerInclude');
        }
        t.click(function() {
            if (included) {
                //uninclude
                l.kml = _.without(l.kml, url);
                commitLayer();
            }
            else {
                //include
                l.kml.push(url);
                commitLayer();
            }
        });
    });

//    a.delegate("a", "click", function(e) {
//        /*if ($(e.currentTarget).blur().attr('href').match('^#$')) {
//            $("#layer-tree").jstree("open_node", this);
//            return false;
//        } else {
//            var embedLocation = (this).href;
//            $('#View').empty();
//            $('#View').html('<iframe src="' + embedLocation + '" frameBorder="0" id="embed-frame"></iframe>');
//            $("#View").removeClass("ui-widget-content");
//            var vm = $('#MainMenu');
//            var shown = vm.is(':visible');
//            showAvatarMenu(!shown);
//            e.preventDefault();
//            return false;
//        }*/
//    });


    /*
     //update display of type counts and other type metadata
     function updateTypeCounts() {
     for (var t in stc) {
     $('a:contains("' + t + '")').append(' '+ stc[t]);
     }
     }
     */

}

function newTagCloud(onChanged) {
    var tagcloud = newDiv().addClass('FocusTagCloud');
    var browseTagFilters = {};

    var f = $N.focus();
    var ft = objTagStrength(f, false);
    _.each(ft, function(v, t) {
      browseTagFilters[t] = v;
    });


    function updateTagCloud() {
        var tagcount = $N.getTagCount();
        //TODO noramlize to 1.0
        var counts = _.values(tagcount);
        var minc = _.min(counts);
        var maxc = _.max(counts);
        if (minc != maxc) {
            _.each(tagcount, function(v, k) {
                tagcount[k] = (v - minc) / (maxc - minc);
            });
        }

        var tags = _.keys(tagcount);
        tags.sort(function(a, b) {
           return tagcount[b] - tagcount[a];
        });

        tagcloud.empty();

        tags.forEach(function(k) {

            var t = $N.tag(k);

            var name;
            if (t !== undefined) {
                if (t.hidden) return;
                name = t.name;
            }
            else
                name = k;

            function plusone() {
                var v = browseTagFilters[k];
                if (v === -1.0) delete browseTagFilters[k];
                else if (v === undefined) browseTagFilters[k] = +1;
                onChanged(browseTagFilters);
            }
            function minusone() {
                var v = browseTagFilters[k];
                if (v === 1.0) delete browseTagFilters[k];
                else if (v === undefined) browseTagFilters[k] = -1;
                onChanged(browseTagFilters);
            }

            var ab = newTagButton(k, function() { }, false);

            ab.bind('contextmenu', function() { return false; });

            ab.mousedown(function(e) {
                var v = browseTagFilters[k];
                if (e.button === 2) {
                    if (v === -1)
                        plusone();
                    else
                        minusone();
                    e.preventDefault();  // return false; also works
                    return false;
                }
                else if (e.button === 0) {
                    if (v === 1)
                        minusone();
                    else
                        plusone();
                    return false;
                }
            });


            var ti = tagcount[k];
            ab.css('font-size', 120.0 * (0.8 + 0.2 * ti) + '%');
            //ab.css('float','left');

            ab.removeClass('tagFilterInclude tagFilterExclude');
            if (browseTagFilters[k] < 0) {
                ab.addClass('tagFilterExclude');
            }
            else if (browseTagFilters[k] > 0) {
                ab.addClass('tagFilterInclude');
            }
            else {
            }

            if (browseTagFilters[k] !== -1.0)
                var downButton = newEle('button').html('-').click(function() {
                     minusone();
                     return false;
                });
            if (browseTagFilters[k] !== 1.0)
                var upButton = newEle('button').html('+').click(function() {
                     plusone();
                     return false;
                });

            ab.prepend(downButton, upButton);
            tagcloud.append(newEle('div').append(ab));

        });

    }

    updateTagCloud();

    tagcloud.update = updateTagCloud;

    return tagcloud;
}


/*
 //KML
 {
 if ($N.layer)
 delete $N.layer().kml;

 $("#KMLLayers input").change(function() {
 var t = $(this);
 var url = t.attr('url');
 var checked = t.is(':checked');

 var l = $N.layer();

 if (!l.kml) l.kml = [];

 if (checked) {
 l.kml.push(url);
 l.kml = _.unique( l.kml );
 }
 else {
 l.kml = _.without( l.kml, url);
 }

 $N.save('layer', l);
 $N.trigger('change:layer');
 });
 }
 */
/* IFRAME EMBED */

//$("#url-tree").jstree({"plugins": ["html_data", "ui", "themeroller"]});

/*
 $("#url-tree").delegate("a", "click", function(e) {
 if ($(e.currentTarget).blur().attr('href').match('^#$')) {
 $("#url-tree").jstree("open_node", this);
 return false;
 } else {

 var embedLocation = (this).href;
 $('#View').empty();
 $('#View').html('<iframe src="' + embedLocation + '" frameBorder="0" id="embed-frame"></iframe>');
 $("#View").removeClass("ui-widget-content");
 $('#View').addClass('view-indented');

 $('#close-iframe').show();

 var vm = $('#MainMenu');

 var shown = vm.is(':visible');
 showAvatarMenu(!shown);
 e.preventDefault();
 return false;
 }
 });
 */

/*
 $('#close-iframe').click(function() {
 updateView(true);
 $('#close-iframe').hide();
 });
 */


