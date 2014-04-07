function newTagger(selected, onFinished) {
    if (!selected)
        selected = [];

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
        tags = _.unique( [t].concat(tags) ); 
        tagsCombo.update();
    }
    
    function loadBrowser(w) {
        t.empty();
        currentBrowser = w(selected, onTagAdded);
        t.append(currentBrowser);        
    }
    
    var selectBar = $('<span style="float:left"/>');
    {
        function addButton(label, browserFunction) {
            var b = $('<button>' + label + '</button>');
            b.click(function() {
               loadBrowser(browserFunction); 
            });
            selectBar.append(b);
        }
        addButton('Index', newTreeBrowser);
        addButton('Wiki', newWikiBrowser);
        addButton('Who', newNullBrowser);
        addButton('Emotion', newEmotionBrowser);
        addButton('Body', newBodyBrowser);
        addButton('Needs', newNeedsBrowser);
        addButton('&#9733;', newNeedsBrowser); //favorites
        
    }
    //d.append(selectBar);
    
    var saveBar = $('<span/>');
    {
        tagsCombo.update();
        saveBar.append(tagsCombo);
        
        var clearButton = $('<button>x</button>');
        clearButton.click(function() {
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
		d.parent().parent().children(".ui-dialog-titlebar").append(selectBar);
	});
        
    t.attr('style', 'clear: both');
    d.append(t);
    
    //default
    loadBrowser(newTreeBrowser);
    
    
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
    i.click(function() { alert('Not available yet.'); });
    e.append(i);
    return e;    
}
function newBodyBrowser() {
    var e = newDiv();
    var i = $('<img src="/icon/human_body_chart.jpg"/>');
    i.click(function() { alert('Not available yet.'); });
    e.append(i);
    return e;    
}
function newNeedsBrowser() {
    var e = newDiv();
    var i = $('<img src="/icon/resiliencemaps.org.simple_critical_infrastructure.png"/>');
    i.click(function() { alert('Not available yet.'); });
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
			if (!ti) ti = defaultIcons['unknown'];

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


