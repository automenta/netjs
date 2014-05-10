/* version 1.1 5-26-2013 */
var ONTO_SEARCH_PERIOD_MS = 1500; //TODO move this to client.js

//t is either a tag ID, or an object with zero or more tags
function getTagIcon(t) {
    if (!t)
        return defaultIcons.unknown;

    if (t.id) {
        //try all the tags, return the first
        if (t.value) {
            for (var x = 0; x < t.value.length; x++) {
                if (isPrimitive(t.value[x].id))
                    continue;
                var r = getTagIcon(t.value[x].id);
                if (r)
                    return r;
            }
        }
        return null;
    } else {
        return defaultIcons[t];
    }
}


function newPopupObjectEdit(n, p) {
    var e = newObjectEdit(n, true);
    newPopup('Edit', p).append(e);
    return e;
}

function newPopupObjectView(_x, p) {
    var x;
    if (typeof (_x) == "string")
        x = $N.getObject(_x);
    else
        x = _x;

    if (!x) {
        console.log('Unknown object: ' + _x);
        return;
    }

    var d = newPopup(x.name, p);
    var s = newObjectSummary(x, {
        depthRemaining: 4
    });
    s.css('border', 'none');
    d.append(s);
    return d;

}

function newPopupObjectViews(objectIDs) {
    if (objectIDs.length === 0)
        return;
    if (objectIDs.length === 1)
        return newPopupObjectView(objectIDs[0]);

    var objects = objectIDs.map(function (i) {
        if (typeof i == "string")
            return $N.getObject(i);
        else
            return i;
    });

    var d = newPopup(objects.length + " Objects");
    _.each(objects, function (o) {
        if (o) {
            d.append(newObjectSummary(o, {
                depthRemaining: 0
            }));
        }
    });
    return d;

}


function newAvatarImage(s) {
    return $(newEle('img')).attr("src", getAvatarURL(s)).attr('title', s.name);
}

function getAvatarURL(s, style) {
    if (!style) style = 'retro';
    /*
    Gravatar Styles
        404: do not load any image if none is associated with the email hash, instead return an HTTP 404 (File Not Found) response
        mm: (mystery-man) a simple, cartoon-style silhouetted outline of a person (does not vary by email hash)
        identicon: a geometric pattern based on an email hash
        monsterid: a generated 'monster' with different colors, faces, etc
        wavatar: generated faces with differing features and backgrounds
        retro: awesome generated, 8-bit arcade-style pixelated faces
        blank: a transparent PNG image (border added to HTML below for demonstration purposes)    
    */
    
    if (s) {
        var e = objFirstValue(s, 'email');
        var emailHash = e ? MD5(e) : MD5(s.id);
        return "http://www.gravatar.com/avatar/" + emailHash + '?d=' + style;
    }
    return configuration.defaultAvatarIcon;
}

///temporary solution
function tagObject(tag) {
    var o = objNew();
    o.name = tag.name;
    o = objAddDescription(o, tag.uri + ' [tag]');
    return o;
}

function _onTagButtonClicked() {
    var ti = $(this).attr('taguri');
    var t = $N.getTag(ti);
    if (t)
        newPopupObjectView(tagObject(t));
}

function newTagButton(t, onClicked, isButton) {
    var ti = null;

    if (!t.uri) {
        var to = $N.getTag(t);
        if (to)
            t = to;
    }
    if (t.uri) {
        ti = getTagIcon(t.uri);
    }
    if (!ti)
        ti = getTagIcon(null);
    
    var i = null;
    if (ti) {
        i = newEle('img').attr({
            'src': ti,
            'class': 'TagButtonIcon'
        });
    }

    var b = isButton ? $(newEle('button')) : $(newEle('a')).attr('href', '#');

    if (i)
        b.append(i);

    if (t.name)
        b.append(t.name);
    else
        b.append(t);


    if (!onClicked)
        onClicked = _onTagButtonClicked;
        /*onClicked = function () {
            newPopupObjectView(tagObject(t));
        };*/
    
    b.t = t;
    if (t)
        b.attr('taguri', t.uri || (t+'') );
    b.click(onClicked);

    return b;
}

function newReplyWidget(onReply, onCancel) {
    var w = newDiv();
    w.addClass('ReplyWidget');

    var ta = $('<textarea/>');
    w.append(ta);

    var bw = $('<div style="text-align: left"></div>');
    w.append(bw);

    var c = $('<button>Cancel</button>');
    c.click(function () {
        var ok;
        if (ta.val().length > 0) {
            ok = confirm('Cancel this reply?');
        } else {
            ok = true;
        }

        if (ok)
            onCancel();
    });
    bw.append(c);

    var b = $('<button>Reply</button>');
    b.click(function () {
        if (ta.val().length > 0) {
            onReply(ta.val());
        }
    });
    bw.append(b);

    return w;
}

function pidToProperty (pid) {
    return $N.getProperty(pid);
}

function getTagProperties(t) {
    var TT = $N.tags[t];
    if (!TT)
        return [];
    if (!TT.properties)
        return [];
    return TT.properties;
}


/**
 *  focus - a function that returns the current focus
 *  commitFocus - a function that takes as parameter the next focus to save
 */
function newObjectEdit(ix, editable, hideWidgets, onTagRemove, whenSliderChange, excludeTags) {
    var d = newDiv();
    var headerTagButtons = ix.tagSuggestions || [];

    function update(x) {
        var whenSaved = [];
        var nameInput = null;

        function getEditedFocus() {
            if (!editable)
                return x;

            var na = nameInput ? nameInput.val() : "";

            var n = objNew(x.id, na);
            n.createdAt = x.createdAt;
            n.author = x.author;

            if (x.subject)
                n.subject = x.subject;
            if (x.when)
                n.when = x.when;
            n.scope = x.scope || configuration.defaultScope;

            //TODO copy any other metadata

            for (var i = 0; i < whenSaved.length; i++) {
                var w = whenSaved[i];
                w(n);
            }
            return n;
        }

        var onAdd = function (tag, value) {
            update(objAddValue(getEditedFocus(), tag, value));
        };
        var onRemove = function (i) {
            var rr = objRemoveValue(getEditedFocus(), i);
            if (onTagRemove)
                onTagRemove(rr);
            update(rr);
        };
        var onStrengthChange = function (i, newStrength) {
            if (x.readonly)
                return;
            var y = getEditedFocus();
            if (!y.value)
                y.value = [];

            if (!y.value[i])
                y.value[i] = {};
            y.value[i].strength = newStrength;
            if (whenSliderChange)
                whenSliderChange(y);
            update(y);
        };
        var onOrderChange = function (fromIndex, toIndex) {
            if (x.readonly)
                return;
            //http://stackoverflow.com/questions/5306680/move-an-array-element-from-one-array-position-to-another
            var y = getEditedFocus();
            y.value.splice(toIndex, 0, y.value.splice(fromIndex, 1)[0]);
            update(y);
        };


        d.empty();



        if (editable) {
            if (hideWidgets !== true) {
                nameInput = $('<input/>').attr('type', 'text').attr('x-webkit-speech', 'x-webkit-speech').addClass('nameInput').addClass('nameInputWide');
                nameInput.val(objName(x));
                d.append(nameInput);

                whenSaved.push(function (y) {
                    objName(y, nameInput.val());
                });
            }
        } else {
            d.append('<h1>' + objName(x) + '</h1>');
        }
        //d.append($('<span>' + x.id + '</span>').addClass('idLabel'));

        var header = newDiv().appendTo(d);

        _.each(headerTagButtons, function (T) {
            if (T == '\n') {
                header.append('<br/>');
            } else {
                newTagButton(T, function () {
                    var y = d.getEditedFocus();
                    objAddTag(y, T);
                    update(y);
                }, true).appendTo(header);
            }
        });

        var tsw = $('<div class="tagSuggestionsWrap"></div>').appendTo(d);
        var ts = $('<div/>').addClass('tagSuggestions').appendTo(tsw);

        if (x.value) {
            var tags = []; //tags & properties, actually



            for (var i = 0; i < x.value.length; i++) {
                var t = x.value[i];

                if (excludeTags)
                    if (_.contains(excludeTags, t.id))
                        continue;

                tags.push(t.id);
                var tt = newTagSection(x, i, t, editable, whenSaved, onAdd, onRemove, onStrengthChange, onOrderChange, whenSliderChange);
                d.append(tt);
            }

            var missingProp = [];
            //Add missing required properties, min: >=1 (with their default values) of known objects:



            for (var i = 0; i < tags.length; i++) {
                var t = tags[i];
                t = $N.getTag(t);
                if (!t)
                    continue;

                var prop = t.properties;
                if (!prop)
                    continue;
                var propVal = _.map(prop, pidToProperty);

                if (!x.readonly) {
                    for (var j = 0; j < prop.length; j++) {
                        if (propVal[j].min)
                            if (propVal[j].min > 0)
                                if (!_.contains(tags, prop[j]))
                                    missingProp.push(prop[j]);
                    }
                }
            }

            for (var i = 0; i < missingProp.length; i++) {
                var p = missingProp[i];
                d.append(newTagSection(x, i + x.value.length, {
                    id: p
                }, editable, whenSaved, onAdd, onRemove, onStrengthChange, onOrderChange, whenSliderChange));
            }
        }


        var ontoSearcher;

        var lastValue = null;
        var ontocache = {};

        function search() {
            if (!tsw.is(':visible')) {
                //clearInterval(ontoSearcher);
                return;
            }
            if (!d.is(':visible')) {
                clearInterval(ontoSearcher);
                return;
            }
            
            var v = nameInput.val();

            if (v.length === 0)
                return;
            
            if (lastValue != v) {
                updateTagSuggestions(v, ts, onAdd, getEditedFocus, ontocache);
                lastValue = v;
            }
        }

        if (objHasTag(getEditedFocus(), 'Tag')) {
            //skip suggestions when editing a Tag
            ts.empty();
        } else {
            if (!x.readonly) {
                if (hideWidgets !== true) {
                    if (editable)
                        ontoSearcher = setInterval(search, ONTO_SEARCH_PERIOD_MS);
                }
            }
        }

        d.getEditedFocus = getEditedFocus;


        d.addClass('ObjectEditDiv');

        if ((hideWidgets !== true) && (!x.readonly)) {
            var addButtonWrap = newDiv().addClass('tagSection').css('text-align', 'right');

            var addButtons = newEle('span').appendTo(addButtonWrap);

            if (configuration.device == configuration.DESKTOP) {
                var addDisplay = $('<button>+</button>').prependTo(addButtonWrap);
                addDisplay.hover(function () {
                    if (!addButtons.is(':visible')) {
                        addButtons.fadeIn();
                        addDisplay.text('-');
                    }
                });
                addDisplay.click(function () {
                    if (addButtons.is(':visible')) {
                        addButtons.fadeOut();
                        addDisplay.text('+');
                    } else {
                        addButtons.fadeIn();
                        addDisplay.text('-');
                    }
                });
                addButtons.hide();
            }

            var whatButton = $('<button title="What?"><img src="/icon/rrze/emblems/information.png"></button>').click(function () {
                var p = newPopup('Select Tags for ' + nameInput.val(), true, true);
                p.append(newTagger([], function (t) {
                    var y = getEditedFocus();
                    for (var i = 0; i < t.length; i++) {
                        var T = $N.getTag(t[i]);
                        if ((T) && (T.reserved)) {
                            $.pnotify('Tag "' + T.name + '" can not be added to objects.');
                        } else
                            objAddTag(y, t[i]);
                    }
                    update(y);
                    p.dialog('close');
                }));
            });

            var howButton = $('<button title="How/Why?" id="AddDescriptionButton"><img src="/icon/rrze/actions/quote.png"></button>').click(function () {
                update(objAddValue(getEditedFocus(), 'textarea', ''));
            });

            var whenButton = $('<button disabled title="When?" id="AddWhenButton" ><img src="/icon/clock.png"></button>');

            var whereButton = $('<button title="Where?"><img src="/icon/rrze/emblems/globe.png"></button>').click(function () {
                update(objAddValue(getEditedFocus(), 'spacepoint', ''));
            });

            var whoButton = $('<button disabled title="Who?" id="AddWhoButton"><img src="/icon/rrze/categories/user-group.png"></button>');

            var drawButton = $('<button title="Draw"><img src="/icon/rrze/emblems/pen.png"/></button>').click(function () {
                update(objAddValue(getEditedFocus(), 'sketch', ''));
            });


            var webcamButton = $('<button title="Webcam"><img src="/icon/play.png"/></button>').click(function () {
                newWebcamWindow(function (imgURL) {
                    update(objAddValue(getEditedFocus(), 'media', imgURL));
                });
            });

            var uploadButton = $('<button title="Upload"><img src="/icon/rrze/actions/dial-in.png"/></button>').click(function () {

                var y = newDiv();
                var fuf = y.append('<form id="FocusUploadForm" action="/upload" method="post" enctype="multipart/form-data"><div>File:<input type="file" name="uploadfile" /><input type="submit" value="Upload" /></div></form>');
                y.append('<div class="FocusUploadProgress"><div class="FocusUploadBar"></div><div class="FocusUploadPercent">0%</div></div>');
                y.append('<div id="FocusUploadStatus"></div>');
                var okButton = $('<button class="btn">OK</button>');
                y.append(okButton);


                var x = newPopup('Upload', {
                    modal: true
                });
                x.append(y);

                okButton.click(function () {
                    x.dialog('close');
                });

                var bar = $('.FocusUploadBar');
                var percent = $('.FocusUploadPercent');
                var status = $('#FocusUploadStatus');

                $('#FocusUploadForm').ajaxForm({
                    beforeSend: function () {
                        status.empty();
                        var percentVal = '0%';
                        bar.width(percentVal);
                        percent.html(percentVal);
                    },
                    uploadProgress: function (event, position, total, percentComplete) {
                        var percentVal = percentComplete + '%';
                        bar.width(percentVal);
                        percent.html(percentVal);
                    },
                    complete: function (xhr) {
                        var url = xhr.responseText;
                        if ((url) && (url.length > 0)) {
                            status.html($('<a>File uploaded</a>').attr('href', url));
                            var absURL = url.substring(1);

                            update(objAddValue(getEditedFocus(), 'media', absURL));
                            later(function () {
                                x.dialog('close');
                            });
                        }
                    }
                });

            });
            
            addButtons.append(whatButton, howButton, whenButton, whereButton, whoButton, drawButton, webcamButton, uploadButton);

            d.append(addButtonWrap);

            var scopeSelect = null;
            if (!objHasTag(getEditedFocus(), 'User')) {
                scopeSelect = $('<select style="float:right"/>').append(
                    //store on server but only for me
                    '<option value="2">Private</option>', 
                    //store on server but share with who i follow
                    '<option value="5">Trusted</option>', 
                    //store on server for public access (inter-server)
                    '<option value="7">Public</option>').
                    val(getEditedFocus().scope);
                
                if (configuration.connection == 'local')
                    scopeSelect.attr('disabled', 'disabled');
                else {
                    scopeSelect.change(function () {
                        var e = getEditedFocus();
                        e.scope = parseInt(scopeSelect.val());
                        update(e);
                    });
                }
            }

            var saveButton = $('<button style="float:right"><b>Save</b></button>').click(function () {
                var e = getEditedFocus();
                e.author = $N.id();
                objTouch(e);
                $N.pub(e, function (err) {
                    $.pnotify({
                        title: 'Unable to save.',
                        text: x.name,
                        type: 'Error'
                    });
                }, function () {
                    $.pnotify({
                        title: 'Saved (' + x.id.substring(0, 6) + ')'
                        //text: '<button disabled>Goto: ' + x.name + '</button>'  //TODO button to view object
                    });
                });
                d.parent().dialog('close');
            });
            
            addButtonWrap.append(saveButton);
            if (scopeSelect)
                addButtonWrap.append(scopeSelect);

        }

    }

    update(ix);

    return d;
}

function applyTagStrengthClass(e, s) {
    if (s === 0.0)
        e.addClass('tag0');
    else if (s <= 0.25)
        e.addClass('tag25');
    else if (s <= 0.50)
        e.addClass('tag50');
    else if (s <= 0.75)
        e.addClass('tag75');
    else
        e.addClass('tag100');
}


function newTagSection(x, index, t, editable, whenSaved, onAdd, onRemove, onStrengthChange, onOrderChange, whenSliderChange) {
    var tag = t.id;
    var strength = t.strength;

    var d = newDiv().addClass('tagSection');

    /*d.hover( function() {
     d.addClass('tagSectionHovered');
     }, function() {
     d.removeClass('tagSectionHovered');
     } );*/

    if (strength === undefined)
        strength = 1.0;

    var tagLabel = $('<span>' + tag + '</span>').addClass('tagLabel');

    var tagIcon = $('<img src="' + getTagIcon(null) + '"/>');

    applyTagStrengthClass(d, strength);


    d.append(tagLabel, '&nbsp;');

    if (editable) {
        d.addClass('tagSectionEditable');

        var tagButtons = newDiv().addClass('tagButtons');
        /*d.hover(function() {
         //tagButtons.fadeIn();			
         }, function() {
         //tagButtons.fadeOut();
         });*/

        d.click(function () {
            if (!tagButtons.is(':visible')) {
                tagButtons.fadeIn();
            } else {
                tagButtons.fadeOut();
            }
        });

        tagButtons.hide();

        if (index > 0) {
            var upButton = $('<a title="Move Up">^</a>');
            upButton.addClass('tagButton');
            upButton.click(function () {
                onOrderChange(index, index - 1);
            });
            tagButtons.append(upButton);
        } else {
            var downButton = $('<a title="Move Down">v</a>');
            downButton.addClass('tagButton');
            downButton.click(function () {
                onOrderChange(index, index + 1);
            });
            tagButtons.append(downButton);
        }

        {
            var disableButton = $('<button value="0" title="Disable">&nbsp;</button>');
            var p25Button = $('<button value="0.25"  title="25%">&nbsp;</button>');
            var p50Button = $('<button value="0.5" title="50%">&nbsp;</button>');
            var p75Button = $('<button value="0.75" title="75%">&nbsp;</button>');
            var p100Button = $('<button value="1.0" title="100%">&nbsp;</button>');

            tagButtons.append(disableButton, p25Button, p50Button, p75Button, p100Button);

            var currentButton = null;
            if (strength === 0)
                currentButton = disableButton;
            if (strength === 1.0)
                currentButton = p100Button;
            if (strength === 0.75)
                currentButton = p75Button;
            if (strength === 0.5)
                currentButton = p50Button;
            if (strength === 0.25)
                currentButton = p25Button;
            if (currentButton)
                currentButton.addClass('tagButtonSelected');

            function _onStrengthChange() {
                onStrengthChange(index, parseFloat($(this).attr('value')));
            }
            
            disableButton.click(_onStrengthChange);
            p25Button.click(_onStrengthChange);
            p50Button.click(_onStrengthChange);
            p75Button.click(_onStrengthChange);
            p100Button.click(_onStrengthChange);
        }

        var removeButton = $('<a href="#" title="Remove">X</a>');
        removeButton.addClass('tagButton');
        removeButton.click(function () {
            if (confirm("Remove " + tag + "?"))
                onRemove(index);
        });
        tagButtons.append(removeButton);

        tagButtons.appendTo(d);

        //d.hover(function(){ tagButtons.fadeIn(200);}, function() { tagButtons.fadeOut(200);});
        //d.hover(function(){ tagButtons.show();}, function() { tagButtons.hide();});                
        //tagButtons.hide();
    }


    var type;
    if (isPrimitive(tag)) {
        //tagLabel.hide();    
        type = tag;
        tagLabel.hide();
    }

    var prop = $N.getProperty(tag);
    var defaultValue = null;
    if (prop) {
        type = prop.type;
        tagLabel.html(prop.name);

        if (prop['default']) {
            defaultValue = prop['default'];
        }
        d.addClass('propertySection');
    }

    if (type === 'textarea') {

        if (editable) {
            var dd = $('<textarea/>').addClass('tagDescription');
            if ((prop) && (prop.readonly)) {
                dd.attr('readonly', 'readonly');
            }

            if (prop)
                if (prop.description)
                    dd.attr('placeholder', prop.description);

            if (t.value)
                dd.val(t.value);
            else if (defaultValue)
                dd.val(defaultValue);

            d.append(dd);

            whenSaved.push(function (y) {
                objAddValue(y, tag, dd.val(), strength);
            });
        } else {
            var dd = newDiv();
            if (t.value)
                dd.html(t.value);
            d.append(dd);
        }
    } else if (type === 'cortexit') {
        //...
    } else if ((type === 'text') || (type === 'url') || (type === 'integer') || (type === 'real')) {

        if (editable) {
            var dd = $('<input type="text" placeholder="' + type + '"/>').appendTo(d);
            if (prop.readonly) {
                dd.attr('readonly', 'readonly');
            }

            var sx = null;
            if (prop) {
                if (prop.units) {
                    sx = $('<select></select>');
                    _.each(prop.units, function (u) {
                        sx.append('<option id="u">' + u + '</option>');
                    });
                    d.append(sx);
                }
            }

            if (t.value) {
                if (t.value.unit) {
                    //number and unit were both stored in a JSON object
                    dd.val(t.value.number);
                    sx.val(t.value.unit);
                } else {
                    //only the number was present
                    dd.val(t.value);
                }
            } else if (defaultValue !== null) {
                dd.val(defaultValue);
            }

            whenSaved.push(function (y) {
                if ((type == 'text') || (type == 'url')) {
                    objAddValue(y, tag, dd.val(), strength);
                } else if ((type == 'real') || (type == 'integer')) {
                    var ddv = (type == 'real') ? parseFloat(dd.val()) : parseInt(dd.val());

                    if (isNaN(ddv))
                        ddv = dd.val(); //store as string

                    if (!sx)
                        objAddValue(y, tag, ddv, strength);
                    else
                        objAddValue(y, tag, {
                            number: ddv,
                            unit: sx.val()
                        }, strength);
                }
            });

        } else {
            var dd = newDiv();
            if (t.value)
                dd.html(t.value);
            d.append(dd);
        }

    } else if (type === 'boolean') {
        var ii = $('<input type="checkbox">');

        var value = t.value;
        if (value === undefined) {
            if (defaultValue)
                value = defaultValue;
            else
                value = true;
        }

        ii.prop('checked', value).appendTo(d);

        if (editable) {
            whenSaved.push(function (y) {
                objAddValue(y, tag, ii.is(':checked'), strength);
            });
        } else {
            ii.attr("disabled", "disabled");
        }
    } else if (type === 'spacepoint') {
        var ee = newDiv();
        var dd = newDiv();

        var de = uuid();
        dd.attr('id', de);
        dd = dd.addClass('focusMap').appendTo(ee);

        var m;

        if (editable) {
            var cr = $('<select/>')
                .css('width', 'auto')
                .append('<option value="earth" selected>Earth</option>',
                      '<option value="moon">Moon</option>',
                      '<option value="mars">Mars</option>',
                      '<option value="venus">Venus</option>')
                .change(function () {
                    alert('Currently only Earth is supported.');
                    cr.val('earth');
                }).appendTo(ee);

            var ar = $('<input type="text" disabled="disabled" placeholder="Altitude" />').
                        css('width', '15%').appendTo(ee);

            whenSaved.push(function (y) {
                if (!m)
                    return;
                if (!m.location)
                    return;

                var l = m.location();
                objAddValue(y, tag, {
                    lat: l.lat,
                    lon: l.lon,
                    zoom: m.zoom,
                    planet: 'Earth'
                }, strength);
            });

        }

        d.append(ee);


        later(function () {
            var lat = t.value.lat || configuration.mapDefaultLocation[0];
            var lon = t.value.lon || configuration.mapDefaultLocation[1];
            var zoom = t.value.zoom;
            m = initLocationChooserMap(de, [lat, lon], zoom);

        });
    } else if (type == 'timepoint') {
        if (editable) {
            var lr = $('<input type="text" placeholder="Time" />');
            lr.val(new Date(t.at));
            d.append(lr);
            var lb = $('<button style="margin-top: -0.5em"><i class="icon-calendar"/></button>');
            d.append(lb);
            //TODO add 'Now' button

            //TODO add save function
        } else {
            d.append(new Date(t.at));
        }
    } else if (type == 'media') {
        if (editable) {
            whenSaved.push(function (y) {
                objAddValue(y, 'media', t.value, strength);
            });
        }
        var url = t.value;
        d.append('<img src="' + url + '"/>');
    } else if (type == 'sketch') {
        var eu = uuid();

        var ee = newDiv(eu);

        d.append(ee);

        var options = {
            width: 250,
            height: 250,
            editing: editable
        };
        if (t.value) {
            options.strokes = JSON.parse(t.value);
        }
        later(function () {
            var sketchpad = Raphael.sketchpad(eu, options);

            var value = "";
            // When the sketchpad changes, update the input field.
            sketchpad.change(function () {
                value = sketchpad.json();
            });
            whenSaved.push(function (y) {
                objAddValue(y, "sketch", value, strength);
            });
        });
    } else if (type == 'timerange') {
        var nn = Date.now();
        var oldest = nn - 5 * 24 * 60 * 60 * 1000; //TODO make this configurable

        if (editable) {

            var i = $('<input type="range" name="timecenter" min="1" max="10000">');

            if (t.value)
                if ((t.value.start) && (t.value.end)) {
                    var tm = ((0.5 * (t.value.start + t.value.end)) - oldest) / (nn - oldest) * 10000;
                    i.attr('value', parseInt(tm));
                }

            var j = $('<span id="timecenter"/>');
            j.append('Past');
            j.append(i);
            j.append('Now');
            d.append(j);

            var lb = $('<input type="checkbox">Latest</input>');
            d.append(lb);

            var s = $('<select>');
            s.append('<option value="1">5 mins</option>');
            s.append('<option value="2">15 mins</option>');
            s.append('<option value="3" selected>1 hour</option>');
            s.append('<option value="4">6 hours</option>');
            s.append('<option value="5">1 day</option>');
            s.append('<option value="6">1 week</option>');
            s.append('<option value="7">1 month</option>');
            d.append(s);



            var start = -1,
                end = -1;

            d.append('<br/>');

            var output = $('<span/>');
            d.append(output);

            var update = _.throttle(function () {
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
                onStrengthChange(tag);
                if (whenSliderChange)
                    whenSliderChange(x);
            }, 500);

            var uup = function () {
                later(function () {
                    update();
                });
            };

            i.change(uup);
            lb.change(uup);
            s.change(uup);

            update();

            //TODO add calendar buttons

            whenSaved.push(function (y) {
                objAddValue(y, tag, {
                    'from': end,
                    'to': start
                }, strength);
            });
        } else {
            d.append(new Date(t.value.start) + ' ' + new Date(t.value.end));
        }

    } else if (type == 'object') {
        if (editable) {
            var tt = $('<span></span>');
            var ts = $('<input></input>').attr('readonly', 'readonly');

            var value = t.value;

            function updateTS(x) {
                var X = $N.getObject(x) || $N.getTag(x) || {
                    name: x
                };
                if (X.name != x)
                    ts.val(X.name + ' (' + x + ')');
                else
                    ts.val(X.name);
                ts.result = x;
            }
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

            tt.append(ts);

            if (!prop.readonly) {
                var mb = $('<button title="Find Object">...</button>');

                ts.attr('placeholder', prop.tag ? JSON.stringify(prop.tag) : 'Object');

                mb.click(function () {
                    var tagRestrictions = prop.tag;
                    var pp = newPopup("Select Object", true, true);
                    var tagger = newTagger(null, function (tags) {
                        ts.result = tags = tags[0];

                        updateTS(tags);

                        pp.dialog('close');
                    }, tagRestrictions, 1);
                    pp.append(tagger);
                });
                ts.click(function () {
                    if (ts.val() == '')
                        mb.click();
                });
                tt.append(mb);
            }

            d.append(tt);

            whenSaved.push(function (y) {
                objAddValue(y, tag, ts.result || ts.val(), strength);
            });
        }
    } else if (tag) {
        var TAG = $N.tags[tag];
        whenSaved.push(function (y) {
            objAddTag(y, tag, strength);
        });
        if (!TAG) {
            //d.append('Unknown tag: ' + tag);            
        } else {
            var ti = getTagIcon(tag);
            if ($N.tags[tag] != undefined) {
                tagLabel.html(TAG.name);
            }
            if (ti)
                tagIcon.attr('src', ti);

            if ((!x.readonly) && (editable)) {
                /*var pb = $('<button>...</button>');
                 tagLabel.append(pb);*/


                var pdw = newDiv().addClass('tagSuggestionsWrap').appendTo(d);
                var pd = newDiv().addClass('tagSuggestions').appendTo(pdw);

                var pp = getTagProperties(tag);
                _.each(pp, function (ppv) {
                    var PP = $N.getProperty(ppv);

                    //TODO dont include if max present reached
                    if (PP.max)
                        if (PP.max > 0) {
                            var existing = objValues(x, ppv).length;
                            if (PP.max <= existing)
                                return;
                        }

                    var ppn = PP.name;
                    var appv = $('<a title="' + PP.type + '">+' + ppn + '</a>');
                    var defaultValue = '';
                    appv.click(function () {
                        onAdd(ppv, defaultValue);
                    });

                    pd.append(appv, '&nbsp;');
                });

            }

            /*
             if (t.value) {
             for (var v = 0; v < t.value.length; v++) {
             var vv = t.value[v];
             var pv = $N.getProperty(vv.id);
             //var pe = newPropertyEdit(vv, pv);
             var pe = newTagSection(t, v, vv, editable);
             //this.propertyEdits.push(pe);
             d.append(pe);
             }
             }*/
        }
    }

    tagIcon.prependTo(tagLabel);

    if (t.description)
        d.append('<ul>' + t.description + '</ul>');

    return d;
}

function newPropertyView(x, vv) {

    var p = $N.getProperty(vv.id);
    if (!p)
        return ('<li><b>' + vv.id + '</b>: ' + vv.value + '</li>');

    var nameLabel = '<a><b>' + p.name + '</b></a>';
    
    if (p.type === 'object') {
        var o = $N.getObject(vv.value) || {
            name: vv.value
        };

        return '<li>' + nameLabel + ': <a href="javascript:newPopupObjectView(\'' +
               vv.value + '\')">' + o.name + '</a></li>';
    } else if (p.type === 'url') {
        return '<li>' + nameLabel + 
               ': <a target="_blank" href="' + vv.value + '">' +
               vv.value + '</a></li>';
    } else if (p.type === 'timeseries') {
        return ('<li>' + nameLabel + '<br/><textarea>' + JSON.stringify(vv.value) + '</textarea></li');
    } else if ((p.type === 'integer') && (p.incremental)) {
        function goprev() {
            objSetFirstValue(x, vv.id, ii - 1);
            $N.notice(x);
            $N.pub(x);
        }

        function gonext() {
            objSetFirstValue(x, vv.id, ii + 1);
            $N.notice(x);
            $N.pub(x);
        }

        var v = $('<li>' + nameLabel + ': ' + vv.value + '</li>');
        if (p.min < vv.value) {
            $('<button>&lt;</button>')
                .click(function () {
                    later(goprev);
                }).prependTo(v);
        }
        //TODO allow for max
        $('<button>&gt;</button>').
            click(function () {
                later(gonext);
            }).appendTo(v);
        return v;

    } else if ((p.type === 'integer') || (p.type === 'real')) {
        if (vv.value)
            if (vv.value.unit) {
                return $('<li>' + nameLabel + ': ' + vv.value.number + ' ' + vv.value.unit + '</li>');
            }
        return $('<li>' + nameLabel + ': ' + vv.value + '</li>');
    } else {
        return $('<li>' + nameLabel + ': ' + vv.value + '</li>');
    }
}

function newReplyPopup(x) {
    var pp = newPopup("Reply to: " + x.name);

    function closeReplyDialog() {
        pp.dialog('close');
    }

    pp.append(newReplyWidget(
        //on reply
        function (text) {

            closeReplyDialog();

            var rr = {
                name: text,
                id: uuid(),
                value: [],
                author: $N.id(),
                replyTo: [x.id],
                createdAt: Date.now()
            };

            $N.pub(rr, function (err) {
                $.pnotify({
                    title: 'Error replying (' + x.id.substring(0, 6) + ')',
                    text: err,
                    type: 'Error'
                })
            }, function () {
                $N.notice(rr);
                $.pnotify({
                    title: 'Replied (' + x.id.substring(0, 6) + ')'
                })
            });

        },
        //on cancel
        function () {
            closeReplyDialog();
        }
    ));

}

function newSimilaritySummary(x) {
    var s = {};
    var count = 0;
    for (var i = 0; i < x.value.length; i++) {
        var v = x.value[i];
        if (v.id == 'similarTo') {
            s[v.value] = v.strength || 1.0;
            count++;
        }
    }
    if (count == 0) return newDiv();


    function newSimilarityList(X) {
        var d = newEle('ul');
        _.each(X.value, function (v) {
            if (v.id == 'similarTo') {
                var stf = v.strength || 1.0;
                var st = parseFloat(stf * 100.0).toFixed(1);
                var o = $N.getObject(v.value);
                var name = o ? o.name : "?";
                var li = $('<li></li>').appendTo(d);
                var lia = $('<a>' + name /*+ ' (' + st + '%) */ + '</a>').appendTo(li);
                li.append('&nbsp;');
                lia.click(function () {
                    newPopupObjectView(v.value);
                });
                lia.css('opacity', 0.5 + (0.5 * stf));
            }
        });
        return d;
    }

    function newSimilarityAreaMap(s) {
        var d = newDiv().css("clear", "both");

        var width = 100;
        var height = 100;

        var treemap = d3.layout.treemap()
            .size([width, height])
            //.sticky(true)
            .value(function (d) {
                return d.size;
            });

        var div = d3.selectAll(d.toArray())
            .style("position", "relative")
            .style("width", (width) + "%")
            .style("height", "10em")
            .style("left", 0 + "px")
            .style("top", 0 + "px");

        var data = {
            name: '',
            children: [
   ]
        };
        _.each(s, function (v, k) {
            var o = $N.getObject(k);
            if (o)
                data.children.push({
                    id: o.id,
                    name: o.name,
                    size: v
                });
        });

        var color = d3.scale.category20c();

        var node = div.datum(data).selectAll(".node")
            .data(treemap.nodes)
            .enter().append("div")
            .attr("class", "node")
            .style("position", "absolute")
            .style("border", "1px solid gray")
            .style("overflow", "hidden")
            .style("cursor", "crosshair")
            .style("text-align", "center")
            .call(position)
            .on('click', function (d) {
                newPopupObjectView(d.id);
            })
            .style("background", function (d) {
                return color(d.name);
            })
            .text(function (d) {
                return d.children ? null : d.name;
            });

        d3.selectAll("input").on("change", function change() {
            var value = this.value === "count" ? function () {
                return 1;
            } : function (d) {
                return d.size;
            };

            node
                .data(treemap.value(value).nodes).call(position);
            /*		  	.transition()
				.duration(1500)
				.call(position);*/
        });

        function position() {
            this.style("left", function (d) {
                return (d.x) + "%";
            })
                .style("top", function (d) {
                    return (d.y) + "%";
                })
                .style("width", function (d) {
                    return d.dx + "%";
                })
                .style("height", function (d) {
                    return d.dy + "%";
                });
        }
        return d;
    }


    var g = newDiv().addClass('SimilaritySection');

    var e = newDiv().css('float', 'left');
    var eb = $('<button title="Similarity"></button>').appendTo(e);
    eb.append(newTagButton('Similar').find('img'));


    g.append(e);

    var h = newSimilarityList(x);

    g.append(h);


    var areaMap = null;
    eb.click(function () {
        if ((!areaMap) || (!areaMap.is(':visible'))) {
            if (!areaMap) {
                areaMap = newSimilarityAreaMap(s);
                h.append(areaMap);
            }
            areaMap.show();
        } else {
            areaMap.hide();
        }
        freetileView();
    });

    return g;
}


//as a static global function for optimization
function _refreshActionContext() {
    refreshActionContext();
    return true;
}

/**
 produces a self-contained widget representing a nobject (x) to a finite depth. activates all necessary renderers to make it presented
 */
function newObjectSummary(x, options) {
    if (!options)
        options = {};

    var onRemoved = options.onRemoved;
    var scale = options.scale;
    var depthRemaining = options.depthRemaining;
    var nameClickable = (options.nameClickable != undefined) ? options.nameClickable : true;
    var showAuthorIcon = (options.showAuthorIcon != undefined) ? options.showAuthorIcon : true;
    var showAuthorName = (options.showAuthorName != undefined) ? options.showAuthorName : true;
    var showMetadataLine = (options.showMetadataLine != undefined) ? options.showMetadataLine : true;
    var showActionPopupButton = (options.showActionPopupButton != undefined) ? options.showActionPopupButton : true;
    var showSelectionCheck = (options.showSelectionCheck != undefined) ? options.showSelectionCheck : true;
    var titleClickMode = (options.titleClickMode != undefined) ? options.titleClickMode : 'view';
    var showTime = (options.showTime != undefined) ? options.showTime : true;

    if (!x) {
        return newDiv().html('Object Missing');
    }

    //check for Similarity
    var ot = objTags(x);
    if ((ot[0] == 'Similar') && (ot[1] == 'similarTo')) {
        /*showMetadataLine = false;
		showActionPopupButton = false;
		showSelectionCheck = false;
		showTime = false;
		nameClickable = false;*/
        return newSimilaritySummary(x);
    }

    //check for PDF
    if (objHasTag(x, 'PDF')) {
        var ee = uuid();
        var cd = $('<canvas/>')
        cd.attr('id', ee);

        var pdfPage = objFirstValue(x, 'slideNumber');
        var pdfPath = objFirstValue(x, 'pdfURL');
        if (pdfPage && pdfPath) {

            PDFJS.getDocument(pdfPath).then(function (pdf) {
                // Using promise to fetch the page
                pdf.getPage(pdfPage).then(function (page) {
                    var scale = 1.0;
                    var viewport = page.getViewport(scale);

                    //
                    // Prepare canvas using PDF page dimensions
                    //
                    var canvas = document.getElementById(ee);
                    var context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;

                    //
                    // Render PDF page into canvas context
                    //
                    var renderContext = {
                        canvasContext: context,
                        viewport: viewport
                    };
                    page.render(renderContext);
                });
            });
        } else {
            cd.prepend('Unable to find PDF source.');
        }
    }



    var mini = (depthRemaining == 0);


    var d = $('<div class="objectView ui-widget-content ui-corner-all">');
    var oStyle = x.style;
    d.attr('style', "font-size:" + ((scale) ? ((0.5 + scale) * 100.0 + '%') : ("100%")) + (oStyle ? '; ' + oStyle : ''));

    var xn = x.name;
    var authorID = x.author;

    d.append(cd);

    if (showAuthorName) {
        if (!isSelfObject(x.id)) { //exclude self objects
            if (x.author) {
                var a = x.author;
                var as = $N.getObject(x.author);
                if (as)
                    a = as.name;
                //else display UID?

                xn = a + ': ' + xn;
            }
        }
    }

    var replies = newDiv();

    var refreshReplies = function() {
        var r = $N.getReplies(x.id);
        if (r.length > 0) {
            replies.show();
            //TODO sort the replies by age, oldest first
            r.forEach(function(p) {
                replies.append(newObjectSummary($N.getObject(p), {
                    'depthRemaining': depthRemaining - 1
                }));
            });
        } else {
            replies.hide();
        }
    }

    //var hb = newDiv().addClass('ObjectViewHideButton ui-widget-header ui-corner-tl');
    //var hb = newDiv().addClass('ObjectViewHideButton ui-corner-tl'); //without ui-widget-header, it is faster CSS according to Chrome profiler


    //var replyButton;

    /*
    if (!mini) {
        replyButton = $('<button title="Reply" class="ui-widget-content ui-button">r</button>');
        replyButton.click(function () {

            newReplyPopup(x);


            replyButton.enabled = false;
        });
        hb.append(replyButton);


    }


    if (replyButton)
        replyButton.hover(
            function () {
                $(this).addClass('ui-state-hover');
            },
            function () {
                $(this).removeClass('ui-state-hover');
            }
        );
        */


    /*
     var cloneButton = $('<button title="Clone" class="ui-widget-content ui-button" style="padding-right:8px;">c</button>');
     var varyButton = $('<button title="Vary" class="ui-widget-content ui-button" style="padding-right:8px;">v</button>');
     hb.append(cloneButton);
     hb.append(varyButton);
     */

    //d.append(hb);

    /*
    (function () {
        //d.hover(function(){ hb.fadeIn(200);}, function() { hb.fadeOut(200);});
        d.hover(function () {
            hb.show();
        }, function () {
            hb.hide();
        });
    })();
    hb.hide();
    */
    
    if (showAuthorIcon) {
        var authorClient = $N.getObject(authorID);
        if (authorClient) {
            if (authorID) {
                var av = newAvatarImage(authorClient)
                            //.attr('align', 'left')
                            .appendTo(d)
                            .wrap('<div class="AvatarIcon"/>');
            }
        }
    }

    //Selection Checkbox
    var selectioncheck = null;
    if (showSelectionCheck) {
        selectioncheck = $('<input type="checkbox"/>')
            .addClass('ObjectSelection')
            .attr('oid', x.id)
            .click(_refreshActionContext);
    }

    var haxn = null;

    function addPopupMenu() {
        var ms = $N.myself();
        if (ms)
            if (ms.id === x.author) {
                var editButton = $('<button title="Edit">..</button>').addClass('ObjectViewPopupButton');
                editButton.click(function () {
                    var windowParent = editButton.parent().parent().parent();
                    if (windowParent.hasClass('ui-dialog-content')) {
                        windowParent.dialog('close');
                    }
                    newPopupObjectEdit(x, true);
                    return false;
                });
            }

        var popupmenu = null;
        var popupmenuButton = $('<button title="Actions...">&gt;</button>')
            .addClass('ObjectViewPopupButton')
            .click(function () {

                if (popupmenu) {
                    //click the popup menu button again to disappear an existing menu
                    return closeMenu();
                }

                function closeMenu() {
                    popupmenu.remove();
                    popupmenu = null;
                    return false;
                }

                popupmenu = newContextMenu([x], true, closeMenu).addClass('ActionMenuPopup');

                var closeButton = $('<button>Close</button>')
                                    .click(closeMenu)
                                    .appendTo(popupmenu);

                popupmenuButton.after(popupmenu);
                return false;            
            });

        if (haxn) {
            haxn.append(editButton, popupmenuButton);
        } else
            d.append(editButton, popupmenuButton);
    }

    //Name
    if (x.name) {
        haxn = $('<h1>');
        if (!nameClickable) {
            haxn.html(xn);
        } else {
            var xxn = xn.length > 0 ? xn : '?';
            var axn = $('<a>' + xxn + '</a>');
            axn.attr('title', x.id);
            axn.click(function () {
                if ((x.author === $N.id()) && (titleClickMode === 'edit'))
                    newPopupObjectEdit(x, true);
                else if (typeof (titleClickMode) === 'function') {
                    titleClickMode(x);
                } else {
                    newPopupObjectView(x.id, true);
                }
                return false;                
            });
            haxn.append(axn, '&nbsp;');
        }
        if (selectioncheck)
            haxn.prepend(selectioncheck);
        d.append(haxn);
    } else {
        if (selectioncheck)
            d.append(selectioncheck);
    }

    if (showActionPopupButton)
        addPopupMenu();

    if (showMetadataLine) {
        newMetadataLine(x, showTime).appendTo(d);
    }

    //d.append('<h3>Relevance:' + parseInt(r*100.0)   + '%</h3>');


    d.append(newObjectDetails(x));

    if (!mini) {
        replies.addClass('ObjectReply');
        replies.hide();
        d.append(replies);

        refreshReplies();
    }

    return d;
}

function newObjectDetails(x) {
    var d = newDiv();
    var desc = objDescription(x);
    if (desc) {
        d.append('<p>' + desc + '</p>');
    }


    if (x.value) {
        var ud = $('<ul>');
        d.append(ud);
        x.value.forEach(function(vv) {

            if (vv.id == 'sketch') {
                var eu = uuid();

                var ee = newDiv(eu);

                ud.append(ee);

                var options = {
                    width: 250,
                    height: 250,
                    editing: false
                };
                if (vv.value) {
                    options.strokes = JSON.parse(vv.value);
                }
                later(function () {
                    /*var sketchpad =*/ Raphael.sketchpad(eu, options);
                });
                return;
            } else if (vv.id == 'timerange') {
                /*if (ISODateString) {
                 ud.append(ISODateString(new Date(vv.value.start)) + ' '
                 + ISODateString(new Date(vv.value.start)));
                 }
                 else*/
                {
                    //mozilla: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString
                    ud.append(new Date(vv.value.start).toISOString() + ' ' + new Date(vv.value.start).toISOString());
                }
            } else if (vv.id == 'media') {
                if (typeof vv.value == 'string') {
                    var url = vv.value;
                    ud.append('<img src="' + url + '"/>');
                } else {
                    var V = vv.value;
                    if (V.type == 'html') {
                        ud.append(V.content);
                    } else if (V.type == 'markdown') {
                        ud.append(newDiv().addClass('markdown').html(markdown.toHTML(V.content)));
                    }
                }
            }

            if ($N.isProperty(vv.id)) {
                var strength = vv.strength || 1.0;

                var pv = newPropertyView(x, vv);
                if (pv) {
                    if (typeof pv === "string")
                        pv = $(pv);
                    pv.css('opacity', 0.5 + (strength / 2.0)).appendTo(ud);
                }
            }
        });
    }
    return d;
}


function withObject(uri, success, failure) {
    $.getJSON('/object/' + uri + '/json', function (s) {

        if (s.length == 0) {
            if (failure)
                failure();
        } else {
            if (success) {
                success(s);
            }
        }
    });
}


function ISODateString(d) {
    function pad(n) {
        return n < 10 ? '0' + n : n;
    }
    return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()) + 'T' + pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()) + ':' + pad(d.getUTCSeconds()) + 'Z';
}

function newMetadataLine(x, showTime) {
    var mdline = newEle('h2').addClass('MetadataLine');

    var ot = objTags(x);
    var ots = objTagStrength(x, false);

    ot.forEach(function(t) {
        if ($N.isProperty(t))
            return;

        var tt = $N.getTag(t);
        if (tt) {
            var ttt = newTagButton(tt).appendTo(mdline);
            applyTagStrengthClass(ttt, ots[t]);
        } else {
            mdline.append('<a>' + t + '</a>');
        }
        mdline.append('&nbsp;');
    });

    var spacepoint = objSpacePoint(x);
    if (spacepoint) {
        var lat = _n(spacepoint.lat);
        var lon = _n(spacepoint.lon);
        var mll = objSpacePointLatLng($N.myself());
        if (mll) {
            var dist = '?';
            //TODO check planet
            var sx = [spacepoint.lat, spacepoint.lon];
            if (mll)
                dist = geoDist(sx, mll);

            if (dist === 0)
                mdline.append('&nbsp;<a>[here]</a>');
            else
                mdline.append('&nbsp;<a>[' + lat + ',' + lon + ':  ' + _n(dist) + ' km away]</a>');
        } else {
            mdline.append('&nbsp;<a>[' + lat + ',' + lon + ']</a>');
        }
    }

    if (showTime !== false) {
        var ww = objWhen(x);
        if (ww) {
            mdline.append('&nbsp;&nbsp;', 
                          newEle('a').append($.timeago(new Date(ww))) );
        }
    }
    return mdline;
}
