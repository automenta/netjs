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

    var clearButton = $('<button title="Clear the selected tags">Clear</button>').addClass('halfTransparent');
    
    var b = $('<button><b>OK</b></button>');

    var tagsCombo = $('<span></span>').attr('id', 'tagsCombo');
    tagsCombo.update = function() {
        tagsCombo.empty();
        if (tags.length === 0) {
            clearButton.hide();
            b.text('Cancel');
        }
        else {
            clearButton.show();
            
            b.html('<b>Select</b>');                
            for (var i = 0; i < tags.length; i++)
                tagsCombo.append(newTagButton(tags[i]));
        }
    };
    tagsCombo.update();

    function onTagAdded(t) {
        if (maxTags)
            if (tags.length >= maxTags)
                return;
        
        tags = _.unique([t].concat(tags));

        if (maxTags)
            if (tags.length === maxTags) {
                onFinished(tags);
                return;
            }

        tagsCombo.update();
    }

    function loadBrowser(w) {
        t.empty();
        currentBrowser = w(selected, onTagAdded);
        t.append(currentBrowser);
    }

    var selectBar = $('<div/>').attr('id', 'tagSelectHeader');
    
    var modeFunctions = {};
    var modeSelect = $('<select autofocus/>')
        .appendTo(selectBar)
        .change(function() {
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
        addOption('Who', newObjectSelector($N.class.User));
        addOption('Emotion', newEmotionBrowser);
        addOption('Body', newBodyBrowser);
        addOption('Needs', newNeedsBrowser);
        addOption('&#9733;', newNeedsBrowser); //favorites
    }
    else {
        if (!Array.isArray(tagRestrictions))
            tagRestrictions = [tagRestrictions];

        _.each(tagRestrictions, function(t) {
            var T = $N.class[t];
            if (T)
                addOption(T.name, newObjectSelector(T));
        });
    }

    var saveBar = $('<span/>');
    tagsCombo.update();
    saveBar.append(tagsCombo);

    clearButton.click(function() {
        if (tags.length)
            if (confirm('Clear selected tags?')) {
                tags = [];
                tagsCombo.update();
            }
    });
    saveBar.append(clearButton);

    if (maxTags!==1) {
        b.click(function() {
            onFinished(tags);
        }).appendTo(saveBar);
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

var _onTagAddedFunc = function() {
    onTagAdded($(this).attr('id').substring(prefix.length));
};

function newTreeBrowser(selected, onTagAdded) {
    var e = newDiv().addClass('SelfTimeTagTree');

    $('.TagChoice').remove();

    var prefix = 'S_';

    
    newTagTree({
        target: e,
        newTagDiv: function(id, content) {
            var ti = getTagIcon(id) || defaultIcons.unknown;

            return {
                label: '<button id="' + prefix + id + '" class="TagChoice" style="background-image: url('+ ti + ')">' +
                       content + '</button>'
            };
        },
        onCreated: function() {
            e.find('.TagChoice').each(function(x) {
                $(this).click(_onTagAddedFunc);
            });
        }
    });

    return e;
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
    } else {
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
            xi = i.id;
        } else
            name = xi = i;

        var children = i.subclass || [];
        
        var label = name;
        if (stc[xi]) {
            if (stc[xi] > 0)
                label += ' (' + _n(stc[xi]) + ')';
        } else {
            /*if (children.length==0)
             return;*/
        }

        var b = newTagLayerDiv(xi, label);

        if (!_.isEmpty(children)) {
            b.children = [];
            _.each(children, function(c, cid) {
                subtree(b.children, c);
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
            if ((!$N.class[c]) && (!$N.property[c]))
                others.push(c);
        }

        if (others.length === 0)
            return;

        others.forEach(function(c) {
            subtree(otherFolder.children, c);
        });
        root.push(otherFolder);
    }

    _.each($N.classRoot, function (c, cid) {
        subtree(T, c);
    });
    
    othersubtree(T);

    if (addToTree)
        addToTree(T);

    tree.appendTo(a);

    later(function () {
        //a.hide();
        a.tree({
            data: T,
            useContextMenu: false,
            autoEscape: false,
            selectable: false,
            slide: false,
            autoOpen: false
        });

        //autoOpen seems broken in jqtree, so manually open the first level:
        a.find('.jqtree-toggler').click().click();

        //all should be closed now.  now open the first row:
        a.children('ul').children('li').children('div').children('.jqtree-toggler').click();

        if (param.onCreated)
            param.onCreated(a);
    });

    return tree;

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
            
            var tl = T ? $N.objectsWithTag(T, false) : _.keys($N.objects());
            if (keywordFilter) {
                tl = _.filter(tl, function(x) {
                    var O = $N.object[x];
                    if (O.name)
                        return (O.name.toLowerCase().indexOf(keywordFilter)!==-1);
                    return false;
                });
            }
            
            ol = tl.slice(0, maxDisplayedObjects);
            if (ol.length < tl.length) {
                d.append('Only displaying the first ' + ol.length + ' objects.  Please narrow the query.<br/><br/>');
            }

            _.each(ol, function(o) {
                var O = $N.getObject(o);
                var s = newObjectView(O, {
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
