"use strict";


function newPopupObjectEdit(n, p) {
    var e = newObjectEdit(n, true);
    var p = newPopup('Edit', p).append(e);

	/*
	var nameInput = e.find('.nameInput').detach();
	//hack to make the text input functional above the dialog's original draggable title area
	nameInput.css('z-index', '10').css('width', '90%').css('position', 'absolute').css('margin', '5px');
	p.parent().prepend(nameInput);
	p.draggable({ handle: ".ui-dialog-titlebar" });
	*/

    return e;
}

function newPopupObjectView(_x, p, ovParams) {
    var x;
    if (typeof (_x) == 'string')
        x = $N.object[_x];
    else
        x = _x;

    if (!x) {
        console.log('Unknown object: ' + _x);
        return;
    }

    if (ovParams === undefined) {
        ovParams = {
            depthRemaining: 4,
            nameClickable: false
        };
    }

    var d = newPopup(x.name, p);
    var s = newObjectView(x, ovParams);
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
        if (typeof i === 'string')
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
    return newPopup(displayedObjects + ' Object' + ((displayedObjects > 1) ? 's' : ''), true).append(e);

}


function newAvatarImage(s) {
    return newDiv().attr({
        'class': 'AvatarIcon',
        'style': 'background-image:url(' + getAvatarURL(s) + ')',
        'title': (s ? s.name : '')
    });
}




//(function is globalalized for optimization purposes)
function _onTagButtonClicked() {
    var ti = $(this).attr('taguri');
    var t = $N.class[ti] || $N.instance[ti];
    if (t)
        newPopupObjectView(t, true);
    return false;
}


function newTagImage(ti) {
    return newEle('img').attr({
        'src': ti,
        'class': 'TagButtonIcon'
    });
}

function newTagButton(t, onClicked, isButton, dom) {
    var ti = null;

    if (t) {
        if (!t.id) {
            var to = $N.class[t];
            if (to)
                t = to;
			else {
				//try if instance
				var tii = $N.instance[t];
				if (tii)
					t = tii;
			}
        }
        if (t.id) {
            ti = getTagIcon(t.id);
        }
    }
    if (!ti)
        ti = getTagIcon(null);

    var b;
    if (isButton) {
        b = newEle('button', true);
    }
    else {
        b = newEle('a', true);
    }

    b.setAttribute('class', 'tagLink');
    b.style.backgroundImage = 'url(' + ti + ')';

    if (t && (t.name)) {
        b.innerHTML = t.name || t.id;
        b.setAttribute('taguri', t.id || (t + ''));
    }
    else if (t) {
        b.innerHTML = t.id || t;
    }

    if (!onClicked)
        onClicked = _onTagButtonClicked;

    b.onclick = onClicked;

    if (dom)
        return b;
    return $(b);
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
 *  TODO - use a parameter object like newObjectView
 */
function newObjectEdit(ix, editable, hideWidgets, onTagRemove, whenSliderChange, excludeTags, onNameEdit) {
    if (typeof ix === 'string')
        ix = $N.instance[ix];

    var D = newDiv().addClass('ObjectEditDiv');
    var headerTagButtons = ix.tagSuggestions || [];
    var ontocache = {};

    function update(x) {
        var widgetsToAdd = [];

        var whenSaved = [];
        var nameInput = null, tagInput = null;

        function getEditedFocus() {
            if (!editable)
                return x;

            var na = nameInput ? nameInput.val() : '';

            var n = objNew(x.id, na);
            n.createdAt = x.createdAt;
            n.author = x.author;

            //copy all metadata

            if (x.subject)
                n.subject = x.subject;
            if (x.when) n.when = x.when;
            if (x.duration) n.duration = x.duration;
            if (x.expiresAt)
                n.expiresAt = x.expiresAt;
            if (x.replyTo)
                n.replyTo = x.replyTo;
            if (x.in) n.in = x.in;
            if (x.out) n.out = x.out;
            if (x.with) n.with = x.with;
            if (x.inout)
                n.inout = x.inout;

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
        var onChange = function(i, newValue) {
            var f = getEditedFocus();
            f.value[i] = newValue;
            update(f);
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

            if ((x.name) || (hideWidgets !== true)) {
                nameInput = $('<input type="text"/>').attr('placeholder', 'Title').attr('x-webkit-speech', 'x-webkit-speech').addClass('form-control input-lg nameInput nameInputWide');
                nameInput.val(x.name === true ? '' : x.name);
                widgetsToAdd.push(nameInput);
                if (onNameEdit) {
                    //nameInput.keyup(onNameEdit);
                    nameInput.change(onNameEdit);
                    nameInput.keyup(function(e) {
                        if (e.keyCode == 13)
                            onNameEdit.apply($(this));
                    });
                }
            }

            if (hideWidgets !== true) {
                tagInput = $('<input name="tags" class="tags"/>');
                //$('#tags').importTags('foo,bar,baz');
                //$('#tags').addTag('foo');

                var tagSearchCache = { };
                var addedTags = {};

                later(function() {
                    tagInput.tagsInput({
                        // https://github.com/xoxco/jQuery-Tags-Input#options
                        defaultText: 'Tag..',
                        minChars: 2,
                        width: 'auto',
                        height: 'auto',
                        onAddTag: function(t) {
                            //addedTags[t] = true;
                            update(objAddTag(getEditedFocus(), t));
                        },
                        onRemoveTag: function(t) {
                            delete addedTags[t];
                        },

                        //autocomplete_url: 'http://missingajax',
                        autocomplete: {
                            selectFirst: true,
                            width: '100px',
                            autoFill: true,
                            //source: ['this','real','tags'],
                            source: function(request, response ) {
                                    var term = request.term;
                                    var results = $N.searchOntology(term, tagSearchCache);
                                    results = results.map(function(r) {
                                        var x = { };
                                        x.value = r[0];
                                        var rclass = $N.class[r[0]];
                                        if (rclass)
                                            x.label = rclass.name;
                                        else
                                            x.label = r[0];
                                        return x;
                                    });
                                    response(results);
                              },
							create: function() {
								tagInput.next().find('input').addClass('form-control');
								tagInput.next().css('border', '0');
								tagInput.next().find().css('border', '0');
							}

                        }
                        /*onChange: function(elem, elem_tags) {
                                var languages = ['php','ruby','javascript'];
                                $(tagInput, elem_tags).each(function() {
                                    if($(this).text().search(new RegExp('\\b(' + languages.join('|') + ')\\b')) >= 0)
                                            $(this).css('background-color', 'yellow');
                                });
                        }*/
                        //autocomplete: { }
                        //autocomplete_url:'test/fake_json_endpoint.html' // jquery ui autocomplete requires a json endpoint
                    });

                });


                whenSaved.push(function(y) {
                    objName(y, nameInput.val());

                    for (var i in addedTags) {
                        objAddTag(y, i);
                    }
                    addedTags = { };
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

        var tsw = $('<div class="tagSuggestionsWrap mainTagSuggestions"></div>');
        widgetsToAdd.push(tsw);

        var ts = $('<div/>').addClass('tagSuggestions').appendTo(tsw);

        //widgetsToAdd.push(newEle('div').append('&nbsp;').attr('style','height:1em;clear:both'));


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
            var menuWrap = newDiv().addClass('nav');


            var addButtons = newEle('span').appendTo(menuWrap);

            var whatButton = $('<button title="What?"><i class="fa fa-plus-square"/></button>').click(function() {
				var p;
				var taggerOptions;
					p = newPopup('Select Tags', true, true);
					taggerOptions = [];

				var tagger = newTagger(taggerOptions, function(t) {
                    var y = getEditedFocus();
                    for (var i = 0; i < t.length; i++) {
                        var T = $N.getTag(t[i]);
                        if ((T) && (T.reserved)) {
                            notify('Tag "' + T.name + '" can not be added to objects.');
                        } else {
                            y = objAddTag(y, t[i]);
						}
                    }
                    update(y);

					if (p && p.dialog) p.dialog('close');
                });


				p.append(tagger);

            });

            var howButton = $('<button title="How/Why?" id="AddDescriptionButton"><i class="fa fa-edit"/></button>').click(function() {
                update(objAddValue(getEditedFocus(), 'html', ''));
            });

            var whenButton = $('<button title="When?" id="AddWhenButton" ><i class="fa fa-clock-o"/></button>').click(function() {
                update(objAddValue(getEditedFocus(), 'timepoint', ''));
            });

            var whereButton = $('<button title="Where?"><i class="fa fa-map-marker"/></button>').click(function() {
                update(objAddValue(getEditedFocus(), 'spacepoint', {}));
            });

            var whoButton = $('<button disabled title="Who?" id="AddWhoButton"><i class="fa fa-user"/></button>');

            var drawButton = $('<button title="Draw"><i class="fa fa-pencil"/></button>').click(function() {
                update(objAddValue(getEditedFocus(), 'sketch', ''));
            });

            var webcamButton = $('<button title="Webcam"><i class="fa fa-camera"/></button>').click(function() {
                newWebcamWindow(function(imgURL) {
                    update(objAddValue(getEditedFocus(), 'image', imgURL));
                });
            });

            var uploadButton = $('<button title="Add Media (Upload or Link)"><i class="fa fa-file-picture-o"/></button>').click(function() {


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
                    width: '50%'
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
 			addButtons.find('button').addClass('btn btn-default');

            D.prepend(menuWrap);



            var scopeSelect = null;
            if (!objHasTag(getEditedFocus(), 'User')) {
                scopeSelect = $('<select class="form-control" style="width:auto;float:right"/>').append(
                        //store on server but only for me
                        '<option value="2">Private</option>',
                        //store on server but share with who i follow
                        '<option value="5">Trusted</option>',
                        //store on server for public access (inter-server)
                        '<option value="7">Public</option>',
                        '<option value="7a">Anonymous</option>',
                        '<option value="8">Advertise</option>').
						val(getEditedFocus().scope);

                /*if (configuration.connection == 'static')
                    scopeSelect.attr('disabled', 'disabled');
                else {*/
                    scopeSelect.change(function() {
                        var e = getEditedFocus();
                        e.scope = scopeSelect.val();
                        update(e);
                    });
                //}
            }

            var saveButton = $('<button class="btn btn-primary" style="float:right"><b>Save</b></button>').click(function() {

                var e = getEditedFocus();

                if (e.scope === '7a') {
                    e.scope = 7;
                }
                else {
                    e.author = $N.id();
                }

                e.scope = parseInt(e.scope);

                objTouch(e);

                $N.pub(e, function(err) {
                    notify({
                        title: 'Unable to save.',
                        text: x.name,
                        type: 'Error'
                    });
                }, function() {
                    notify({
                        title: 'Saved (' + x.id.substring(0, 6) + ')'
                                //text: '<button disabled>Goto: ' + x.name + '</button>'  //TODO button to view object
                    });
                });
                D.parent().dialog('close');
            });

			var mwb = newDiv().css('float', 'right');
            mwb.append(saveButton);
            if (scopeSelect) mwb.append(scopeSelect);
			if (tagInput)	mwb.append(tagInput);

			menuWrap.append(mwb);

        }

        if (x.value) {
            var tags = []; //tags & properties, actually

            var tt = null;
            for (var i = 0; i < x.value.length; i++) {
                var t = x.value[i];

                if (excludeTags)
                    if (_.contains(excludeTags, t.id))
                        continue;

                tags.push(t.id);
                tt = newTagValueWidget(x, i, t, editable, whenSaved, onAdd, onRemove, onChange, onStrengthChange, onOrderChange, whenSliderChange);
                widgetsToAdd.push(tt);
            }
            if (tt !== null) {
                //hide the last tag section's down button
                tt.find('.moveDown').hide();
            }

            var missingProp = [];
            //Add missing required properties, min: >=1 (with their default values) of known objects:

            if (!x.readonly) {
                for (var i = 0; i < tags.length; i++) {
                    var t = $N.class[tags[i]];
                    if (!t)
                        continue;

                    var prop = t.property;
                    if (!prop)
                        continue;

                    _.each(prop, function(P, pid) {
                        if (P.min)
                            if (P.min > 0)
                                if (!_.contains(tags, pid))
                                    missingProp.push(pid);
                    });

                }
            }

            missingProp.forEach(function(p) {
                widgetsToAdd.push(newTagValueWidget(x, i + x.value.length, {
                    id: p
                }, editable, whenSaved, onAdd, onRemove, onChange, onStrengthChange, onOrderChange, whenSliderChange));
            });
        }


        D.append(widgetsToAdd);
    }

    update(ix);


    return D;
}

function getTagStrengthClass(s) {
    if (s === 0.0)
        return 'tag0';
    else if (s <= 0.25)
        return 'tag25';
    else if (s <= 0.50)
        return 'tag50';
    else if (s <= 0.75)
        return 'tag75';
    else
        return 'tag100';
}

function applyTagStrengthClass(e, s) {
    e.addClass(getTagStrengthClass(s));
}





function newReplyPopup(x, onReplied) {
    x = $N.instance[x];

    var pp = newPopup('Reply to: ' + x.name);

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
                notify({
                    title: 'Error replying (' + x.id.substring(0, 6) + ')',
                    text: err,
                    type: 'Error'
                });
            }, function() {
                //$N.notice(rr);
                notify({
                    title: 'Replied (' + x.id.substring(0, 6) + ')'
                });
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
        if (v.id === 'similarTo') {
            s[v.value] = v.strength || 1.0;
            count++;
        }
    }
    if (count === 0)
        return newDiv();


    function newSimilarityList(X) {
        var d = newEle('ul');
        _.each(X.value, function(v) {
            if (v.id == 'similarTo') {
                var stf = v.strength || 1.0;
                var st = parseFloat(stf * 100.0).toFixed(1);
                var o = $N.getObject(v.value);
                var name = o ? o.name : '?';
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
        var d = newDiv().css('clear', 'both');

        var width = 100;
        var height = 100;

        var treemap = d3.layout.treemap()
                .size([width, height])
                //.sticky(true)
                .value(function(d) {
                    return d.size;
                });

        var div = d3.selectAll(d.toArray())
                .style('position', 'relative')
                .style('width', (width) + '%')
                .style('height', '10em')
                .style('left', 0 + 'px')
                .style('top', 0 + 'px');

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

        var node = div.datum(data).selectAll('.node')
                .data(treemap.nodes)
                .enter().append('div')
                .attr('class', 'node')
                .style('position', 'absolute')
                .style('border', '1px solid gray')
                .style('overflow', 'hidden')
                .style('cursor', 'crosshair')
                .style('text-align', 'center')
                .call(position)
                .on('click', function(d) {
                    newPopupObjectView(d.id);
                })
                .style('background', function(d) {
                    return color(d.name);
                })
                .text(function(d) {
                    return d.children ? null : d.name;
                });

        d3.selectAll('input').on('change', function change() {
            var value = this.value === 'count' ? function() {
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
            this.style('left', function(d) {
                return (d.x) + '%';
            })
                    .style('top', function(d) {
                        return (d.y) + '%';
                    })
                    .style('width', function(d) {
                        return d.dx + '%';
                    })
                    .style('height', function(d) {
                        return d.dy + '%';
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
        reflowView();
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
}

function _objectViewContext() {
    var that = $(this);
    var xid = $(this).parent().parent().attr('xid');
    var x = $N.object[xid];

    //click the popup menu button again to disappear an existing menu
    if (that.parent().find('.ActionMenu').length > 0)
        return closeMenu();

    var popupmenu = that.popupmenu = newContextMenu([x], true, closeMenu).addClass('ActionMenuPopup');

    function closeMenu() {
        that.parent().find('.ActionMenu').remove();
        return false;
    }


    var closeButton = $('<button>Close</button>')
            .click(closeMenu)
            .appendTo(that.popupmenu);

    $(this).after(that.popupmenu);
    return false;
}

function _addObjectViewPopupMenu(authored, target) {
    if (authored) {
        newEle('button').text('+').attr({
            title: 'Edit',
            class: 'ObjectViewPopupButton'
        }).click(_objectViewEdit).appendTo(target);
    }

    newEle('button').html('&gt;').attr({
        title: 'Actions...',
        class: 'ObjectViewPopupButton'
    }).appendTo(target).click(_objectViewContext);
}


var subjectTag = {
    'Like': { objSuffix: '_Likes', objTag: 'Value', objProperty: 'value', objName: 'Likes' },
    'Dislike': { objSuffix: '_Dislikes', objTag: 'Not', objProperty: 'not', objName: 'Dislikes'},
    'Trust': { objSuffix: '_Trusts', objTag: 'Trust', objProperty: 'trust', objName: 'Trusts' }
};

function _newSubjectTagButtonClick() {
    var data = $(this).data();

    var x = $N.instance[$(this).parent().parent().attr('xid')];
    if (!x) return;
    x = x.id;

    var defaultLikesID = $N.id() + data.objSuffix;
    var defaultLikes = $N.instance[defaultLikesID];

    if (!defaultLikes) {
        defaultLikes = new $N.nobject(defaultLikesID, data.objName, data.objTag);
        defaultLikes.author = defaultLikes.subject = $N.id();
		defaultLikes.add(data.objProperty, x);
    }
    else {
        //TODO use getObject if it will return a nobject object
        defaultLikes = new $N.nobject(defaultLikes); //wrap it
        defaultLikes.add(data.objProperty, x);
        defaultLikes.touch();
    }

    $N.pub(defaultLikes, null, function(x) {
		notify({
			title: data.objTag,
			text: 'Saved'
		});
	});

    return false;
}

function newSubjectTagButton(buttonTitle, icon, params) {
    return newEle('a').attr('title', buttonTitle)
			.html('<i class="fa ' + icon + '"></i>')
            .data(params)
            .click(_newSubjectTagButtonClick);
}

/**
 produces a self-contained widget representing a nobject (x) to a finite depth. activates all necessary renderers to make it presented
 */
function newObjectView(x, options) {
    if (!options)
        options = {};

    //var onRemoved = options.onRemoved;
    var scale = options.scale;
    var depthRemaining = options.depthRemaining || 1;
    var depth = options.depth || depthRemaining;
    var nameClickable = (options.nameClickable !== undefined) ? options.nameClickable : true;
    var showName = (options.showName !== undefined) ? options.showName : true;
    var showAuthorIcon = (options.showAuthorIcon !== undefined) ? options.showAuthorIcon : true;
    var showAuthorName = (options.showAuthorName !== undefined) ? options.showAuthorName : true;
    var hideAuthorNameAndIconIfZeroDepth = (options.hideAuthorNameAndIconIfZeroDepth !== undefined) ? options.hideAuthorNameAndIconIfZeroDepth : false;
    var showMetadataLine = (options.showMetadataLine !== undefined) ? options.showMetadataLine : true;
    var showActionPopupButton = (options.showActionPopupButton !== undefined) ? options.showActionPopupButton : true;
    var showReplyButton = (options.showReplyButton !== undefined) ? options.showReplyButton : true;
    var showSelectionCheck = (options.showSelectionCheck !== undefined) ? options.showSelectionCheck : true;
    var titleClickMode = (options.titleClickMode !== undefined) ? options.titleClickMode : 'view';
    var showTime = (options.showTime !== undefined) ? options.showTime : true;
    var transparent = (options.transparent !== undefined) ? options.transparent : false;
    var xid = x.id;
    var replyCallback = options.replyCallback ? function(rx) { options.replyCallback(rx); } : null;
    var startMinimized = (options.startMinimized != undefined) ? options.startMinimized : false;

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
        var ee = duid();
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


    var d = newDiv().attr({
        'xid': xid,
        'class': 'objectView'
    });

    if (!transparent)
        d.addClass('ui-widget-content ui-corner-all');

    var oStyle = x.style;
    if (scale !== undefined)
        d.attr('style', 'font-size:' + ((scale) ? ((0.5 + scale) * 100.0 + '%') : ('100%')) + (oStyle ? '; ' + oStyle : ''));

    var xn = x.name || '';
    if (x._class)
        xn += ' (tag)';
    if (x._property)
        xn += ' (property)';

    var authorID = x.author;

    //d.append(cd);


        //showAuthorName = showAuthorIcon = false;

    var replies;

    if (showAuthorIcon) {
        if (!((depth === depthRemaining) && (hideAuthorNameAndIconIfZeroDepth))) {

            var authorClient = $N.getObject(authorID);
            if (authorClient) {
                if (authorID) {
                    newAvatarImage(authorClient).appendTo(d);
                }
            }
        }
    }



    function minimize() {
        d.addClass('ObjectViewMinimized');
        d.removeClass('ObjectViewMaximized');
    }

    function maximize() {
        d.removeClass('ObjectViewMinimized');
        d.addClass('ObjectViewMaximized');
        ensureMaximized();
    }

    function toggleMaxMin() {
        if (d.hasClass('ObjectViewMinimized'))
            maximize();
        else
            minimize();
        reflowView();
        return false;
    }


    //Name
    if (showName) {

        var haxn = newEle('div').addClass('TitleLine').appendTo(d);
        if (startMinimized)
            haxn.click(toggleMaxMin);

        var xxn = xn.length > 0 ? xn : '?';
        var xauthor = x.author;

        if (!nameClickable) {
            haxn.append(xxn);
        } else {
            haxn.append(newEle('a').html(xxn).click(function() {
                if ((xauthor === $N.id()) && (titleClickMode === 'edit'))
                    newPopupObjectEdit(xid, true);
                else if (typeof (titleClickMode) === 'function') {
                    titleClickMode(xid);
                } else {
                    newPopupObjectView(xid, true);
                }
                return false;
            }));
        }

        if (showAuthorName && (!((depth === depthRemaining) && (hideAuthorNameAndIconIfZeroDepth)))) {
            if (!isSelfObject(x.id)) { //exclude self objects
                if (x.author) {
                    var a = x.author;
                    var ai = $N.instance[a];
                    var an = ai ? ai.name || a : a;

                    if (!nameClickable) {
                        haxn.prepend(an, ': ');
                    } else {
                        haxn.prepend(newEle('a').html(an).click(function() {
                            newPopupObjectView(a, true);
                            return false;
                        }), ':&nbsp;');
                    }
                }
            }
        }
    }

    var maximized = false;

    function ensureMaximized() {
        if (maximized)
            return;

        maximized = true;

        if (replies)
            replies.detach();

        //Selection Checkbox
        var selectioncheck = null;
        if (showSelectionCheck) {
            selectioncheck = newEle('input').attr({
                'type': 'checkbox',
                'class': 'ObjectSelection'
            }).click(_refreshActionContext);
        }

        var buttons = newDiv().attr('class', 'tagButtons ObjectViewButtons').prependTo(d);

        if (showActionPopupButton)
            _addObjectViewPopupMenu($N.id() === x.author, buttons);

        if (selectioncheck)
            buttons.prepend(selectioncheck);


        if ((showMetadataLine) && (!x._class) && (!x._property)) {
            var mdl = newMetadataLine(x, showTime).appendTo(d);

            if (showReplyButton && (x.id !== $N.id())) {
                mdl.append(
					' ',
					newEle('a').html('<i class="fa fa-mail-reply"></i>').attr('title', 'Reply').click(function() {
                    	newReplyPopup(xid, replyCallback);
                    	return false;
                	}),
					' ',
                    newSubjectTagButton('Like', 'fa-thumbs-o-up', subjectTag.Like),
					' ',
                    newSubjectTagButton('Dislike', 'fa-thumbs-o-down', subjectTag.Dislike),
					' ',
                    newSubjectTagButton('Trust', 'fa-check', subjectTag.Trust)
                );
            }
        }

        //d.append('<h3>Relevance:' + parseInt(r*100.0)   + '%</h3>');


        //var nod = newObjectDetails(x);
        //if (nod)
            //d.append(nod);

        addNewObjectDetails(x, d, showMetadataLine ? ['spacepoint'] : undefined);

        if (replies)
            replies.appendTo(d);

    }

    var r = x.reply;
    if (r) {
        var vr = _.values(r);

        if (vr.length > 0) {
            if (!replies) {
                replies = newDiv().appendTo(d);
                if (!hideAuthorNameAndIconIfZeroDepth)
                    replies.addClass('ObjectReply');
                else
                    replies.addClass('ObjectReplyChatZeroDepth');
            }
            else {
                replies.empty();
            }
            if (depthRemaining > 0) {
                var childOptions = _.clone(options);
                childOptions.depthRemaining = depthRemaining - 1;
                childOptions.transparent = true;
                childOptions.hideAuthorNameAndIconIfZeroDepth = false;
                delete childOptions.scale;

                //TODO sort the replies by age, oldest first?
                vr.forEach(function(p) {
                    replies.append(newObjectView(p, childOptions));
                });
            }
            else {
                replies.append(vr.length + ' replies...');
            }
        }
    } else {
        if (replies) {
            replies.remove();
            replies = null;
        }
    }


    if (startMinimized) {
        minimize();
    }
    else {
        maximize();
    }

    return d;
}

function addNewObjectDetails(x, d, excludeTags) {
    if (x.value) {
        for (var i = 0; i < x.value.length; i++) {
            var t = x.value[i];

            if (excludeTags)
                if (excludeTags.indexOf(t.id) !== -1)
                    continue;

            if (x._class) {
                t = $N.object[t];
            }
            else {
                if ($N.class[t.id])
                    continue;   //classes are already shown in metadata line
                if (!$N.property[t.id] && !isPrimitive(t.id))
                    continue;   //non-property tags are like classes, shown in metadata line
            }

            d.append(newTagValueWidget(x, i, t, false));
        }
    }
}


function newSpaceLink(spacepoint) {
    var lat = _n(spacepoint.lat);
    var lon = _n(spacepoint.lon);
    var mll = objSpacePointLatLng($N.myself());

    var spacelink = newEle('a', true);

    var text = '';
    if (mll) {
        var dist = '?';
        //TODO check planet
        var sx = [spacepoint.lat, spacepoint.lon];
        if (mll)
            dist = geoDist(sx, mll);

        if (dist === 0)
            text = ('[ Here ]');
        else
            text = ('[' + _n(lat, 2) + ',' + _n(lon, 2) + ':  ' + _n(dist) + ' km away]');
    } else {
        text = ('[' + _n(lat, 2) + ',' + _n(lon, 2) + ']');
    }

    spacelink.innerHTML = text;

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

    var e = [];

    var ots = objTagStrength(x, false);
    for (var t in ots) {
        var s = ots[t];
        if ($N.property[t])
            continue;

        var tt = $N.class[t];

        var taglink = newTagButton(tt || t, false, undefined, true);
        taglink.classList.add(getTagStrengthClass(s));

        e.push(taglink);
        e.push(' ');
    }

    var spacepoint = objSpacePoint(x);
    if (spacepoint) {
        e.push(newSpaceLink(spacepoint));
        e.push(' ');
    }

    if (showTime !== false) {
        var ww = objWhen(x);
        if (ww) {
            //e.push(newEle('a').append($.timeago(new Date(ww))));
            e.push($.timeago(new Date(ww)));
        }
    }

    var numIn = $N.dgraph.inEdges(x.id);
    var numOut = $N.dgraph.outEdges(x.id);
    if ((numIn.length > 0) || (numOut.length > 0)) {
        e.push(' ');
    }

    if (numIn.length > 0) {
        e.push(newA('&Larr;' + numIn.length, 'In links'));
    }

    if (numOut.length > 0) {
        if (numIn.length > 0)
            e.push('|');
        e.push(newA(numOut.length + '&Rarr;', 'Out links'));
    }

    mdline.append(e);
    return mdline;
}

function newA(html, title, func) {
    var n = newEle('a', true);
    if (html)
    n.innerHTML = html;
    if (title)
        n.setAttribute('title', title);
    if (func)
        n.onclick = func;
    return n;
}
