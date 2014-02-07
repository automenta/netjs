/* version 1.1 5-26-2013 */
var ONTO_SEARCH_PERIOD_MS = 1500; //TODO move this to client.js

//t is either a tag ID, or an object with zero or more tags
function getTagIcon(t) {

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
    }
    else {
        return defaultIcons[t];
    }
}



function newPopupObjectView(_x) {
    var x;
    if (typeof (_x) == "string")
        x = $N.getObject(_x);
    else
        x = _x;

    if (!x) {
        console.log('Unknown object: ' + _x);
        return;
    }

    var d = newPopup(x.name);
    d.append(newObjectSummary(x, {
		depthRemaining: 4
	}));
    return d;

}

function newPopupObjectViews(objectIDs) {
	if (objectIDs.length == 0)
		return;
	if (objectIDs.length == 1)
		return newPopupObjectView(objectIDs[0]);

	var objects = objectIDs.map(function(i) {
		return $N.getObject(i);
	});

    var d = newPopup(objects.length + " Objects");
	_.each(objects, function(o) {
		d.append(newObjectSummary(o, {
			depthRemaining: 0
		}));
	});
    return d;

}


function getAvatar(s) {
    var e = '';
    if (s)
        if (s.email)
            e = s.email;
    var emailHash = MD5(e);
    return $("<img>").attr("src", "http://www.gravatar.com/avatar/" + emailHash);
}

function getAvatarURL(email) {
    if (!email) {
        return configuration.defaultAvatarIcon;
    }
    return "http://www.gravatar.com/avatar/" + MD5(email);
}

function newTagButton(t, onClicked) {
    var ti = null;

    if (!t.uri) {
        var tagObject = $N.getTag(t);
        if (tagObject)
            t = tagObject;
    }
    if (t.uri) {
        ti = getTagIcon(t.uri);
    }

    var i = null;
    if (ti != null) {
        i = $(document.createElement('img')).attr('src', ti).attr('class', 'TagButtonIcon');
    }

    var b = $(document.createElement('a')).attr('href', '#');
    if (i)
        b.append(i);

    if (t.name)
        b.append(t.name);
    else
        b.append(t);

    function tagObject(tag) {
        var o = objNew();
        o.name = tag.name;
        o = objAddDescription(o, tag.uri + ' [tag]');
        return o;
    }

	if (!onClicked)
		onClicked = function() {       newPopupObjectView(tagObject(t));    };

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
        if (ta.val() != "") {
            ok = confirm('Cancel this reply?');
        }
        else {
            ok = true;
        }

        if (ok)
            onCancel();
    });
    bw.append(c);

    var b = $('<button>Reply</button>');
    b.click(function() {
        if (ta.val() != "") {
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
    var d = newDiv();


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
            //http://stackoverflow.com/questions/5306680/move-an-array-element-from-one-array-position-to-another
            var y = getEditedFocus();
            y.value.splice(toIndex, 0, y.value.splice(fromIndex, 1)[0]);
            update(y);
        };


        d.empty();

        if (editable) {
            if (hideWidgets != true) {
                nameInput = $('<input/>').attr('type', 'text').attr('x-webkit-speech', 'x-webkit-speech').addClass('nameInput');
                nameInput.val(objName(x));
                d.append(nameInput);

                whenSaved.push(function(y) {
                    objName(y, nameInput.val());
                });
            }
        }
        else {
            d.append('<h1>' + objName(x) + '</h1>');
        }
        //d.append($('<span>' + x.id + '</span>').addClass('idLabel'));


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
		        var propVal = _.map(prop, function(pid) {
		            return $N.getProperty(pid);
		        });

                for (var j = 0; j < prop.length; j++) {
                    if (propVal[j].min)
                        if (propVal[j].min > 0)
                            if (!_.contains(tags, prop[j]))
                                missingProp.push(prop[j]);
                }
            }

            for (var i = 0; i < missingProp.length; i++) {
                var p = missingProp[i];
                d.append(newTagSection(x, i + x.value.length, {id: p}, editable, whenSaved, onAdd, onRemove, onStrengthChange, onOrderChange, whenSliderChange));
            }
        }

        var ts = $('<ul/>');

        d.append(ts.addClass('tagSuggestions'));

        var ontoSearcher;

        var lastValue = null;
        function search() {
            if (!ts.is(':visible')) {
                //clearInterval(ontoSearcher);
                return;
            }
            if (!d.is(':visible')) {
                clearInterval(ontoSearcher);
                return;
            }

            var v = nameInput.val();
            if (lastValue != v) {
                updateTagSuggestions(v, ts, onAdd, getEditedFocus);
                lastValue = v;
            }
        }

        if (objHasTag(getEditedFocus(), 'Tag')) {
            //skip suggestions when editing a Tag
            ts.empty();
        }
		else {
		    if (hideWidgets != true) {
		        if (editable)
		            ontoSearcher = setInterval(search, ONTO_SEARCH_PERIOD_MS);
		    }
		}

        d.getEditedFocus = getEditedFocus;


        //$('#FocusEdit button').button();       
        /*
         
         <button title="What?" id="AddWhatButton"><img src="/icon/rrze/emblems/information.png"></button>
         <button title="How/Why?" id="AddDescriptionButton"><img src="/icon/rrze/actions/quote.png"></button>
         <button title="When?" id="AddWhenButton" ><img src="/icon/clock.png"></button>
         <button title="Where?" id="AddLocationButton"><img src="/icon/rrze/emblems/globe.png"></button>
         <button title="Who?" id="AddWhoButton"><img src="/icon/rrze/categories/user-group.png"></button>
         
         
         <button title="Upload"><img src="/icon/rrze/actions/dial-in.png"/></button>                
         <!--<button>Save Privately...</button>-->
         <!-- <button onclick="javascript:cloneFocus();" title="Clone"><span class="FocusButtonIcon ui-icon ui-icon-newwin"></span><span class="FocusButtonLabel">Clone</span></button> -->
         <!-- <button onclick="javascript:deleteFocus();" title="Delete"><span class="FocusButtonIcon ui-icon ui-icon-trash"></span><span class="FocusButtonLabel">Delete</span></button> -->
         
         <div id="UploadModal" data-backdrop="" class="modal hide" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true" style="display: none">
         <form id="FocusUploadForm" action="/upload" method="post" enctype="multipart/form-data">
         <div>File:
         <input type="file" name="uploadfile" />
         <input type="submit" value="Upload" />
         </div>
         </form>
         <div class="FocusUploadProgress">
         <div class="FocusUploadBar"></div>
         <div class="FocusUploadPercent">0%</div>
         </div>
         <div id="FocusUploadStatus"></div>        
         
         <button class="btn" data-dismiss="modal" aria-hidden="true">OK</button>
         </div>
         
         //function cloneFocus() {
         //    var y = getEditedFocus();
         //    var oldURI = y.id;
         //    y.id = uuid();
         //    y.author = window.$N.id();
         //    commitFocus(y);
         //    saveObject(y);
         //
         //    $.pnotify({
         //        title: 'Cloning...',
         //        text: oldURI + ' -> ' + y.id
         //    });
         //    return y;
         //}
         //
         //function deleteFocus() {
         //    var f = window.$N.focus();
         //
         //    $.pnotify({
         //        title: 'Delete coming soon',
         //        text: f.uri
         //    });
         //
         //}
         */

        d.addClass('ObjectEditDiv');

        if (hideWidgets != true) {
            var whatButton = $('<button title="What?"><img src="/icon/rrze/emblems/information.png"></button>');
            whatButton.click(function() {
                var p = newPopup('Select Tags for ' + nameInput.val(), {modal: true, position: 'center', minWidth: 400});
                p.append(newTagger([], function(t) {
                    var y = getEditedFocus();
                    for (var i = 0; i < t.length; i++) {
                        objAddTag(y, t[i]);
                    }
                    update(y);
                    p.dialog('close');
                }));
            });
            d.append(whatButton);

            var howButton = $('<button title="How/Why?" id="AddDescriptionButton"><img src="/icon/rrze/actions/quote.png"></button>');
            howButton.click(function() {
                update(objAddValue(getEditedFocus(), 'textarea', ''));
            });
            d.append(howButton);

            var whenButton = $('<button disabled title="When?" id="AddWhenButton" ><img src="/icon/clock.png"></button>');
            d.append(whenButton);

            var whereButton = $('<button title="Where?"><img src="/icon/rrze/emblems/globe.png"></button>');
            whereButton.click(function() {
                update(objAddValue(getEditedFocus(), 'spacepoint', ''));
            });
            d.append(whereButton);

            var whoButton = $('<button disabled title="Who?" id="AddWhoButton"><img src="/icon/rrze/categories/user-group.png"></button>');
            d.append(whoButton);

            var drawButton = $('<button title="Draw"><img src="/icon/rrze/emblems/pen.png"/></button>');
            drawButton.click(function() {
                update(objAddValue(getEditedFocus(), 'sketch', ''));
            });
            d.append(drawButton);

            var uploadButton = $('<button title="Upload"><img src="/icon/rrze/actions/dial-in.png"/></button>');
            uploadButton.click(function() {

                var y = newDiv();
                var fuf = y.append('<form id="FocusUploadForm" action="/upload" method="post" enctype="multipart/form-data"><div>File:<input type="file" name="uploadfile" /><input type="submit" value="Upload" /></div></form>');
                y.append('<div class="FocusUploadProgress"><div class="FocusUploadBar"></div><div class="FocusUploadPercent">0%</div></div>');
                y.append('<div id="FocusUploadStatus"></div>');
                var okButton = $('<button class="btn">OK</button>');
                y.append(okButton);


                var x = newPopup('Upload', {modal: true});
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
                        bar.width(percentVal)
                        percent.html(percentVal);
                    },
                    uploadProgress: function(event, position, total, percentComplete) {
                        var percentVal = percentComplete + '%';
                        bar.width(percentVal)
                        percent.html(percentVal);
                    },
                    complete: function(xhr) {
                        var url = xhr.responseText;
                        status.html($('<a>File uploaded</a>').attr('href', url));
                        var ab = $('<button>Add Image To Description</button>');
                        var absURL = url.substring(1);
                        ab.click(function() {
                            update(objAddDescription(getEditedFocus(), '<a href="' + absURL + '"><img src="' + absURL + '"></img></a>'));
                        });
                        status.append('<br/>');
                        status.append(ab);
                    }
                });

            });
            d.append(uploadButton);

            /*
             var uploadArea = $('<div id="holder">Upload...</div>');
             uploadArea.attr('style', 'border: 10px dashed #ccc; width: 300px; min-height: 300px; margin: 20px auto;');
             var filereader = $('<div id="filereader"></div>');
             var formdata = $('<div id="formdata"></div>');
             var progress = $('<div id="progress"></div>');
             d.append(uploadArea);
             d.append(filereader);
             d.append(formdata);
             d.append(progress);
             {
             var holder = uploadArea.get(),
             tests = {
             filereader: typeof FileReader != 'undefined',
             dnd: 'draggable' in document.createElement('span'),
             formdata: !!window.FormData,
             progress: "upload" in new XMLHttpRequest
             }, 
             support = {
             filereader: filereader.get(),
             formdata: formdata.get(),
             progress: progress.get()
             },
             acceptedTypes = {
             'image/png': true,
             'image/jpeg': true,
             'image/gif': true
             },
             progress = document.getElementById('uploadprogress'),
             fileupload = document.getElementById('upload');
             
             _.each("filereader formdata progress".split(' '), function (api) {
             if (tests[api] === false) {
             support[api].className = 'fail';
             } else {
             // FFS. I could have done el.hidden = true, but IE doesn't support
             // hidden, so I tried to create a polyfill that would extend the
             // Element.prototype, but then IE10 doesn't even give me access
             // to the Element object. Brilliant.
             support[api].className = 'hidden';
             }
             });
             
             function previewfile(file) {
             if (tests.filereader === true && acceptedTypes[file.type] === true) {
             var reader = new FileReader();
             reader.onload = function (event) {
             var image = new Image();
             image.src = event.target.result;
             image.width = 250; // a fake resize
             holder.appendChild(image);
             };
             
             reader.readAsDataURL(file);
             }  else {
             holder.innerHTML += '<p>Uploaded ' + file.name + ' ' + (file.size ? (file.size/1024|0) + 'K' : '');
             console.log(file);
             }
             }
             
             function readfiles(files) {
             debugger;
             var formData = tests.formdata ? new FormData() : null;
             for (var i = 0; i < files.length; i++) {
             if (tests.formdata) formData.append('file', files[i]);
             previewfile(files[i]);
             }
             
             // now post a new XHR request
             if (tests.formdata) {
             var xhr = new XMLHttpRequest();
             xhr.open('POST', '/devnull.php');
             xhr.onload = function() {
             progress.value = progress.innerHTML = 100;
             };
             
             if (tests.progress) {
             xhr.upload.onprogress = function (event) {
             if (event.lengthComputable) {
             var complete = (event.loaded / event.total * 100 | 0);
             progress.value = progress.innerHTML = complete;
             }
             }
             }
             
             xhr.send(formData);
             }
             }
             
             //var tests.dnd = true;
             //if (tests.dnd) { 
             holder.ondragover = function () { console.log('hover'); this.className = 'hover'; return false; };
             holder.ondragend = function () { this.className = ''; return false; };
             holder.ondrop = function (e) {
             this.className = '';
             e.preventDefault();
             readfiles(e.dataTransfer.files);
             }
             } else {
             fileupload.className = 'hidden';
             fileupload.querySelector('input').onchange = function () {
             readfiles(this.files);
             };
             //}
             }*/


            var saveButton = $('<button><b>Save/Share</b></button>');
            saveButton.click(function() {
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
                        title: 'Saved (' + x.id.substring(0, 6) + ')',
                        text: '<button disabled>Goto: ' + x.name + '</button>'  //TODO button to view object           
                    });
                    $N.notice(e);
                });
                d.parent().dialog('close');
            });
            d.append(saveButton);

            var exportButton = $('<button>Export</button>');
            exportButton.click(function() {
                $.pnotify({
                    title: x.id,
                    text: JSON.stringify(x, null, 4)
                });
            });
            d.append(exportButton);
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
    d.hover( function() {
        d.addClass('tagSectionHovered');
    }, function() {
        d.removeClass('tagSectionHovered');
    } );

    if (strength == undefined)
        strength = 1.0;

    var tagLabel = $('<span>' + tag + '</span>').addClass('tagLabel');

    applyTagStrengthClass(d, strength);



    if (editable) {
        var tagButtons = newDiv().addClass('tagButtons');

        if (index > 0) {
            var upButton = $('<a href="#" title="Move Up">^</a>');
            upButton.addClass('tagButton');
            upButton.click(function() {
                onOrderChange(index, index - 1);
            });
            tagButtons.append(upButton);
        }
        else {
            var downButton = $('<a href="#" title="Move Down">v</a>');
            downButton.addClass('tagButton');
            downButton.click(function() {
                onOrderChange(index, index + 1);
            });
            tagButtons.append(downButton);
        }
        
        {
            var disableButton = $('<button title="Disable">&nbsp;</button>').appendTo(tagButtons);
            var p25Button = $('<button title="25%">&nbsp;</button>').appendTo(tagButtons);
            var p50Button = $('<button title="50%">&nbsp;</button>').appendTo(tagButtons);
            var p75Button = $('<button title="75%">&nbsp;</button>').appendTo(tagButtons);
            var p100Button = $('<button title="100%">&nbsp;</button>').appendTo(tagButtons);
            
            var currentButton = null;
            if (strength == 0) currentButton = disableButton;
            if (strength == 1.0) currentButton = p100Button;
            if (strength == 0.75) currentButton = p75Button;
            if (strength == 0.5) currentButton = p50Button;
            if (strength == 0.25) currentButton = p25Button;
            if (currentButton)
                currentButton.addClass('tagButtonSelected');
            
            disableButton.click(function() { onStrengthChange(index, 0); });
            p25Button.click(function() { onStrengthChange(index, 0.25); });
            p50Button.click(function() { onStrengthChange(index, 0.5); });
            p75Button.click(function() { onStrengthChange(index, 0.75); });
            p100Button.click(function() { onStrengthChange(index, 1.0); });
        }
        /*
        if (strength > 0.25) {
            var weakenButton = $('<a href="#" title="Decrease">-</a>');
            weakenButton.addClass('tagButton');
            weakenButton.click(function() {
                onStrengthChange(index, strength - 0.25);
            });
            tagButtons.append(weakenButton);
        }
        if (strength < 1.0) {
            var strengthButton = $('<a href="#" title="Increase">+</a>');
            strengthButton.addClass('tagButton');
            strengthButton.click(function() {
                onStrengthChange(index, strength + 0.25);
            });
            tagButtons.append(strengthButton);
        }

        if (strength > 0) {
            var disableButton = $('<a href="#" title="Disable">x</a>');
            disableButton.addClass('tagButton');
            disableButton.click(function() {
                onStrengthChange(index, 0);
            });
            tagButtons.append(disableButton);
        }
        else {
        }*/

        var removeButton = $('<a href="#" title="Remove">X</a>');
        removeButton.addClass('tagButton');
        removeButton.click(function() {
            if (confirm("Remove " + tag + "?"))
                onRemove(index);
        });
        tagButtons.append(removeButton);
        d.append(tagButtons);

        //d.hover(function(){ tagButtons.fadeIn(200);}, function() { tagButtons.fadeOut(200);});
        //d.hover(function(){ tagButtons.show();}, function() { tagButtons.hide();});                
        //tagButtons.hide();
    }

    d.append(tagLabel, '&nbsp;');

    var type;
    if (isPrimitive(tag)) {
        //tagLabel.hide();    
        type = tag;
    }

    var prop = $N.getProperty(tag);
    var defaultValue = null;
    if (prop) {
        type = prop.type;
        tagLabel.html(prop.name);

        if (prop.default) {
            defaultValue = prop.default;
        }
    }

    if (type == 'textarea') {

        if (editable) {
            var dd = $('<textarea/>').addClass('tagDescription');

            if (t.value)
                dd.val(t.value);
            else if (defaultValue)
                dd.val(defaultValue);

            d.append(dd);

            whenSaved.push(function(y) {
                objAddValue(y, tag, dd.val(), strength);
            });
        }
        else {
            var dd = newDiv();
            if (t.value)
                dd.html(t.value);
            d.append(dd);
        }
    }
    else if (type == 'cortexit') {
        //...
    }
    else if ((type == 'text') || (type == 'url') || (type == 'integer') || (type == 'real')) {

        if (editable) {
            var dd = $('<input type="text" placeholder="' + type + '"/>').appendTo(d);

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
                }
                else {
                    //only the number was present
                    dd.val(t.value);
                }
            }
            else if (defaultValue != null) {
                dd.val(defaultValue);
            }

            whenSaved.push(function(y) {
                if ((type == 'text') || (type == 'url')) {
                    objAddValue(y, tag, dd.val(), strength);
                }
                else if ((type == 'real') || (type == 'integer')) {
                    var ddv = (type == 'real') ? parseFloat(dd.val()) : parseInt(dd.val());

                    if (isNaN(ddv))
                        ddv = dd.val();    //store as string

                    if (!sx)
                        objAddValue(y, tag, ddv, strength);
                    else
                        objAddValue(y, tag, {number: ddv, unit: sx.val()}, strength);
                }
            });

        }
        else {
            var dd = newDiv();
            if (t.value)
                dd.html(t.value);
            d.append(dd);
        }

    }
    else if (type == 'boolean') {
        var ii = $('<input type="checkbox">');

        var value = t.value;
        if (value==undefined) {
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
        }
        else {
            ii.attr("disabled", "disabled");
        }
    }
    else if (type == 'spacepoint') {
        var ee = newDiv();
        var dd = newDiv();

        var de = uuid();
        dd.attr('id', de);
        dd = dd.addClass('focusMap').appendTo(ee);

        var m;

        if (editable) {
            var lr = $('<input type="text" placeholder="Where" />');
            lr.css('width', 'auto');
            ee.append(lr);

            var cr = $('<select/>');
            cr.css('width', 'auto');
            cr.append('<option value="earth" selected>Earth</option>');
            cr.append('<option value="moon">Moon</option>');
            cr.append('<option value="mars">Mars</option>');
            cr.append('<option value="venus">Venus</option>');
            cr.change(function() {
                alert('Currently only Earth is supported.');
                cr.val('earth');
            });
            ee.append(cr);

            var ar = $('<input type="text" placeholder="Altitude" />');
            ar.css('width', '15%');
            ee.append(ar);

            whenSaved.push(function(y) {
				if (!m) return;
				if (!m.location) return;

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
            var lat = t.value.lat || 0;
            var lon = t.value.lon || 0;
            var zoom = t.value.zoom;
            m = initLocationChooserMap(de, [lat, lon], zoom);

        });
    }
    else if (type == 'timepoint') {
        if (editable) {
            var lr = $('<input type="text" placeholder="Time" />');
            lr.val(new Date(t.at));
            d.append(lr);
            var lb = $('<button style="margin-top: -0.5em"><i class="icon-calendar"/></button>');
            d.append(lb);
            //TODO add 'Now' button

            //TODO add save function
        }
        else {
            d.append(new Date(t.at));
        }
    }
    else if (type == 'sketch') {
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
    }
    else if (type == 'timerange') {
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



            var start = -1, end = -1;

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
                }
                else {
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
        }
        else {
            d.append(new Date(t.value.start) + ' ' + new Date(t.value.end));
        }

    }
    else if (type == 'object') {
        if (editable) {
            var tt = $('<span></span>');
            var ts = $('<input></input>');

            var value = t.value;
            ts.val(value);

            //http://jqueryui.com/autocomplete/#default
            //http://jqueryui.com/autocomplete/#categories

            //TODO filter by tag specified by ontology property metadata
            var data = [];
            for (var k in $N.objects()) {
                var v = $N.object(k);
                if (value == k) {
                    ts.val(v.name);
                    ts.result = value;
                }

                data.push({
                    value: k,
                    label: v.name
                });
            }
            ts.autocomplete({
                source: data,
                select: function(event, ui) {
                    ts.result = ui.item.value;
                    ts.val(ui.item.label);
                    /*
                     $( "#project" ).val( ui.item.label );
                     $( "#project-id" ).val( ui.item.value );
                     $( "#project-description" ).html( ui.item.desc );
                     $( "#project-icon" ).attr( "src", "images/" + ui.item.icon );
                     */

                    return false;
                }
            });

            //TODO handle specific tag restriction
            /*$N.objectsWithTag(t) {
             
             }*/

            var mb = $('<button title="Find Object">...</button>');
            mb.click(function() {
                //TODO popup object browser 
            });

            tt.append(ts);
            tt.append(mb);

            d.append(tt);

            whenSaved.push(function(y) {
                objAddValue(y, tag, ts.result || ts.val(), strength);
            });
        }
    }
    else if (tag) {
        var TAG = $N.tags[tag];
        whenSaved.push(function(y) {
            objAddTag(y, tag, strength);
        });
        if (!TAG) {
            //d.append('Unknown tag: ' + tag);            
        }
        else {
            var ti = getTagIcon(tag);
            if ($N.tags[tag] != undefined) {
                tagLabel.html(TAG.name);
            }
            if (ti) {
                tagLabel.prepend('<img src="' + ti + '"/>');
            }
            if (editable) {
                /*var pb = $('<button>...</button>');
                 tagLabel.append(pb);*/

                function getTagProperties(t) {
                    var TT = $N.tags[t];
                    if (!TT)
                        return [];
                    if (!TT.properties)
                        return [];
                    return TT.properties;
                }

                var pd = $('<ul/>');
                //pd.addClass('tagSuggestions');
                var pp = getTagProperties(tag);
                for (var i = 0; i < pp.length; i++) {
                    (function(I) {
                        var ppv = pp[I];
                        var PP = $N.getProperty(ppv);

						//TODO dont include if max present reached
				        if (PP.max)
				            if (PP.max > 0) {
								var existing = objValues(x, ppv).length;
								if (PP.max <= existing)
									return;
							}

                        var ppn = PP.name;
                        var appv = $('<a href="#" title="' + PP.type + '">' + ppn + '</a>');
                        var defaultValue = '';
                        appv.click(function() {
                            onAdd(ppv, defaultValue);
                        });


                        pd.append('+', appv, '&nbsp;');
                    })(i);
                }

                d.append(pd);
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

    return d;
}

function newPropertyView(x, vv) {

    var p = $N.getProperty(vv.id);
    if (!p)
        return ('<li>' + vv.id + ': ' + vv.value + '</li>');

    if (p.type == 'object') {
        var o = $N.getObject(vv.value) || {name: vv.value};

        return ('<li>' + p.name + ': <a href="javascript:newPopupObjectView(\'' + vv.value + '\')">' + o.name + '</a></li>');
    }
    else if (p.type == 'url') {
        var u = vv.value;
        return ('<li>' + p.name + ': <a target="_blank" href="' + u + '">' + u + '</a></li>');
    }
    else if ((p.type == 'integer') && (p.incremental)) {
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

        var v = $('<li>' + p.name + ': ' + vv.value + '</li>');
        var ii = vv.value;
        if (p.min < vv.value) {
            var prev = $('<button>&lt;</button>');
            v.prepend(prev);
            prev.click(function() {
                later(goprev);
            });
        }
        //TODO allow for max
        var next = $('<button>&gt;</button>');
        next.click(function() {
            later(gonext);
        });
        v.append(next);
        return v;

    }
    else if ((p.type == 'integer') || (p.type == 'real')) {
		if (vv.value)
	        if (vv.value.unit) {
    	        return $('<li>' + p.name + ': ' + vv.value.number + ' ' + vv.value.unit + '</li>');
    	    }
        return $('<li>' + p.name + ': ' + vv.value + '</li>');
    }
    else {
        var v = $('<li>' + p.name + ': ' + vv.value + '</li>');

        //Property Actions
        //TODO HACK make this more abstract and extendable by plugins

        if ((vv.id == 'walletBTC') || (vv.id == 'walletPayPal') || (vv.id == 'walletRipple')) {
            var payButton = $('<button>Pay</button>');
            payButton.click(function() {
                alert('Payments not implemented yet.');
            });

            var vu = $('<ul/>');
            vu.append(payButton);
            v.append(vu);

        }


        return v;
    }
}


/**
 produces a self-contained widget representing a nobject (x) to a finite depth. activates all necessary renderers to make it presented
 */
function newObjectSummary(x, options) {
	if (!options) options = { };

	var onRemoved = options.onRemoved;
	var scale = options.scale;
	var depthRemaining = options.depthRemaining;
	var nameClickable = (options.nameClickable != undefined) ? options.nameClickable : true;
	var showAuthorIcon = (options.showAuthorIcon != undefined) ? options.showAuthorIcon : true;
	var showAuthorName = (options.showAuthorName != undefined) ? options.showAuthorName : true;

    if (!x) {
        return newDiv().html('Object Missing');
    }

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
        }
        else {
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
		if (!isSelfObject(x.id)) { //exclude Self- objects
		    if (x.author) {
		        var a = x.author;
		        var as = $N.getSelf(x.author);
		        if (as)
		            a = as.name;
				//else display UID?

		        xn = a + ': ' + xn;
		    }
		}
	}

    var replies = newDiv();

    function refreshReplies() {
        var r = $N.getReplies(x.id);
        if (r.length > 0) {
            replies.show();
            //TODO sort the replies by age, oldest first
            for (var i = 0; i < r.length; i++) {
                var p = r[i];
                replies.append(newObjectSummary($N.getObject(p), {
					'depthRemaining': depthRemaining - 1
				}));
            }
        }
        else {
            replies.hide();
        }
    }

    //var hb = newDiv().addClass('ObjectViewHideButton ui-widget-header ui-corner-tl');
    var hb = newDiv().addClass('ObjectViewHideButton ui-corner-tl'); //without ui-widget-header, it is faster CSS according to Chrome profiler


    var replyButton;

    if (!mini) {
        replyButton = $('<button title="Reply" class="ui-widget-content ui-button">r</button>');
        replyButton.click(function() {

            newReply.show();
            newReply.empty();
            newReply.append(newReplyWidget(
                    //on reply
                            function(text) {

                                newReply.hide();

                                var rr = {
                                    name: text,
                                    id: uuid(),
                                    value: [],
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
                                    refreshReplies();
                                    $.pnotify({
                                        title: 'Replied (' + x.id.substring(0, 6) + ')'
                                    })
                                });

                            },
                            //on cancel
                                    function() {
                                        newReply.hide();
                                    }
                            ));
                            replyButton.enabled = false;
                        });
                hb.append(replyButton);


            }


    if (replyButton)
        replyButton.hover(
                function() {
                    $(this).addClass('ui-state-hover');
                },
                function() {
                    $(this).removeClass('ui-state-hover');
                }
        );


    /*
     var cloneButton = $('<button title="Clone" class="ui-widget-content ui-button" style="padding-right:8px;">c</button>');
     var varyButton = $('<button title="Vary" class="ui-widget-content ui-button" style="padding-right:8px;">v</button>');
     hb.append(cloneButton);
     hb.append(varyButton);
     */

    d.append(hb);

    (function() {
        //d.hover(function(){ hb.fadeIn(200);}, function() { hb.fadeOut(200);});
        d.hover(function() {
            hb.show();
        }, function() {
            hb.hide();
        });
    })();
    hb.hide();


	if (showAuthorIcon) {
		var authorClient = $N.getSelf(authorID);
		if (authorClient) {
		    if (authorID) {
		        var av = getAvatar(authorClient).attr('align', 'left');

		        d.append(av);
		        av.wrap('<div class="AvatarIcon"/>');
		    }
		}
	}

    //Selection Checkbox
    var selectioncheck = $('<input type="checkbox"/>');
    selectioncheck.addClass('ObjectSelection');
    selectioncheck.attr('oid', x.id);
    selectioncheck.click(function() {
        refreshActionContext();
    });

	var haxn = null;

	function addPopupMenu() {
		var popupmenuButton = $('<button title="Actions...">&gt;</button>');
		popupmenuButton.addClass('ObjectViewPopupButton');
		popupmenuButton.click(function() {			
			function closeMenu() {
				popupmenuButton.remove();
				addPopupMenu();
			}
			
			if (popupmenuButton.children().length > 0) {
				//click the popup menu button again to disappear an existing menu
				closeMenu();
				return;
			}

			var d = newContextMenu([x], true, function() {
				//callback function when an item is clicked
				closeMenu();
			});

			d.addClass('ActionMenuPopup');
			var closeButton = $('<button>Close</button>');
			closeButton.click(function() {
				closeMenu();
			});

			d.append(closeButton);
			popupmenuButton.append(d);
		});

		if (haxn) {
			haxn.append(popupmenuButton);
		}
		else
			d.append(popupmenuButton);
	}

    //Name
    if (x.name) {
        haxn = $('<h1>');
        if (!nameClickable) {
            haxn.html(xn);
        }
        else {
            var axn = $('<a href="#">' + xn + '</a>');
            axn.attr('title', x.id);
            axn.click(function() {
                newPopupObjectView(x.id);
            });
            haxn.append(axn, '&nbsp;');
        }
        haxn.prepend(selectioncheck);
        d.append(haxn);
    }
    else {
        d.append(selectioncheck);
    }

	addPopupMenu();

    var mdline = $('<h2></h2>');
    mdline.addClass('MetadataLine');

    var ot = objTags(x);
    var ots = objTagStrength(x, false);

    for (var i = 0; i < ot.length; i++) {
        var t = ot[i];

        if ($N.isProperty(t))
            continue;

        var tt = $N.getTag(t);
        if (tt) {
            var ttt = newTagButton(tt);
            applyTagStrengthClass(ttt, ots[t]);
            mdline.append(ttt);
        }
        else {
            mdline.append('<a href="#">' + t + '</a>');
        }
        mdline.append('&nbsp;');
    }

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

			if (dist == 0)
	            mdline.append('&nbsp;<span>[' + lat + ',' + lon + '] ' + ' here</span>');
			else
	            mdline.append('&nbsp;<span>[' + lat + ',' + lon + '] ' + _n(dist) + ' km away</span>');
        }
        else {
            mdline.append('&nbsp;<span>[' + lat + ',' + lon + ']</span>');
        }
    }

    var ww = objWhen(x) || x.modifiedAt || x.createdAt || null;
    var now = Date.now();
    if (ww) {
        if (ww < now) {
            var tt = $('<time class="timeago"/>');
            function ISODateString(d) {
                function pad(n) {
                    return n < 10 ? '0' + n : n
                }
                return d.getUTCFullYear() + '-'
                        + pad(d.getUTCMonth() + 1) + '-'
                        + pad(d.getUTCDate()) + 'T'
                        + pad(d.getUTCHours()) + ':'
                        + pad(d.getUTCMinutes()) + ':'
                        + pad(d.getUTCSeconds()) + 'Z'
            }

            tt.attr('datetime', ISODateString(new Date(ww)));
            mdline.append(tt);
        }
        else {
            mdline.append('&nbsp;');
            mdline.append(new Date(ww));
        }

    }

    d.append(mdline);

    //d.append('<h3>Relevance:' + parseInt(r*100.0)   + '%</h3>');

    if (!mini) {
        var desc = objDescription(x);
        if (desc) {
            d.append('<p>' + desc + '</p>');
        }


        if (x.value) {
            var ud = $('<ul>');
            d.append(ud);
            for (var vi = 0; vi < x.value.length; vi++) {
                var vv = x.value[vi];

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
                    later(function() {
                        var sketchpad = Raphael.sketchpad(eu, options);
                    });
                    continue;
                }
                else if (vv.id == 'timerange') {
                    /*if (ISODateString) {
                     ud.append(ISODateString(new Date(vv.value.start)) + ' '
                     + ISODateString(new Date(vv.value.start)));
                     }
                     else*/ {
                        //mozilla: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString
                        ud.append(new Date(vv.value.start).toISOString() + ' '
                                + new Date(vv.value.start).toISOString());
                    }
                }

                if ($N.isProperty(vv.id))
                    ud.append(newPropertyView(x, vv));
            }
        }
    }

    if (!mini) {

        replies.addClass('ObjectReply');
        replies.hide();
        d.append(replies);

        var newReply = newDiv();
        newReply.addClass('ObjectReply objectView');
        newReply.hide();
        d.append(newReply);

        refreshReplies();
    }

    return d;
}


function withObject(uri, success, failure) {
    $.getJSON('/object/' + uri + '/json', function(s) {

        if (s.length == 0) {
            if (failure)
                failure();
        }
        else {
            if (success) {
                success(s);
            }
        }
    });
}


function newTagTree(param) {
    var a = param.target;
    var onSelectionChange = param.onSelectionChange;
    var addToTree = param.addtoTree;
    var newTagLayerDiv = param.newTagDiv;

    a.empty();

    var tree = newDiv();

    var isGeographic = $('#GeographicToggle').is(':checked');

    var stc;
    if (isGeographic) {
        stc = $N.getTagCount(false, objGeographic);
    }
    else {
        stc = $N.getTagCount();
    }

    var T = [
        /*        {
         label: 'node1',
         children: [
         { label: '<button>child1</button>' },
         { label: 'child2' }
         ]
         },
         {
         label: 'node2',
         children: [
         { label: 'child3' }
         ]
         } */
    ];


    function subtree(root, i) {
        var name, xi;
        if (i.name) {
            name = i.name;
            xi = i.uri;
        }
        else
            name = xi = i;
		
        var children = $N.subtags(xi);

        var label = name;
        if (stc[xi]) {
            if (stc[xi] > 0)
                label += ' (' + _n(stc[xi]) + ')';
        }
        else {
            /*if (children.length==0)
             return;*/
        }

        var b = newTagLayerDiv(xi, label);

        if (children.length > 0) {
            b.children = [];
            _.each(children, function(c) {
                subtree(b.children, $N.tag(c));
            });
        }
		b.id = xi;

        root.push(b);
    }

    function othersubtree(root) {
        var otherFolder = {
            label: 'Other',
            children: []
        };

        var others = [];
        for (var c in stc) {
            if (!$N.tag(c))
                others.push(c);
        }

        if (others.length == 0)
            return;

        _.each(others, function(c) {
            subtree(otherFolder.children, c);
        });
        root.push(otherFolder);
    }

    var roots = $N.tagRoots();
    _.each(roots, function(t) {
        subtree(T, $N.tag(t));
    });
    othersubtree(T);

    if (addToTree)
        addToTree(T);

    tree.appendTo(a);

	later(function() {
		a.hide();
		a.tree({
		    data: T,
			useContextMenu: false,
		    autoEscape: false,
		    selectable: false,
		    //slide: false,
			autoOpen: false
		});

		//autoOpen seems broken in jqtree, so manually open the first level:

		a.find('.jqtree-toggler').click();
		a.find('.jqtree-toggler').click();

		//all should be closed now.  now open the first row:

		a.children('ul').children('li').children('div').children('.jqtree-toggler').click();
		a.show();

		if (param.onCreated)
			param.onCreated(a);
	});

    return tree;

}
