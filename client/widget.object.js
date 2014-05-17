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
        return defaultIcons.unknown;
    } else {
        return defaultIcons[t] || defaultIcons.unknown;
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
        x = $N.object[_x];
    else
        x = _x;

    if (!x) {
        console.log('Unknown object: ' + _x);
        return;
    }

    var d = newPopup(x.name, p);
    var s = newObjectView(x, {
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
            e.append(newObjectView(o, {
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




//(function is globalalized for optimization purposes)
function _onTagButtonClicked() {
    var ti = $(this).attr('taguri');
    var t = $N.class[ti];
    if (t)
        newPopupObjectView(t);
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

    if (!t.id) {
        var to = $N.class[t];
        if (to)
            t = to;
    }
    if (t.id) {
        ti = getTagIcon(t.id);
    }
    if (!ti)
        ti = getTagIcon(null);



    var b;
    if (isButton) {
        b = newEle('button');
    }
    else {
        b = newEle('a');
    }
    
    b.attr({
       class: 'tagLink',
       style: 'background-image: url('+ ti + ')' 
    });
    

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
        b.attr('taguri', t.id || (t + ''));
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


        widgetsToAdd = [];

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
                tt = newTagValueWidget(x, i, t, editable, whenSaved, onAdd, onRemove, onStrengthChange, onOrderChange, whenSliderChange);
                widgetsToAdd.push(tt);
            }
            if (tt !== null) {
                //hide the last tag section's down button
                tt.find('.moveDown').hide();
            }

            var missingProp = [];
            //Add missing required properties, min: >=1 (with their default values) of known objects:

            if (!x.readonly) {
                tags.forEach(function(t) {
                    t = $N.class[t];
                    if (!t)
                        return;

                    var prop = t.property;
                    if (!prop)
                        return;
                    
                    _.each(prop, function(P, pid) {
                        if (P.min)
                            if (P.min > 0)
                                if (!_.contains(tags, pid))
                                    missingProp.push(pid);                        
                    });
                    
                });
            }

            missingProp.forEach(function(p) {
                widgetsToAdd.push(newTagValueWidget(x, i + x.value.length, {
                    id: p
                }, editable, whenSaved, onAdd, onRemove, onStrengthChange, onOrderChange, whenSliderChange));
            });
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
                        ontoSearcher = setInterval(search, configuration.ontologySearchIntervalMS);
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


function newTagValueWidget(x, index, t, editable, whenSaved, onAdd, onRemove, onStrengthChange, onOrderChange, whenSliderChange) {
    var tag = t.id;
    var strength = t.strength;
    if (strength === undefined)
        t.strength = strength = 1.0;

    var events = {
        onSave: whenSaved,
        onAdd: onAdd,
        onRemove: onRemove,
        onStrengthChange: onStrengthChange,
        onOrderChange: onOrderChange,
        onSliderChange: whenSliderChange
    };

    var e = newDiv().addClass('tagSection');
    var d = newDiv().addClass('tagSectionItem').appendTo(e);
    applyTagStrengthClass(e, strength);

    if (editable) {
        if (configuration.device !== configuration.MOBILE) {
            d.hover(function() {
                d.addClass('tagSectionHover');
            }, function() {
                d.removeClass('tagSectionHover');
            });
        }
    }

    var tagLabel = newEle('span').html(tag).addClass('tagLabel');

    var tagIcon = $('<img src="' + getTagIcon(tag) + '"/>');



    d.append(tagLabel);

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
                    if (confirm("Remove " + tag + "?"))
                        onRemove(index);
                });

        d.append(tagButtons);

        //d.hover(function(){ tagButtons.fadeIn(200);}, function() { tagButtons.fadeOut(200);});
        //d.hover(function(){ tagButtons.show();}, function() { tagButtons.hide();});                
        //tagButtons.hide();
    }

    var T = $N.object[tag] || { id: tag };
    var isProp = T._property;
    var isClass = T._class;
    
    var defaultValue = null;

    var type;
    var primitive = false;
    if (isPrimitive(tag)) {
        //tagLabel.hide();    
        type = tag;
        tagLabel.hide();
        primitive = true;
    }

    if (T.name)
        tagLabel.html(T.name);
   
    if (isProp) {
        type = T.extend;

        if (T.default) {
            defaultValue = T.default;
        }
        d.addClass('propertySection');
    }


    //...
    
    if (newTagValueWidget[type]) {
        newTagValueWidget[type](x, index, t, T, editable, d, events);        
    } else if (tag) {
        newTagValueWidget.tag(x, index, t, T, editable, d, events);        
    }    

    if (editable)
        tagIcon.prependTo(tagLabel);
    else if (!primitive)
        tagLabel.append(':&nbsp;');

    if (t.description)
        d.append('<ul>' + t.description + '</ul>');

    return e;
}

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

newTagValueWidget.html = function(x, index, v, prop, editable, d, events) {

    if ((editable) && (!prop.readonly)) {
        //var dd = $('<textarea/>').addClass('tagDescription').appendTo(d);
        var ddi = '_' + uuid();
        var ddt = '_' + uuid();
        
        var toolbar = newDiv().attr('id', ddt).appendTo(d);
        {
            toolbar.append(
                '<select class="sc-size"><option value="75%">Small</option><option value="100%" selected>Normal</option><option value="125%">Large</option><option value="150%">Huge</option></select>',
                '<button class="sc-bold">B</button>',
                '<button class="sc-italic">I</button>',
                '<button class="sc-underline">U</button>',
                '<button class="sc-strike">S</button>',
                '<button class="sc-link">L</button>'
            );
        }
        var dd = newDiv().attr('id', ddi).appendTo(d);
        
        var editor;
        later(function() {
            editor = new Quill('#' + ddi);
            editor.addModule('toolbar', {
                container: '#' + ddt     // Selector for toolbar container
            });

            if (prop.description)
                dd.attr('placeholder', prop.description);

            if (v.value)
                editor.setHTML(v.value);
            else if (prop.default)
                editor.setHTML(prop.default);

            //freetileView();
        })

        events.onSave.push(function(y) {
            //objAddValue(y, prop.id, dd.val(), v.strength);
            var h = editor ? editor.getHTML() : '';
            var hd = newDiv().html(h);
            hd.find('p').removeAttr('class').removeAttr('id');
            h = hd.html();
            objAddValue(y, prop.id, h, v.strength);
            hd.remove();
        });
    } else {
        if (v.value)
            d.append( newDiv().addClass('htmlview').html(v.value) );
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


            var pdw = newDiv().addClass('tagSuggestionsWrap').appendTo(d);
            var pd = newDiv().addClass('tagSuggestions').appendTo(pdw);

            var pp = TAG.property;
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
            });

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
            var dd = newEle('span').appendTo(d);
            if (v.value) {
                var valstring;

                if (v.value.unit) {
                    //number and unit were both stored in a JSON object
                    valstring = v.value.number + ' ' + v.value.unit;
                } else {
                    //only the number was present
                    valstring = v.value;
                }

                dd.html(valstring);
            }
        }
    }

};
newTagValueWidget.spacepoint = function(x, index, v, prop, editable, d, events) {

    var m;
    var ee = newDiv().appendTo(d);
    
    function showMap() {

        var de = uuid();

        var dd = newDiv().addClass('focusMap').appendTo(ee).attr('id', de);

        later(function() {
            var lat = v.value.lat || configuration.mapDefaultLocation[0];
            var lon = v.value.lon || configuration.mapDefaultLocation[1];
            var zoom = v.value.zoom;
            m = initLocationChooserMap(de, [lat, lon], zoom);
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
            var sl = newSpaceLink(v.value).appendTo(d).click(function() {
                if (!mapVisible) {
                    showMap();
                    later(freetileView);
                }
                else {
                    ee.empty();
                    later(freetileView);
                }
                mapVisible = !mapVisible;
            });
        }
        else {
            d.append('Unknown');
        }
    }

};

newTagValueWidget.timepoint = function(x, index, v, prop, editable, d, events) {
    if (editable) {
        var lr = $('<input type="text" placeholder="Time" />').appendTo(d)
                    .val(new Date(v.at));
        var lb = $('<button style="margin-top: -0.5em"><i class="icon-calendar"/></button>').appendTo(d);
        
        //TODO add 'Now' button

        //TODO add save function
    } else {
        d.append(newEle('a').append($.timeago(new Date(v.at))));
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
    var eu = uuid();
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
        
newTagValueWidget.timerange = function(x, index, t, prop, editable, d, events) {
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

newTagValueWidget.object = function(x, index, t, prop, editable, d, events) {

    if (editable) {
        var tt = $('<span></span>');
        var ts = $('<input></input>').css('margin-right', '0').attr('readonly', 'readonly').appendTo(tt);
        
        var value = t.value;

        function updateTS(x) {
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
            if (typeof tagRestrictions === "string")
                tagRestrictions = [tagRestrictions];

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
                    tnames.push(T.name);
                    if (!T)
                        return;
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
        if (t.value)
            var V = $N.object[t.value];
            d.append(newEle('a').html( (V) ? (V.name || V.id) : '?' ).click(function() {
                newPopupObjectView(t.value);
            }));
    }
};

newTagValueWidget.timeseries = function(x, index, v, prop, editable, d, events) {
    d.append('<textarea>' + JSON.stringify(vv.value) + '</textarea>');
};

newTagValueWidget.cortexit = function(x, index, v, prop, editable, d, events) {
    //TODO
};



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
                //$N.notice(rr);
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


//static global functions for optimization
function _refreshActionContext() {
    refreshActionContext();
    return true;
}
function _objectViewEdit() {
    var xid = $(this).parent().parent().attr('xid');
    var x = $N.object[xid];
    var windowParent = $(this).parent().parent().parent().parent();
    if (windowParent.hasClass('ui-dialog-content')) {
        windowParent.dialog('close');
    }
    newPopupObjectEdit(x, true);
    return false;
};

function _objectViewContext() {
    var that = $(this);
    var xid = $(this).parent().parent().attr('xid');
    var x = $N.object[xid];

    if (that.popupmenu) {
        //click the popup menu button again to disappear an existing menu
        return closeMenu();
    }

    var popupmenu = that.popupmenu = newContextMenu([x], true, closeMenu).addClass('ActionMenuPopup');

    function closeMenu() {
        popupmenu.remove();
        that.popupmenu = null;
        return false;
    }


    var closeButton = $('<button>Close</button>')
            .click(closeMenu)
            .appendTo(that.popupmenu);

    $(this).after(that.popupmenu);
    return false;
};

/**
 produces a self-contained widget representing a nobject (x) to a finite depth. activates all necessary renderers to make it presented
 */
function newObjectView(x, options) {
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
    /*
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
    }*/



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
    if (x._class)
        xn += ' (tag)';
    if (x._property)
        xn += ' (property)';
    
    var authorID = x.author;

    //d.append(cd);


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
        var r = x.reply; //$N.getReplies(x);
        if (r) {
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
            _.values(r).forEach(function(p) {
                replies.append(newObjectView(p, childOptions));
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
                class: 'ObjectViewPopupButton'
            }).appendTo(haxn).click(_objectViewEdit);                    
        }

        var popupmenuButton = newEle('button').html('&gt;').attr({
            title: "Actions...",
            class: 'ObjectViewPopupButton'
        }).appendTo(haxn).click(_objectViewContext);
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


    //var nod = newObjectDetails(x);
    //if (nod)
        //d.append(nod);

    addNewObjectDetails(x, d);
    

    if (!mini) {
        refreshReplies();
    }

    return d;
}

function addNewObjectDetails(x, d) {
    if (x.value) {
        for (var i = 0; i < x.value.length; i++) {
            var t = x.value[i];

            if ($N.class[t.id])
                continue;   //classes are already shown in metadata line
            if (!$N.property[t.id] && !isPrimitive(t.id))
                continue;   //non-property tags are like classes, shown in metadata line

            tt = newTagValueWidget(x, i, t, false);
            d.append(tt);
        }
    }
}


function newSpaceLink(spacepoint) {
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
            spacelink.text('[ Here ]');
        else
            spacelink.text('[' + lat + ',' + lon + ':  ' + _n(dist) + ' km away]');
    } else {
        spacelink.text('[' + lat + ',' + lon + ']');
    }            
    return spacelink;
}


/*
function ISODateString(d) {
    function pad(n) {
        return n < 10 ? '0' + n : n;
    }
    return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()) + 'T' + pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()) + ':' + pad(d.getUTCSeconds()) + 'Z';
}
*/

function newMetadataLine(x, showTime) {
    var mdline = newDiv().addClass('MetadataLine');

    var ots = objTagStrength(x, false);
    _.each(ots, function(s, t) {
        if ($N.property[t])
            return;

        var tt = $N.class[t];
        var taglink = newTagButton(tt || t);
        applyTagStrengthClass(taglink, s);

        mdline.append(taglink, '&nbsp;');
    });

    var spacepoint = objSpacePoint(x);
    if (spacepoint) {       
        mdline.append(newSpaceLink(spacepoint), '&nbsp;');
    }

    if (showTime !== false) {
        var ww = objWhen(x);
        if (ww) {
            mdline.append(newEle('a').append($.timeago(new Date(ww))));
        }
    }
    return mdline;
}
