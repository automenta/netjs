"use strict";
function newTagValueWidget(x, index, t, editable, whenSaved, onAdd, onRemove, onChange, onStrengthChange, onOrderChange, whenSliderChange) {
	var tag = t.id || t;

    var strength = t.strength;
    if (t.readonly)
        editable = false;
    if (strength === undefined)
        t.strength = strength = 1.0;
    var T = $N.object[tag] || { id: tag, name: tag };
    var isPrim = isPrimitive(tag);
    var isProp = T._property;
    var isClass = T._class !== undefined;
	var isInstance = (!isPrim) && (!isProp) && (!isClass);


    var events = {
        onSave: whenSaved,
        onAdd: onAdd,
        onRemove: onRemove,
        onChange: onChange,
        onStrengthChange: onStrengthChange,
        onOrderChange: onOrderChange,
        onSliderChange: whenSliderChange
    };

    var e = newDiv().addClass('tagSection');
    var d = newDiv().addClass('tagSectionItem').appendTo(e);
    applyTagStrengthClass(e, strength);

	/*
    if (editable) {
        if (configuration.device !== configuration.MOBILE) {
            d.hover(function() {
                d.addClass('tagSectionHover');
            }, function() {
                d.removeClass('tagSectionHover');
            });
        }
    }
	*/

    var tagLabel = newEle('span', true);
    tagLabel.innerHTML = tag;
    tagLabel.classList.add('tagLabel');

    if (!isPrim)
        d.append(tagLabel);

    /*if (!isPrim)
        d.append(newTagButton(tag, false));*/

    if (editable) {
        d.addClass('tagSectionEditable');

        var tagButtons = newDiv().addClass('tagButtons');
        /*d.hover(function() {
         //tagButtons.fadeIn();
         }, function() {
         //tagButtons.fadeOut();
         });*/

        /*d.click(function() {
         if (!tagButtons.is(':visible')) {
         tagButtons.fadeIn();
         } else {
         tagButtons.fadeOut();
         }
         });

         tagButtons.hide();*/

        if (index > 0) {
            var upButton = $('<button title="Move Up">&utrif;</button>');
            upButton.addClass('tagButton');
            upButton.mousedown(function() {
                onOrderChange(index, index - 1);
            });
            tagButtons.append(upButton);
        }
        /*if (index <*/ {
            var downButton = $('<button title="Move Down">&dtrif;</button>');
            downButton.addClass('tagButton').addClass('moveDown');
            downButton.mousedown(function() {
                onOrderChange(index, index + 1);
            });
            tagButtons.append(downButton);
        }


        if (strength > 0) {
            var minusButton = newEle('button').html('-').appendTo(tagButtons).mousedown(function() {
                var newstrength = Math.max(0, strength - 0.25);
                if (newstrength !== strength) {
                    onStrengthChange(index, newstrength);
                }
            });
        }

        if (strength < 1.0) {
            var plusButton = newEle('button').html('+').appendTo(tagButtons).mousedown(function() {
                var newstrength = Math.min(1.0, strength + 0.25);
                if (newstrength !== strength)
                    onStrengthChange(index, newstrength);
            });
            /*var strengthAdjust = newDiv().appendTo(tagButtons)
             .attr('style','z-index:-1; position:absolute; bottom: -10px; height: 10px; background-color: black; width:100%');
             var strengthIndicator = newDiv().html('&nbsp;').appendTo(strengthAdjust)
             .attr('style','z-index:-1; position:absolute; height: 10px; background-color: white; width:' + (100.0*strength) + '%');                */
        }

        var removeButton = $('<button title="Remove">x</button>').addClass('tagButton').appendTo(tagButtons)
                .mousedown(function() {
                    if (confirm('Remove ' + tag + '?'))
                        onRemove(index);
                });

        d.append(tagButtons);

        //d.hover(function(){ tagButtons.fadeIn(200);}, function() { tagButtons.fadeOut(200);});
        //d.hover(function(){ tagButtons.show();}, function() { tagButtons.hide();});
        //tagButtons.hide();
    }


    var defaultValue = null;

    var type;
    if (isPrim) {
        //tagLabel.hide();
        type = tag;
    }
	else if (isInstance) {
		type = 'instance';
	}



    if (isProp) {
        type = T.extend;
        if (T.default) {
            defaultValue = T.default;
        }
        d.addClass('propertySection');
    }


    if (newTagValueWidget[type]) {
        newTagValueWidget[type](x, index, t, T, editable, d, events);
    } else if (tag) {
        newTagValueWidget.tag(x, index, t, T, editable, d, events);
    }

	if (!isInstance) {
		if (T.name)
			tagLabel.innerHTML = T.name;
		if (editable) {
			$('<img src="' + getTagIcon(tag) + '"/>').prependTo($(tagLabel));
			tagLabel.innerHTML += '&nbsp;';
		}
		else if (!isPrim)
			tagLabel.innerHTML += ':&nbsp;';

		//if T.name is empty, use arrow symbol
		if (T.name === '')
			tagLabel.innerHTML = '<i class="fa fa-long-arrow-right"></i>';

	}
	else {
		tagLabel.innerHTML = '';
	}


    if (t.description)
        d.append('<ul>' + t.description + '</ul>');

    return e;
}

newTagValueWidget.instance = function(x, index, v, prop, editable, d, events) {
	
	var value = prop.id;
	var V = $N.object[value] || value;

    var ii = newTagButton(V).appendTo(d);
	
    if (editable) {
        events.onSave.push(function(y) {
            objAddValue(y, value, null, v.strength);
        });
    } else {
    }
};


newTagValueWidget.boolean = function(x, index, v, prop, editable, d, events) {
    var value = v.value;
    if (value === undefined) {
        value = (prop.default!==undefined) ? prop.default : true;
    }

    var ii = $('<input type="checkbox">').appendTo(d).prop('checked', value);

    if (editable) {
        events.onSave.push(function(y) {
            objAddValue(y, prop.id, ii.is(':checked'), v.strength);
        });
    } else {
        ii.attr("disabled", "disabled");
    }
};

newTagValueWidget.markdown = function(x, index, v, prop, editable, d, events) {
    if (!editable) {
        if (v.value)
            d.append( newDiv().addClass('markdown').html(markdown.toHTML(v.value)) );
    }        
};


newTagValueWidget.tagcloud = function(x, index, v, prop, editable, d, events) {
    if (!editable) {
        if (v.value) {
            var tc = newDiv().addClass('valueTagCloud');
            var ele = [];
            for (var k in v.value) {
                var s = v.value[k];
                var fs = 100.0 * (0.5 + 0.5 * s);
                var t = newEle('span', true);
                t.innerHTML = k + ' ';
                t.style.fontSize = fs + '%';
                //tc.append(t, ' ');
                ele.push(t);
            }
            tc.append(ele);
            tc.append(newDiv().attr('style','clear:both'));
            tc.appendTo(d);
        }
    }        
};

newTagValueWidget.html = function(x, index, v, prop, editable, d, events) {
    function addReadOnly() {
        var y = newEle('div',true);
        y.classList.add('htmlview');
        y.innerHTML = v.value;
        d.append(y);
        return $(y);
    }
    
    if (!editable) {
        addReadOnly();
        /*if (x.author !== $N.id() )
            return addReadOnly();

        if (prop)
            if (prop.readonly)
                return addReadOnly();*/
    }
    else {
        var dd;
        if (prop.readonly) {
            dd = addReadOnly();
        }
        else {
            //dd = newDiv().attr('contenteditable','true').appendTo(d);
			dd = newEle('textarea').ckeditor().appendTo(d);

            if (v.value)
                dd.html(v.value);
        }

        events.onSave.push(function(y) {
            //objAddValue(y, prop.id, dd.html(), v.strength);
			objAddValue(y, prop.id, dd.val(), v.strength);
        });        
    }
    
};

var _alohaHandler = null;
function _ensureHasAloha() {
   if (!$(this).hasClass('aloha-editable-active')) {
        //TODO auto-focus the newly created editor so clicking twice isnt necessary
        Aloha.jQuery($(this)).aloha();
   }                        
}

newTagValueWidget.htmlAloha = function(x, index, v, prop, editable, d, events) {
    var wasViewLocked = false;
    
    function addReadOnly() {
        var y = newEle('div',true);
        y.classList.add('htmlview');
        y.innerHTML = v.value;
        d.append(y);
        return $(y);
    }
    
    if (!editable) {
        if (x.author !== $N.id() )
            return addReadOnly();

        if (prop)
            if (prop.readonly)
                return addReadOnly();
    }
        
    function e() {
    
        if (editable) {
            var dd;
            if (prop.readonly) {
                dd = addReadOnly();
            }
            else {
                dd = newDiv().appendTo(d);
                if (v.value)
                    dd.html(v.value);

                Aloha.jQuery(dd).aloha();
            }

            events.onSave.push(function(y) {
                objAddValue(y, prop.id, dd.html(), v.strength);
            });
        } else {
            var vvv = v.value;
            
            if (!vvv)
                if (x.author === $N.id())
                    vvv = '';
            
            if (vvv!==undefined) {
                var hv = newDiv().addClass('htmlview').html(vvv).appendTo(d);
                if (x.author === $N.id()) {
                    hv.addClass('htmleditable');
                    hv.attr('xid', x.id);
                    hv.attr('vid', index);
                    hv.click(_ensureHasAloha);                    
                }
            }
        }        
        
    }
    
    //<script src="lib/aloha/aloha-full.min.js" type="text/javascript"></script>

    if (_alohaHandler === null) {
        _alohaHandler = true;
        later(function() {
            loadCSS("lib/aloha/css/aloha.css");
            $.browser =  { msie: false };
            $LAB
                .script("/lib/aloha/require.js")
                //.script("/lib/aloha/aloha.js")
                .wait(function() {
                    define('jquery'  , function(){ return window.jQuery; })
                    define('jqueryui', function(){ return window.jQuery.ui; })                
                    $('head').append('<script type="text/javascript" src="/lib/aloha/aloha.js" data-aloha-plugins="common/ui,common/format"></script>');
                //})
                //.wait(function() {
                    $.ui.tabs.prototype.select = function() { return true; }; //patch for jquery 2.x

    /*                "common/ui,common/format,common/table,common/list"
                                            common/link,
                                            common/highlighteditables,
                                            common/block,
                                            common/undo,
                                            common/image,
                                            common/contenthandler,
                                            common/paste,
                                            common/commands,
                                            common/abbr"*/

                    Aloha.settings.predefinedModules = {
                        'jquery': window.jQuery,
                        'jqueryui': window.jQuery.ui
                    };
                    Aloha.settings.toolbar = {
                        tabs: [
                            {
                                label: 'Format',
                                components: [
                                    [ 'bold', 'italic', 'underline', '\n',
                                      'subscript', 'superscript', 'strikethrough' ],
                                    [ 'formatBlock' ]
                                ]
                            },
                            {
                                label: 'Insert',
                                exclusive: true,
                                components: [
                                    "createTable", "characterPicker", "insertLink",
                                ]
                            },
                            {
                                label: 'Link',
                                components: [ 'editlink' ]
                            }
                        ],
                        exclude: [ 'strong', 'emphasis', 'strikethrough' ]
                    };
                    Aloha.settings.plugins = {
                            format: {
                                    config : [ 'b', 'i','sub','sup'],
                                    editables : {
                                            'div'		: [ 'b', 'i', 'del', 'sub', 'sup'  ], 
                                    }
                            },
                            format2: {
                            // all elements with no specific configuration get this configuration
                            config: [  'b', 'i', 'sub', 'sup', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6' ],
                            editables: {
                                /*
                                // no formatting allowed for title
                                '#title': [],
                                // just bold and italic for the teaser
                                '#teaser': [ 'b', 'i' ] */
                            }
                        }
                    };

                    //Aloha.ready( function() {
                        e();                    

                        if (_alohaHandler === null) {
                            _alohaHandler = true;
                            _alohaHandler = Aloha.bind('aloha-editable-deactivated', function (e, a) {
                                var o = a.editable.obj[0];
                                var xid = o.getAttribute('xid');
                                var vid = o.getAttribute('vid');
                                if (xid && (vid!==undefined)) {
                                    vid = parseInt(vid);                                
                                    var O = $N.object[xid];
                                    if (O) {
                                        var V = O.value[vid];
                                        var hh = o.innerHTML;
                                        if (V.value !== hh) {
                                            V.value = hh;
                                            later(function() {
                                                $N.pub(O, null, null, true);
                                                notify('Saved.');                                            
                                            });
                                        }
                                    }                                
                                }
                                setViewLock(wasViewLocked);
                            });   
                            Aloha.bind('aloha-editable-activated', function (e, a) {
                                wasViewLocked = viewlock;
                                setViewLock(true);
                            });
                        }


                        reflowView();
                    //});
                });
            });
    }
    else {
        e();
    }
    
};

newTagValueWidget.tag = function(x, index, v, prop, editable, d, events) {
    
    var TAG = $N.class[prop.id];

    if (editable) {
        events.onSave.push(function(y) {
            objAddTag(y, prop.id, v.strength);
        });
    }
    
    if (!TAG) {
        //d.append('Unknown tag: ' + tag);            
    } else {
        /*var ti = getTagIcon(tag);
        if ($N.class[tag] !== undefined) {
            tagLabel.html(TAG.name);
        }
        if (ti)
            tagIcon.attr('src', ti);*/

        if ((!x.readonly) && (editable)) {
            /*var pb = $('<button>...</button>');
             tagLabel.append(pb);*/


            var pd = newDiv().addClass('tagSuggestions');

            var pp = TAG.property;
			var count = 0;
            _.each(pp, function(PP, ppv) {
                //TODO dont include if max present reached
                if (PP.max)
                    if (PP.max > 0) {
                        var existing = objValues(x, ppv).length;
                        if (PP.max <= existing)
                            return;
                    }

                var ppn = PP.name;
                var appv = $('<a title="' + PP.extend + '">+' + ppn + '</a>');
                var defaultValue = '';
                appv.click(function() {
                    events.onAdd(ppv, defaultValue);
                });

                pd.append(appv, '&nbsp;');
				count++;
            });
			if (count > 0) {
				pd.appendTo(newDiv().addClass('tagSuggestionsWrap well well-sm').appendTo(d));
			}
			

        }

    }
};

newTagValueWidget.text =
newTagValueWidget.url =
newTagValueWidget.real =
newTagValueWidget.integer = function(x, index, v, prop, editable, d, events) {
    var type = prop.extend;
    
    if (editable) {
        var dd = $('<input type="text" placeholder="' + type + '"/>').appendTo(d);
        if (prop.readonly) {
            dd.attr('readonly', 'readonly');
        }

        var sx = null;
        if (prop.units) {
            sx = $('<select></select>');
            _.each(prop.units, function(u) {
                sx.append('<option id="u">' + u + '</option>');
            });
            d.append(sx);
        }

        
        if (v.value) {
            if (v.value.unit) {
                //number and unit were both stored in a JSON object
                dd.val(v.value.number);
                sx.val(v.value.unit);
            } else {
                //only the number was present
                dd.val(v.value);
            }
        } else if (prop.default !== undefined) {
            dd.val(prop.default);
        }
        

        events.onSave.push(function(y) {
            if ((type == 'text') || (type == 'url')) {
                objAddValue(y, v.id, dd.val(), v.strength);
            } else if ((type == 'real') || (type == 'integer')) {
                var ddv = (type == 'real') ? parseFloat(dd.val()) : parseInt(dd.val());

                if (isNaN(ddv))
                    ddv = dd.val(); //store as string

                if (!sx)
                    objAddValue(y, prop.id, ddv, v.strength);
                else
                    objAddValue(y, prop.id, {
                        number: ddv,
                        unit: sx.val()
                    }, v.strength);
            }
        });

    } else {
        if (type === 'url') {
            if (v.value)
                d.append('<a target="_blank" href="' + v.value + '">' + v.value + '</a>');
        }
        else {
            var dd = newEle('span', true);
            if (v.value) {
                var valstring;

                if (v.value.unit) {
                    //number and unit were both stored in a JSON object
                    valstring = v.value.number + ' ' + v.value.unit;
                } else {
                    //only the number was present
                    valstring = v.value;
                }

                dd.innerHTML = (valstring);
            }
            d.append(dd);
        }
    }

};
newTagValueWidget.spacepoint = function(x, index, v, prop, editable, d, events) {

    var m;
    var ee = newDiv().appendTo(d);
    
    function showMap() {
        var dd = newDiv().addClass('focusMap').appendTo(ee);

        later(function() {
            var lat = v.value.lat || configuration.mapDefaultLocation[0];
            var lon = v.value.lon || configuration.mapDefaultLocation[1];
            var zoom = v.value.zoom;
            m = initLocationChooserMap(dd[0], [lat, lon], zoom);
        });
    }

    if (editable) {
        showMap();
        
        var cr = $('<select/>')
                .css('width', 'auto')
                .append('<option value="earth" selected>Earth</option>',
                        '<option value="moon">Moon</option>',
                        '<option value="mars">Mars</option>',
                        '<option value="venus">Venus</option>')
                .change(function() {
                    alert('Currently only Earth is supported.');
                    cr.val('earth');
                }).appendTo(ee);

        var ar = $('<input type="text" disabled="disabled" placeholder="Altitude" />')
                .css('width', '15%').appendTo(ee);

        events.onSave.push(function(y) {
            if (!m)
                return;
            if (!m.location)
                return;

            var l = m.location();
            objAddValue(y, prop.id, {
                lat: l.lat,
                lon: l.lon,
                zoom: m.zoom,
                planet: 'Earth'
            }, v.strength);
        });

    }
    else {
        d.append('Location: ');
        if (v.value) {
            var mapVisible = false;
            var sl = $(newSpaceLink(v.value)).appendTo(d).click(function() {
                if (!mapVisible) {
                    showMap();
                    reflowView();
                }
                else {
                    ee.empty();
                    reflowView();
                }
                mapVisible = !mapVisible;
            });
        }
        else {
            d.append('Unknown');
        }
    }

};

function newTimeSelect(v) {
    var dt = $('<input type="datetime-local"/>');
    var ds = v ? new Date(v) : new Date();
    ds = ds.toISOString().split('.')[0];        
    dt.attr('value', ds );
    dt.getTime = function() {
        return new Date(dt.val()).getTime();
    };
    return dt;
}

newTagValueWidget.timepoint = function(x, index, v, prop, editable, d, events) {
    if ((editable) && (!prop.readonly)) {
                
        var dt = newTimeSelect(v.value);
        dt.appendTo(d);

        events.onSave.push(function(y) {
            objAddValue(y, v.id, dt.getTime(), v.strength);                
        });   

        if (v.id === 'timepoint') {
            var tr = $('<button title="Until...">&rarrtl;</button>').appendTo(d);
            tr.click(function() {
                events.onChange(index, { id: 'timerange', value: { 
                    from: dt.getTime(), to: null
                } } );
            });
        }

    } else {
        d.append(newEle('a').append($.timeago(new Date(v.value))));
    }
};

newTagValueWidget.timerange = function(x, index, v, prop, editable, d, events) {
    if ((editable) && (!prop.readonly)) {
                
        if (!v.value)
            v.value = { from: Date.now(), to: Date.now() };
        
        var dt = newTimeSelect(v.value.from);
        dt.appendTo(d);

        var du = newTimeSelect(v.value.to);


        var slider = v.value.slider;
        
        if ((v.id === 'timerange') && (!slider)) {
            var tr = $('<button title="Point in time...">&larrtl;</button>').appendTo(d);
            tr.click(function() {
                events.onChange(index, { id: 'timepoint', value: dt.getTime() } );
            });
        }
        
        d.append('<br/>', du);
        
        if (slider) {
            var s = newDiv().attr('style', 'float: left; max-width: 48%');
            var fromSlide = $('<input type="range" value="0" min="0" max="100"/>').appendTo(s);
            s.append('<br/>');
            var toSlide = $('<input type="range" value="100" min="0" max="100"/>').appendTo(s);            
            s.append('<br/>');
            
            
            if (v.value.p) {
                fromSlide.val(v.value.p[0]);
                toSlide.val(v.value.p[1]);
            }
            
            var fd, td;
            
            var o = newDiv();
            
            var update = function() {
                var f = parseFloat(fromSlide.val())/100.0;
                var t = parseFloat(toSlide.val())/100.0;
                
                var ft = parseFloat(dt.getTime());
                var tt = parseFloat(du.getTime());
                
                fd = parseInt( ft + f * (tt-ft) );
                td = parseInt( ft + t * (tt-ft) );
                
                o.html(new Date(fd).toLocaleString() + ' .. ' + new Date(td).toLocaleString());
            }
            
            update();
            
            var slideChanged = function() {
                update();
                
                var pf = v.value.s ? v.value.s[0] : undefined;
                var pt = v.value.s ? v.value.s[1] : undefined;
                
                v.value.from = dt.getTime();
                v.value.to = du.getTime();
                v.value.p = [fromSlide.val(), toSlide.val()];
                v.value.s = [fd,td];
                
                if ((pf === fd) && (pt === td))
                    return;
                slider(fd, td);
            }

            fromSlide.change(slideChanged);
            toSlide.change(slideChanged);
            
            var t = newDiv().attr('style', 'float: left; max-width: 20%');
            var leftButton = $('<button>&lt;</button>').appendTo(t);
            var rightButton = $('<button>&gt;</button>').appendTo(t);
            
            leftButton.mousedown(function() {
                fromSlide.val( parseInt(fromSlide.val()) - 2);
                toSlide.val( parseInt(toSlide.val()) - 2);
                slideChanged();                    
            });
            rightButton.mousedown(function() {
                fromSlide.val( parseInt(fromSlide.val()) + 2);
                toSlide.val( parseInt(toSlide.val()) + 2);                
                slideChanged();
            });

            d.append(s, t, o);
            
            events.onSave.push(function(y) {
                update();
                objAddValue(y, v.id, { from: dt.getTime(), to: du.getTime(), slider: slider, s: [fd,td], p: [fromSlide.val(), toSlide.val()]  }, v.strength);                
            });   

        }        
        else {
            events.onSave.push(function(y) {
                objAddValue(y, v.id, { from: dt.getTime(), to: du.getTime() }, v.strength);                
            });   
        }

    } else {
        if (v.value)
            d.append(newEle('a').append(new Date(v.value.from) + ' to ' + new Date(v.value.to) ));
    }
};


newTagValueWidget.timerangeOLD = function(x, index, t, prop, editable, d, events) {
    var nn = Date.now();
    var oldest = nn - 5 * 24 * 60 * 60 * 1000; //TODO make this configurable

    if (editable) {

        var i = $('<input type="range" name="timecenter" min="1" max="10000">').appendTo(d);

        if (t.value)
            if ((t.value.start) && (t.value.end)) {
                var tm = ((0.5 * (t.value.start + t.value.end)) - oldest) / (nn - oldest) * 10000;
                i.attr('value', parseInt(tm));
            }

        var j = $('<span id="timecenter"/>').appendTo(d)
                    .append('Past', i, 'Now');

        var lb = $('<input type="checkbox">Latest</input>').appendTo(d);

        var s = $('<select>').appendTo(d)
                    .append('<option value="1">5 mins</option>',
                            '<option value="2">15 mins</option>',
                            '<option value="3" selected>1 hour</option>',
                            '<option value="4">6 hours</option>',
                            '<option value="5">1 day</option>',
                            '<option value="6">1 week</option>',
                            '<option value="7">1 month</option>');

        var start = -1, end = -1;

        d.append('<br/>');

        var output = $('<span/>').appendTo(d);

        var update = _.throttle(function() {
            var rangeSec = 0;

            var range = s.val();
            if (range === '1')
                rangeSec = 5 * 60;
            if (range === '2')
                rangeSec = 15 * 60;
            if (range === '3')
                rangeSec = 60 * 60;
            if (range === '4')
                rangeSec = 6 * 60 * 60;
            if (range === '5')
                rangeSec = 24 * 60 * 60;
            if (range === '6')
                rangeSec = 7 * 24 * 60 * 60;
            if (range === '7')
                rangeSec = 30 * 24 * 60 * 60;

            start = end = 0;


            if (lb.is(':checked')) {
                start = new Date(nn - rangeSec * 1000);
                end = new Date(nn);
                j.hide();
            } else {
                j.show();
                var iv = i.val();
                var p = parseFloat(i.val()) / 10000.0;
                var current = oldest + p * (nn - oldest);
                start = current - (rangeSec * 1000.0) / 2.0;
                end = current + (rangeSec * 1000.0) / 2.0;
                //console.log(oldest, newest, current, from, to);
            }


            output.html(new Date(start) + '<br/>' + new Date(end));
            /*
            onStrengthChange(tag);
            if (whenSliderChange)
                whenSliderChange(x);
            */
        }, 500);

        var uup = function() {
            later(function() {
                update();
            });
        };

        i.change(uup);
        lb.change(uup);
        s.change(uup);

        update();

        //TODO add calendar buttons

        events.onSave.push(function(y) {
            objAddValue(y, prop.id, {
                'from': end,
                'to': start
            }, t.strength);
        });
    } else {
        if (t.value)
            d.append(new Date(t.value.start) + ' ' + new Date(t.value.end));
    }
};


newTagValueWidget.image = function(x, index, v, prop, editable, d, events) {
    if (editable) {
        events.onSave.push(function(y) {
            objAddValue(y, v.id, v.value, v.strength);
        });
    }
    var url = v.value;
    d.append('<img class="objectViewImg" src="' + url + '"/>');
};

newTagValueWidget.sketch = function(x, index, v, prop, editable, d, events) {
    var eu = duid();
    var ee = newDiv(eu).appendTo(d);

    var options = {
        width: 250,
        height: 250,
        editing: editable
    };
    if (v.value) {
        options.strokes = JSON.parse(v.value);
    }
    
    var sketchpad;
    
    later(function() {
        sketchpad = Raphael.sketchpad(eu, options);        
    });
    if (editable) {
        events.onSave.push(function(y) {
            objAddValue(y, "sketch", sketchpad ? sketchpad.json() : { }, v.strength);
        });
    }
    else {
        //
    }
};
        
function _objectLinkClick() { newPopupObjectView($(this).data('target')); return false; }

newTagValueWidget.object = function(x, index, t, prop, editable, d, events) {

    if (editable) {
        var tt = $('<span></span>');
        var ts = $('<input></input>').css('margin-right', '0').attr('readonly', 'readonly').appendTo(tt);
        
        var value = t.value;

        var updateTS = function(x) {
            var X = $N.object[x] || {
                name: x
            };
            if (X.name != x)
                ts.val(X.name + ' (' + x + ')');
            else
                ts.val(X.name);
            ts.result = x;
        }
        if (value)
            updateTS(value);


        //http://jqueryui.com/autocomplete/#default
        //http://jqueryui.com/autocomplete/#categories

        //            //TODO filter by tag specified by ontology property metadata
        //            var data = [];
        //            for (var k in $N.objects()) {
        //                var v = $N.object(k);
        //                if (value == k) {
        //                    ts.val(v.name);
        //                    ts.result = value;
        //                }
        //
        //                data.push({
        //                    value: k,
        //                    label: v.name
        //                });
        //            }
        //            ts.autocomplete({
        //                source: data,
        //                select: function(event, ui) {
        //                    ts.result = ui.item.value;
        //                    ts.val(ui.item.label);
        //                    /*
        //                     $( "#project" ).val( ui.item.label );
        //                     $( "#project-id" ).val( ui.item.value );
        //                     $( "#project-description" ).html( ui.item.desc );
        //                     $( "#project-icon" ).attr( "src", "images/" + ui.item.icon );
        //                     */
        //
        //                    return false;
        //                }
        //            });

        

        if (!prop.readonly) {

            var tagRestrictions = prop.tag;
            if (tagRestrictions) {
                if (typeof tagRestrictions === "string")
                    tagRestrictions = [tagRestrictions];

                if (tagRestrictions.indexOf('Object')===-1)
                    tagRestrictions.push('Object');
            }
            
            ts.attr('placeholder', tagRestrictions ? tagRestrictions.join(' or ') : '');

            var mb = $('<button>...</button>').attr('title', "Find Object")
                    .css('margin-left', '0').appendTo(tt)
                    .click(function() {
                        var pp = newPopup("Select Object", true, true);
                        var tagger = newTagger(null, function(tags) {
                            ts.result = tags = tags[0];

                            updateTS(tags);

                            pp.dialog('close');
                        }, tagRestrictions, 1);
                        pp.append(tagger);
                    });

            ts.click(function() {
                if (ts.val() === '')
                    mb.click();
            });

            if (tagRestrictions) {
                var tnames = [];
                tagRestrictions.forEach(function(tr) {
                    var T = $N.class[tr];
                    if (T)
                        tnames.push(T.name);
                });
                $('<button title="Create ' + tnames.join(' or ') + '" disabled class="createSubObjectButton">+</button>').appendTo(tt);
            }
        }

        d.append(tt);

        events.onSave.push(function(y) {
            objAddValue(y, prop.id, ts.result || ts.val(), t.strength);
        });
    }
    else {
        if (t.value) {
			d.append(newTagButton(t.value));
        }
    }
};


newTagValueWidget.chat = function(x, index, t, prop, editable, d, events) {    
    if (!t.value) return;

    var channel = t.value.channel || 'main';
    
    var c = newChatWidget(function onSend(m) {
        $N.channelSend(channel, {a: $N.id(), w: Date.now(), m:m} );
    }, {
       localEcho: false
    });
    
    $N.on('channel:'+channel, function(m) {
       if (c.closest(document.documentElement).length === 0) {
           $N.off('channel:'+channel, this);
           c.remove();
       }
       
       c.receive(m);
       
       if (m.a!==$N.id()) {
           notify({title: $N.label(m.a), text: m.m });
       }
    });

    d.append(c);
};

newTagValueWidget.timeseries = function(x, index, v, prop, editable, d, events) {
    d.append('<textarea>' + JSON.stringify(vv.value) + '</textarea>');
};

newTagValueWidget.cortexit = function(x, index, v, prop, editable, d, events) {
    //TODO
};
