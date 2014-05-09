function newTagger(selected, onFinished, tagRestrictions, maxTags) {    
    if (!selected)
        selected = [];
    if (!Array.isArray(selected))
        selected = [selected];
    
    var tags = _.clone(selected);

    var d = newDiv();
    var t = newDiv(); //target for the browser instances
    t.attr('id', 'TagSelectWidget');

    var currentBrowser = null;


    var tagsCombo = $('<span></span>');
    tagsCombo.update = function() {
        tagsCombo.empty();
        for (var i = 0; i < tags.length; i++)
            tagsCombo.append('<b>' + tags[i] + '</b>&nbsp;');
    };
    tagsCombo.update();

    function onTagAdded(t) {
        if (maxTags)
            if (tags.length >= maxTags)
                return;
        
        tags = _.unique([t].concat(tags));
        tagsCombo.update();
    }

    function loadBrowser(w) {
        t.empty();
        currentBrowser = w(selected, onTagAdded);
        t.append(currentBrowser);
    }

    var selectBar = $('<div/>');
    {
        var modeSelect = $('<select/>').appendTo(selectBar);
        var modeFunctions = {};
        modeSelect.change(function() {
            var k = modeSelect.val();
            var f = modeFunctions[k];
            if (f) {
                later(function() {
                    loadBrowser(f);                            
                });
            }
        });
        var optionCount = 0;
        function addOption(label, browserFunction) {
            /*var b = $('<button>' + label + '</button>');
             b.click(function() {
             loadBrowser(browserFunction);
             });
             selectBar.append(b);*/
            $('<option value="' + optionCount + '">' + label + '</option>').appendTo(modeSelect);
            modeFunctions[optionCount] = browserFunction;
            optionCount++;
        }
        if (!tagRestrictions) {
            addOption('Index', newTreeBrowser);
            addOption('Wiki', newWikiBrowser);
            addOption('Object', newObjectSelector(null));
            addOption('Who', newObjectSelector($N.getTag('User')));
            addOption('Emotion', newEmotionBrowser);
            addOption('Body', newBodyBrowser);
            addOption('Needs', newNeedsBrowser);
            addOption('&#9733;', newNeedsBrowser); //favorites
        }
        else {
            if (!Array.isArray(tagRestrictions))
                tagRestrictions = [tagRestrictions];
            
            _.each(tagRestrictions, function(t) {
                var T = $N.getTag(t);
                if (T)
                    addOption(T.name, newObjectSelector(T));
            });
        }
    }
    //d.append(selectBar);

    var saveBar = $('<span/>');
    {
        tagsCombo.update();
        saveBar.append(tagsCombo);

        var clearButton = $('<button>x</button>');
        clearButton.click(function() {
			if (tags.length)
		        if (confirm('Clear selected tags?')) {
		            tags = [];
		            tagsCombo.update();
		        }
        });
        saveBar.append(clearButton);


        var b = $('<button><b>OK</b></button>');
        b.click(function() {
            onFinished(tags);
            /*
             var newTags = [];
             $('.TagChoice').each(function(x) {
             var t = $(this);
             var tag = t.attr('id');
             if (t.is(':checked'))
             newTags.push(tag);
             });
             onFinished(newTags);*/

        });
        saveBar.append(b);
    }
    later(function() {
        selectBar.append(saveBar);
        //d.parent().parent().children(".ui-dialog-titlebar").append(selectBar);
        d.parent().before(selectBar);
    });

    t.attr('style', 'clear: both');
    d.append(t);

    //default
    if (modeFunctions[0])
        loadBrowser(modeFunctions[0]);

    return d;
}

function newNullBrowser() {
    var e = newDiv();
    e.append('Not available yet');
    return e;
}
function newEmotionBrowser() {
    var e = newDiv();
    var i = $('<img src="/icon/plutchik_emotion_wheel.svg"/>');
    i.click(function() {
        alert('Not available yet.');
    });
    e.append(i);
    return e;
}
function newBodyBrowser() {
    var e = newDiv();
    var i = $('<img src="/icon/human_body_chart.jpg"/>');
    i.click(function() {
        alert('Not available yet.');
    });
    e.append(i);
    return e;
}
function newNeedsBrowser() {
    var e = newDiv();
    var i = $('<img src="/icon/resiliencemaps.org.simple_critical_infrastructure.png"/>');
    i.click(function() {
        alert('Not available yet.');
    });
    e.append(i);
    return e;
}

function newTreeBrowser(selected, onTagAdded) {
    var e = newDiv();
    e.addClass('SelfTimeTagTree');

    $('.TagChoice').remove();

    var prefix = 'STT_';

    newTagTree({
        target: e,
        newTagDiv: function(id, content) {
            var ti = getTagIcon(id);
            if (!ti)
                ti = defaultIcons['unknown'];

            content = '<img style="height: 1em" src="' + ti + '"/>&nbsp;' + content;

            return {
                label: ('<button id="' + prefix + id + '" class="TagChoice")>' + content + '</button>')
            };
        },
        onCreated: function() {
            e.find('.TagChoice').each(function(x) {
                var t = $(this);
                t.click(function() {
                    onTagAdded(t.attr('id').substring(prefix.length));
                });
            });
        }
    });

    return e;
}


function newObjectSelector(T) {
    var maxDisplayedObjects = 64;
    var updatePeriodMS = 300;
    
    return function(selected, onTagAdded) {
        var e = newDiv();
        var keywordFilter = null;
        
        var keywordInput = $('<input type="text" placeholder="Keywords"/>');
        keywordInput.bind("propertychange keyup input paste", function() {
           keywordFilter = keywordInput.val().toLowerCase();
           if (keywordFilter.length === 0)
               keywordFilter = null;
           update();
        });
        e.append(keywordInput);
        
        e.append('<hr/>');
        
        var d = newDiv().appendTo(e);
        
        function _update() {
            d.empty();
            
            var tl = T ? $N.objectsWithTag(T.uri, false) : _.keys($N.objects());
            if (keywordFilter) {
                tl = _.filter(tl, function(x) {
                    var O = $N.getObject(x);
                    if (O.name)
                        return (O.name.toLowerCase().indexOf(keywordFilter)!=-1);
                    return false;
                });
            }
            
            ol = tl.slice(0, maxDisplayedObjects);
            if (ol.length < tl.length) {
                d.append('Only displaying the first ' + ol.length + ' objects.  Please narrow the query.<br/><br/>');
            }

            _.each(ol, function(o) {
                var O = $N.getObject(o);
                var s = newObjectSummary(O, {
                    showActionPopupButton: false,
                    titleClickMode: function(x) {
                        onTagAdded(x.id);
                    }
                });
                d.append(s);
            });
        }
        
        var update = _.throttle(_update, updatePeriodMS);
        update();
        
        return e;
    };    
}
