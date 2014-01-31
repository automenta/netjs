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

function newWikiBrowser(selected, onTagAdded) {    
    var b = newDiv();

	var header = newDiv();
	header.addClass('WikiBrowserHeader');

    var backButton = $('<button disabled>Back</button>');
    var homeButton = $('<button disabled>Bookmarks</button>');
    homeButton.click(function() {
       gotoTag(configuration.wikiStartPage);
    });
    var searchInput = $('<input placeholder="Search Wikipedia"/>');
    var searchInputButton = $('<button>&gt;&gt;&gt;</button>');
    searchInput.keyup(function(event){
        if(event.keyCode == 13)
            searchInputButton.click();
    });
    searchInputButton.click(function() {
       gotoTag(searchInput.val(), true); 
    });
    header.append(backButton);
    header.append(homeButton);
    header.append('<button disabled title="Bookmark">*</button>');
    header.append(searchInput);
    header.append(searchInputButton);

	b.append(header);
    
    var br = $('<div/>');
    br.addClass('WikiBrowser');
    
        
    var currentTag = configuration.wikiStartPage;
    
    function gotoTag(t,search) {        
        br.html('Loading...');
        currentTag = t;
        
        /*if (t == null) {
            $.get('/skill-home.html', function(d) {
               br.html('');
               br.append(d); 
s
            });
            
            }
            else */
        {
            var url = search ? '/wiki/search/' + t : '/wiki/' + t + '/html';

            function newPopupButton(target) {
                var p = $('<a href="#" title="Tag">+</a>');
                p.click(function() {
                    if (onTagAdded)
                        onTagAdded(target);
                });
                return p;
            }
            
            $.get(url, function(d) {
               br.empty().append(d); 
               
               if (search) {
                    currentTag = $('.WIKIPAGEREDIRECTOR').html();
               }
               
               br.find('#top').remove();
               br.find('#siteSub').remove();
               br.find('#contentSub').remove();
               br.find('#jump-to-nav').remove();
               br.find('.IPA').remove();
               br.find('a').each(function(){
                   var t = $(this);
                   var h = t.attr('href');
                   t.attr('href', '#');
                   if (h) {
                    if (h.indexOf('/wiki') == 0) {
                        var target = h.substring(6);
                        
                        t.click(function() {
                             gotoTag(target); 
                        });
                         
                        if ((target.indexOf('Portal:')!=0) && (target.indexOf('Special:')!=0)) {
                            t.after(newPopupButton(target));
                        }
                    }
                   }
               });
               var lt = newPopupButton(currentTag);
               
               if (currentTag.indexOf('Portal:')!=0)
                    br.find('#firstHeading').append(lt);
            });
            
            //..
        }
    }
    gotoTag(currentTag);
        
    b.append(br);
    
    
    /*{
        var tagBar = newTagBar(s, currentTag);
        var saveButton = newTagBarSaveButton(s, currentTag, tagBar);
        
        b.append(saveButton);        
        b.prepend(tagBar);
    }*/
    
    return b;    
}
