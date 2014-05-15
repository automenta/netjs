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

    var objects = objectIDs.map(function(i) {
        if (typeof i === "string")
            return $N.getObject(i);
        else
            return i;
    });

    var maxDisplayableObjects = 64;

    var e = newDiv();
    var displayedObjects = 0;
    _.each(objects, function(o) {
        if (displayedObjects === maxDisplayableObjects) {
            return;
        }

        if (o) {
            e.append(newObjectSummary(o, {
                depthRemaining: 0
            }));
            displayedObjects++;
        }

        if (displayedObjects === maxDisplayableObjects) {
            e.prepend('WARNING: Too many objects selected.  Only showing the first ' + maxDisplayableObjects + '.<br/>');
        }
    });
    return newPopup(displayedObjects + " Object" + ((displayedObjects > 1) ? 's' : ''), true).append(e);

}


function newAvatarImage(s) {
    return $(newEle('img')).attr({
        "src": getAvatarURL(s),
        'title': s.name
    });
}

function getAvatarURL(s, style) {
    if (!style)
        style = 'retro';
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


//(function is globalalized for optimization purposes)
function _onTagButtonClicked() {
    var ti = $(this).attr('taguri');
    var t = $N.getTag(ti);
    if (t)
        newPopupObjectView(tagObject(t));
    return false;
}


function newTagImage(ti) {
    return newEle('img').attr({
        'src': ti,
        'class': 'TagButtonIcon'
    });
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
        i = newTagImage(ti);
    }

    var b = isButton ? newEle('button') : newEle('a').attr('href', '#');

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
        b.attr('taguri', t.uri || (t + ''));
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
    c.click(function() {
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
    b.click(function() {
        if (ta.val().length > 0) {
            onReply(ta.val());
        }
    });
    bw.append(b);

    return w;
}

function pidToProperty(pid) {
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
    var D = newDiv().addClass('ObjectEditDiv');
    var headerTagButtons = ix.tagSuggestions || [];
    var ontocache = {};

    function update(x) {
        var widgetsToAdd = [];
        
        var whenSaved = [];
        var nameInput = null;

        function getEditedFocus() {
            if (!editable)
                return x;

            var na = nameInput ? nameInput.val() : "";

            var n = objNew(x.id, na);
            n.createdAt = x.createdAt;
            n.author = x.author;

            //copy all metadata

            if (x.subject)
                n.subject = x.subject;
            if (x.when)
                n.when = x.when;
            if (x.expiresAt)
                n.expiresAt = x.expiresAt;
            if (x.replyTo)
                n.replyTo = x.replyTo;

            n.scope = x.scope || configuration.defaultScope;

            //TODO copy any other metadata

            for (var i = 0; i < whenSaved.length; i++) {
                var w = whenSaved[i];
                w(n);
            }
            return n;
        }

        var onAdd = function(tag, value) {
            update(objAddValue(getEditedFocus(), tag, value));
        };
        var onRemove = function(i) {
            var rr = objRemoveValue(getEditedFocus(), i);
            if (onTagRemove)
                onTagRemove(rr);
            update(rr);
        };
        var onStrengthChange = function(i, newStrength) {
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
        var onOrderChange = function(fromIndex, toIndex) {
            if (x.readonly)
                return;
            //http://stackoverflow.com/questions/5306680/move-an-array-element-from-one-array-position-to-another
            var y = getEditedFocus();
            y.value.splice(toIndex, 0, y.value.splice(fromIndex, 1)[0]);
            update(y);
        };


        widgetsToAdd =[];

        if (editable) {
            if (hideWidgets !== true) {
                nameInput = $('<input/>').attr('type', 'text').attr('x-webkit-speech', 'x-webkit-speech').addClass('nameInput').addClass('nameInputWide');
                nameInput.val(objName(x));
                widgetsToAdd.push(nameInput);

                whenSaved.push(function(y) {
                    objName(y, nameInput.val());
                });
            }
        } else {
            widgetsToAdd.push('<h1>' + objName(x) + '</h1>');
        }
        //widgetsToAdd.push($('<span>' + x.id + '</span>').addClass('idLabel'));

        var header = newDiv();
        widgetsToAdd.push(header);

        _.each(headerTagButtons, function(T) {
            if (T == '\n') {
                header.append('<br/>');
            } else {
                newTagButton(T, function() {
                    var y = D.getEditedFocus();
                    objAddTag(y, T);
                    update(y);
                }, true).appendTo(header);
            }
        });

        var tsw = $('<div class="tagSuggestionsWrap"></div>');
        widgetsToAdd.push(tsw);
        
        var ts = $('<div/>').addClass('tagSuggestions').appendTo(tsw);

        if (x.value) {
            var tags = []; //tags & properties, actually



            var tt = null;
            for (var i = 0; i < x.value.length; i++) {
                var t = x.value[i];

                if (excludeTags)
                    if (_.contains(excludeTags, t.id))
                        continue;

                tags.push(t.id);
                tt = newTagSection(x, i, t, editable, whenSaved, onAdd, onRemove, onStrengthChange, onOrderChange, whenSliderChange);
                widgetsToAdd.push(tt);
            }
            if (tt!=null) {
                //hide the last tag section's down button
                tt.find('.moveDown').hide();
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
                widgetsToAdd.push(newTagSection(x, i + x.value.length, {
                    id: p
                }, editable, whenSaved, onAdd, onRemove, onStrengthChange, onOrderChange, whenSliderChange));
            }
        }


        var ontoSearcher;

        var lastNameValue = null;

        function search() {
            if (!tsw.is(':visible')) {
                //clearInterval(ontoSearcher);
                return;
            }
            if (!D.is(':visible')) {
                clearInterval(ontoSearcher);
                return;
            }

            var v = nameInput.val();

            if (v.length === 0)
                return;

            if (lastNameValue !== v) {
                updateTagSuggestions(v, ts, onAdd, getEditedFocus, ontocache);
                lastNameValue = v;
            }
        }
        
        if (nameInput)
            updateTagSuggestions(nameInput.val(), ts, onAdd, getEditedFocus, ontocache);

        if (objHasTag(getEditedFocus(), 'Tag')) {
            //skip suggestions when editing a Tag
            ts.empty();
        } else {
            if (!x.readonly) {
                if (hideWidgets !== true) {
                    if (editable)
                        ontoSearcher = setInterval(search, ONTO_SEARCH_PERIOD_MS);
                        search();
                }
            }
        }

        D.empty();
        D.getEditedFocus = getEditedFocus;



        if ((hideWidgets !== true) && (!x.readonly)) {
            var addButtonWrap = newDiv().addClass('tagSection').addClass('tagSectionControl');
                    

            var addButtons = newEle('span').appendTo(addButtonWrap);

            if (configuration.device == configuration.DESKTOP) {
                var addDisplay = $('<button>+</button>').prependTo(addButtonWrap);
                addDisplay.hover(function() {
                    if (!addButtons.is(':visible')) {
                        addButtons.fadeIn();
                        addDisplay.text('-');
                    }
                });
                addDisplay.click(function() {
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

            var whatButton = $('<button title="What?"><img src="/icon/rrze/emblems/information.png"></button>').click(function() {
                var p = newPopup('Select Tags for ' + nameInput.val(), true, true);
                p.append(newTagger([], function(t) {
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

            var howButton = $('<button title="How/Why?" id="AddDescriptionButton"><img src="/icon/rrze/actions/quote.png"></button>').click(function() {
                update(objAddValue(getEditedFocus(), 'html', ''));
            });

            var whenButton = $('<button disabled title="When?" id="AddWhenButton" ><img src="/icon/clock.png"></button>');

            var whereButton = $('<button title="Where?"><img src="/icon/rrze/emblems/globe.png"></button>').click(function() {
                update(objAddValue(getEditedFocus(), 'spacepoint', ''));
            });

            var whoButton = $('<button disabled title="Who?" id="AddWhoButton"><img src="/icon/rrze/categories/user-group.png"></button>');

            var drawButton = $('<button title="Draw"><img src="/icon/rrze/emblems/pen.png"/></button>').click(function() {
                update(objAddValue(getEditedFocus(), 'sketch', ''));
            });


            var webcamButton = $('<button title="Webcam"><img src="/icon/play.png"/></button>').click(function() {
                newWebcamWindow(function(imgURL) {
                    update(objAddValue(getEditedFocus(), 'image', imgURL));
                });
            });

            var uploadButton = $('<button title="Add Media (Upload or Link)"><img src="/icon/rrze/actions/dial-in.png"/></button>').click(function() {


                function attachURL(url) {
                    if (url.endsWith('.png') || url.endsWith('.jpeg') || url.endsWith('.jpg') || url.endsWith('.svg') || url.endsWith('.gif')) {
                        update(objAddValue(getEditedFocus(), 'image', url));
                    }
                    else {
                        update(objAddValue(getEditedFocus(), 'url', url));
                    }
                    
                    later(function() {
                        x.dialog('close');
                    });
                }

                var y = newDiv();

                var fuf = $('<form id="FocusUploadForm" action="/upload" method="post" enctype="multipart/form-data">File:</form>').appendTo(y);
                var fileInput = $('<input type="file" name="uploadfile" />').appendTo(fuf);
                fuf.append('<br/>');
                var fileSubmit = $('<input type="submit" value="Upload" />').hide().appendTo(fuf);

                fileInput.change(function() {
                    if (fileInput.val().length > 0)
                        fileSubmit.show();
                });

                var stat = $('<div class="FocusUploadProgress"><div class="FocusUploadBar"></div><div class="FocusUploadPercent">0%</div></div><br/><div id="FocusUploadStatus"></div>').appendTo(y).hide();

                y.append('<hr/>');

                var mediaInput = $('<input type="text" placeholder="Image or Video URL"/>').appendTo(y);
                var mediaButton = $('<button>Attach</button>').appendTo(y).click(function() {
                    attachURL(mediaInput.val());
                });


                y.append('<hr/>');
                var okButton = $('<button class="btn">Cancel</button>').appendTo(y);


                var x = newPopup('Add Media', {
                    modal: true,
                    width: "50%"
                });
                x.append(y);

                okButton.click(function() {
                    x.dialog('close');
                });

                var bar = $('.FocusUploadBar');
                var percent = $('.FocusUploadPercent');
                var status = $('#FocusUploadStatus');

                $('#FocusUploadForm').ajaxForm({
                    beforeSend: function() {
                        status.empty();
                        var percentVal = '0%';
                        bar.width(percentVal);
                        percent.html(percentVal);
                        stat.show();
                    },
                    uploadProgress: function(event, position, total, percentComplete) {
                        var percentVal = percentComplete + '%';
                        bar.width(percentVal);
                        percent.html(percentVal);
                    },
                    complete: function(xhr) {
                        var url = xhr.responseText;
                        if ((url) && (url.length > 0)) {
                            status.html($('<a>File uploaded</a>').attr('href', url));
                            var absURL = url.substring(1);
                            attachURL(absURL);
                        }
                    }
                });

            });

            addButtons.append(whatButton, howButton, whenButton, whereButton, whoButton, drawButton, webcamButton, uploadButton);

            widgetsToAdd.push(addButtonWrap);

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
                    scopeSelect.change(function() {
                        var e = getEditedFocus();
                        e.scope = parseInt(scopeSelect.val());
                        update(e);
                    });
                }
            }

            var saveButton = $('<button style="float:right"><b>Save</b></button>').click(function() {
                var e = getEditedFocus();
                e.author = $N.id();
                objTouch(e);
                $N.pub(e, function(err) {
                    $.pnotify({
                        title: 'Unable to save.',
                        text: x.name,
                        type: 'Error'
                    });
                }, function() {
                    $.pnotify({
                        title: 'Saved (' + x.id.substring(0, 6) + ')'
                                //text: '<button disabled>Goto: ' + x.name + '</button>'  //TODO button to view object
                    });
                });
                D.parent().dialog('close');
            });

            addButtonWrap.append(saveButton);
            if (scopeSelect)
                addButtonWrap.append(scopeSelect);

        }
        
        D.append(widgetsToAdd);
    }

    update(ix);

    return D;
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
    if (strength === undefined) strength = 1.0; 

    var e = newDiv().addClass('tagSection');
    var d = newDiv().addClass('tagSectionItem').appendTo(e);
    applyTagStrengthClass(e, strength);

    if (configuration.device !== configuration.MOBILE) {
        d.hover( function() {
            d.addClass('tagSectionHover');
        }, function() {
            d.removeClass('tagSectionHover');
        } );
     }


    var tagLabel = newEle('span').html(tag).addClass('tagLabel');

    var tagIcon = $('<img src="' + getTagIcon(null) + '"/>');



    d.append(tagLabel, '&nbsp;');

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
                if (newstrength!==strength) {
                    onStrengthChange(index,  newstrength);
                }
            });
        }
        
        if (strength < 1.0) {
            var plusButton = newEle('button').html('+').appendTo(tagButtons).mousedown(function() {
                var newstrength = Math.min(1.0, strength + 0.25);
                if (newstrength!==strength)
                    onStrengthChange(index,  newstrength);
            });
            /*var strengthAdjust = newDiv().appendTo(tagButtons)
                    .attr('style','z-index:-1; position:absolute; bottom: -10px; height: 10px; background-color: black; width:100%');
            var strengthIndicator = newDiv().html('&nbsp;').appendTo(strengthAdjust)
                    .attr('style','z-index:-1; position:absolute; height: 10px; background-color: white; width:' + (100.0*strength) + '%');                */
        }
        
        var removeButton = $('<button title="Remove">x</button>').addClass('tagButton').appendTo(tagButtons)
        .mousedown(function() {
            if (confirm("Remove " + tag + "?"))
                onRemove(index);
        });

        d.append(tagButtons);

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

    if (type === 'html') {

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

            whenSaved.push(function(y) {
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
                    _.each(prop.units, function(u) {
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

            whenSaved.push(function(y) {
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
            whenSaved.push(function(y) {
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
                    .change(function() {
                        alert('Currently only Earth is supported.');
                        cr.val('earth');
                    }).appendTo(ee);

            var ar = $('<input type="text" disabled="disabled" placeholder="Altitude" />').
                    css('width', '15%').appendTo(ee);

            whenSaved.push(function(y) {
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


        later(function() {
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
            d.append(newEle('a').append($.timeago(new Date(t.at))));
        }
    } else if (type == 'image') {
        if (editable) {
            whenSaved.push(function(y) {
                objAddValue(y, t.id, t.value, strength);
            });
        }
        var url = t.value;
        d.append('<img class="objectViewImg" src="' + url + '"/>');
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
        later(function() {
            var sketchpad = Raphael.sketchpad(eu, options);

            var value = "";
            // When the sketchpad changes, update the input field.
            sketchpad.change(function() {
                value = sketchpad.json();
            });
            whenSaved.push(function(y) {
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
                onStrengthChange(tag);
                if (whenSliderChange)
                    whenSliderChange(x);
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

            whenSaved.push(function(y) {
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
            var ts = $('<input></input>').css('margin-right', '0').attr('readonly', 'readonly');

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

                var tagRestrictions = prop.tag;
                if (typeof tagRestrictions === "string")
                    tagRestrictions = [tagRestrictions];

                ts.attr('placeholder', prop.tag ? prop.tag.join(' or ') : '');

                var mb = $('<button>...</button>').attr('title', "Find Object")
                            .css('margin-left','0').appendTo(tt)
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
                    if (ts.val() == '')
                        mb.click();
                });

                if (tagRestrictions) {                    
                    var tnames = [];
                    tagRestrictions.forEach(function(tr) {
                        var T = $N.getTag(tr);
                        tnames.push(T.name);
                        if (!T)
                            return;
                    });
                    $('<button title="Create ' + tnames.join(' or ') + '" disabled class="createSubObjectButton">+</button>').appendTo(tt);
                }
            }

            d.append(tt);

            whenSaved.push(function(y) {
                objAddValue(y, tag, ts.result || ts.val(), strength);
            });
        }
    } else if (tag) {
        var TAG = $N.tags[tag];
        whenSaved.push(function(y) {
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
                _.each(pp, function(ppv) {
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
                    appv.click(function() {
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

    return e;
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

        return newEle('li').append(nameLabel, ': ',
                '<a href="javascript:newPopupObjectView(\'' + vv.value + '\')">' + o.name + '</a>');
    } else if (p.type === 'url') {
        return '<li>' + nameLabel +
                ': <a target="_blank" href="' + vv.value + '">' +
                vv.value + '</a></li>';
    } else if (p.type === 'timeseries') {
        return ('<li>' + nameLabel + '<br/><textarea>' + JSON.stringify(vv.value) + '</textarea></li>');
    } else if (p.type === 'timepoint') {
        var when = parseInt(vv.value);
        return newEle('li').append(nameLabel, ': ', newEle('a').append($.timeago(new Date(when))));
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
                    .click(function() {
                        later(goprev);
                    }).prependTo(v);
        }
        //TODO allow for max
        $('<button>&gt;</button>').
                click(function() {
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
        return newEle('li').append(nameLabel, ': ', vv.value);
    }
}

function newReplyPopup(x, onReplied) {
    var pp = newPopup("Reply to: " + x.name);

    function closeReplyDialog() {
        pp.dialog('close');
    }

    pp.append(newReplyWidget(
            //on reply
                    function(text) {

                        closeReplyDialog();

                        var rr = {
                            name: text,
                            id: uuid(),
                            value: [],
                            author: $N.id(),
                            replyTo: [x.id],
                            createdAt: Date.now()
                        };

                        $N.pub(rr, function(err) {
                            $.pnotify({
                                title: 'Error replying (' + x.id.substring(0, 6) + ')',
                                text: err,
                                type: 'Error'
                            })
                        }, function() {
                            $N.notice(rr);
                            $.pnotify({
                                title: 'Replied (' + x.id.substring(0, 6) + ')'
                            })
                        });

                        if (onReplied)
                            onReplied(rr);

                    },
                    //on cancel
                            function() {
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
    if (count == 0)
        return newDiv();


    function newSimilarityList(X) {
        var d = newEle('ul');
        _.each(X.value, function(v) {
            if (v.id == 'similarTo') {
                var stf = v.strength || 1.0;
                var st = parseFloat(stf * 100.0).toFixed(1);
                var o = $N.getObject(v.value);
                var name = o ? o.name : "?";
                var li = $('<li></li>').appendTo(d);
                var lia = $('<a>' + _s(name, 32, true) /*+ ' (' + st + '%) */ + '</a>').appendTo(li);
                li.append('&nbsp;');
                lia.click(function() {
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
                .value(function(d) {
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
        _.each(s, function(v, k) {
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
                .on('click', function(d) {
                    newPopupObjectView(d.id);
                })
                .style("background", function(d) {
                    return color(d.name);
                })
                .text(function(d) {
                    return d.children ? null : d.name;
                });

        d3.selectAll("input").on("change", function change() {
            var value = this.value === "count" ? function() {
                return 1;
            } : function(d) {
                return d.size;
            };

            node
                    .data(treemap.value(value).nodes).call(position);
            /*		  	.transition()
             .duration(1500)
             .call(position);*/
        });

        function position() {
            this.style("left", function(d) {
                return (d.x) + "%";
            })
                    .style("top", function(d) {
                        return (d.y) + "%";
                    })
                    .style("width", function(d) {
                        return d.dx + "%";
                    })
                    .style("height", function(d) {
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
    eb.click(function() {
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
        return false;
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
    var depth = options.depth || depthRemaining;
    var nameClickable = (options.nameClickable != undefined) ? options.nameClickable : true;
    var showAuthorIcon = (options.showAuthorIcon != undefined) ? options.showAuthorIcon : true;
    var showAuthorName = (options.showAuthorName != undefined) ? options.showAuthorName : true;
    var hideAuthorNameAndIconIfZeroDepth = (options.hideAuthorNameAndIconIfZeroDepth != undefined) ? options.hideAuthorNameAndIconIfZeroDepth : false;
    var showMetadataLine = (options.showMetadataLine != undefined) ? options.showMetadataLine : true;
    var showActionPopupButton = (options.showActionPopupButton != undefined) ? options.showActionPopupButton : true;
    var showReplyButton = (options.showReplyButton != undefined) ? options.showReplyButton : true;
    var showSelectionCheck = (options.showSelectionCheck != undefined) ? options.showSelectionCheck : true;
    var titleClickMode = (options.titleClickMode != undefined) ? options.titleClickMode : 'view';
    var showTime = (options.showTime != undefined) ? options.showTime : true;
    var transparent = (options.transparent != undefined) ? options.transparent : false;

    if (!x) {
        return newDiv().html('Object Missing');
    }

    //check for Similarity
    var ot = objTags(x);
    if ((ot[0] === 'Similar') && (ot[1] === 'similarTo')) {
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

            PDFJS.getDocument(pdfPath).then(function(pdf) {
                // Using promise to fetch the page
                pdf.getPage(pdfPage).then(function(page) {
                    var viewport = page.getViewport(1.0);

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



    var mini = (depthRemaining === 0);


    var d = newDiv().attr({
        'xid': x.id,
        'class': 'objectView'
    });

    if (!transparent)
        d.addClass("ui-widget-content ui-corner-all");

    var oStyle = x.style;
    if (scale !== undefined)
        d.attr('style', "font-size:" + ((scale) ? ((0.5 + scale) * 100.0 + '%') : ("100%")) + (oStyle ? '; ' + oStyle : ''));

    var xn = x.name || '';
    var authorID = x.author;

    d.append(cd);


    if ((depth === depthRemaining) && (hideAuthorNameAndIconIfZeroDepth))
        showAuthorName = showAuthorIcon = false;

    if (showAuthorName) {
        if (!isSelfObject(x.id)) { //exclude self objects
            if (x.author) {
                var a = x.author;
                var as = $N.getObject(x.author);
                if (as)
                    a = as.name;
                //else display UID?

                xn = a + ': ' + (xn.length > 0 ? xn : '?');
            }
        }
    }

    var replies;


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

    var haxn = newEle('h1').appendTo(d);

    var refreshReplies = function() {
        var r = $N.getReplies(x.id);
        if (r.length > 0) {
            if (!replies) {
                replies = newDiv().addClass('ObjectReply').appendTo(d);
            }
            else {
                replies.empty();
            }

            var childOptions = _.clone(options);
            childOptions.depthRemaining = depthRemaining - 1;
            childOptions.transparent = true;
            delete childOptions.scale;

            //TODO sort the replies by age, oldest first?
            r.forEach(function(p) {
                replies.append(newObjectSummary($N.getObject(p), childOptions));
            });
        } else {
            if (replies) {
                replies.remove();
                replies = null;
            }
        }
    }

    function addPopupMenu() {
        var ms = $N.myself();
        if (ms && (ms.id === x.author)) {
            var editButton = newEle('button').text('..').attr({
                title: "Edit",
                'class': 'ObjectViewPopupButton'
            })
                    .appendTo(haxn)
                    .click(function() {
                        var windowParent = $(this).parent().parent().parent().parent();
                        if (windowParent.hasClass('ui-dialog-content')) {
                            windowParent.dialog('close');
                        }
                        newPopupObjectEdit(x, true);
                        return false;
                    });
        }

        var popupmenuButton = newEle('button').html('&gt;').attr({
            title: "Actions...",
            'class': 'ObjectViewPopupButton'
        })
                .appendTo(haxn)
                .click(function() {
                    var that = this;

                    if (this.popupmenu) {
                        //click the popup menu button again to disappear an existing menu
                        return closeMenu();
                    }

                    function closeMenu() {
                        that.popupmenu.remove();
                        that.popupmenu = null;
                        return false;
                    }

                    this.popupmenu = newContextMenu([x], true, closeMenu).addClass('ActionMenuPopup');

                    var closeButton = $('<button>Close</button>')
                            .click(closeMenu)
                            .appendTo(this.popupmenu);

                    $(this).after(this.popupmenu);
                    return false;
                });

    }

    if (showActionPopupButton)
        addPopupMenu();

    //Name
    if (!nameClickable) {
        haxn.html(xn);
    } else {
        var xxn = xn.length > 0 ? xn : '?';
        haxn.append(newEle('a').html(xxn).attr('title', x.id).click(function() {
            if ((x.author === $N.id()) && (titleClickMode === 'edit'))
                newPopupObjectEdit(x, true);
            else if (typeof (titleClickMode) === 'function') {
                titleClickMode(x);
            } else {
                newPopupObjectView(x.id, true);
            }
            return false;
        }), '&nbsp;');
    }
    if (selectioncheck)
        haxn.prepend(selectioncheck);


    if (showMetadataLine) {
        var mdl = newMetadataLine(x, showTime).appendTo(d);
        if (showReplyButton) {
            newEle('button').text('Reply').addClass('metadataReplyButton').appendTo(mdl).click(function() {
                newReplyPopup(x, function(rx) {
                    if (options.replyCallback)
                        options.replyCallback(rx);
                });
            });
        }
    }

    //d.append('<h3>Relevance:' + parseInt(r*100.0)   + '%</h3>');


    var nod = newObjectDetails(x);
    if (nod)
        d.append(nod);

    if (!mini) {
        refreshReplies();
    }

    return d;
}

function newObjectDetails(x) {
    var ud = newEle('ul');

    if (x.value) {
        x.value.forEach(function(vv) {

            if (vv.id === 'sketch') {
                var eu = uuid();

                var ee = newDiv(eu).appendTo(ud);

                var options = {
                    width: 250,
                    height: 250,
                    editing: false
                };
                if (vv.value) {
                    options.strokes = JSON.parse(vv.value);
                }
                later(function() {
                    /*var sketchpad =*/ Raphael.sketchpad(eu, options);
                });
                return;
            } else if (vv.id === 'timerange') {
                /*if (ISODateString) {
                 ud.append(ISODateString(new Date(vv.value.start)) + ' '
                 + ISODateString(new Date(vv.value.start)));
                 }
                 else*/
                {
                    //mozilla: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString
                    ud.append(new Date(vv.value.start).toISOString() + ' ' + new Date(vv.value.start).toISOString());
                }
            } else if (vv.id === 'image') {
                var url = vv.value;
                ud.append(newEle('img').attr( { class: "objectViewImg", src: url}), '<br/>');
            } else if (vv.id === 'html') {
                ud.append(newDiv().html(vv.value));            
            } else if (vv.id === 'markdown') {
                ud.append(newDiv().addClass('markdown').html(markdown.toHTML(vv.value)));
            }
            else if ($N.isProperty(vv.id)) {
                var strength = vv.strength || 1.0;

                var pv = newPropertyView(x, vv);
                if (pv) {
                    if (typeof pv === "string")
                        pv = $(pv);

                    pv.appendTo(ud);

                    var opa = 0.5 + (strength / 2.0);
                    if (opa != 1.0)
                        pv.css('opacity', opa);
                }
            }
        });
    }

    if (ud.children().length === 0)
        return null;

    return ud;
}


function withObject(uri, success, failure) {
    $.getJSON('/object/' + uri + '/json', function(s) {

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

    //var ot = objTags(x);
    var ots = objTagStrength(x, false);
    _.each(ots, function(s, t) {
        if ($N.isProperty(t))
            return;

        var tt = $N.getTag(t);
        var taglink = newTagButton(tt || t);
        applyTagStrengthClass(taglink, s);

        mdline.append(taglink, '&nbsp;&nbsp;');
    });

    var spacepoint = objSpacePoint(x);
    if (spacepoint) {
        var lat = _n(spacepoint.lat);
        var lon = _n(spacepoint.lon);
        var mll = objSpacePointLatLng($N.myself());
        var spacelink = newEle('a');
        if (mll) {
            var dist = '?';
            //TODO check planet
            var sx = [spacepoint.lat, spacepoint.lon];
            if (mll)
                dist = geoDist(sx, mll);

            if (dist === 0)
                spacelink.text('[here]');
            else
                spacelink.text('[' + lat + ',' + lon + ':  ' + _n(dist) + ' km away]');
        } else {
            spacelink.text('[' + lat + ',' + lon + ']');
        }
        mdline.append(spacelink, '&nbsp;&nbsp;');
    }

    if (showTime !== false) {
        var ww = objWhen(x);
        if (ww) {
            mdline.append(newEle('a').append($.timeago(new Date(ww))));
        }
    }
    return mdline;
}
