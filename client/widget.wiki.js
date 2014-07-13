function getENWikiURL(t) {
	if (t == null) return '#';

	if (t[0] == '_')
		return 'http://en.wiktionary.org/wiki/' + t.substring(1).toLowerCase();
	else
	    return 'http://en.wikipedia.org/wiki/' + t;
}


function newWikiBrowser(selected, onTagAdded, options) {
	if (!options) options = { };

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
    searchInput.keyup(function(event) {
        if (event.keyCode == 13)
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


	function loading() {
        br.html('Loading...');
	}

    var currentTag = configuration.wikiStartPage;

    function gotoTag(t, search) {
		loading();
        currentTag = t;

        var url;
		var extractContent;
		if (configuration.wikiProxy) {
			if (search) {
				var tt = t.replace(/ /g, '_'); //hack, TODO find a proper way of doing this
				url = configuration.wikiProxy + 'en.wikipedia.org/w/index.php?search=' + encodeURIComponent(tt);
			}
			else
				url = configuration.wikiProxy + 'en.wikipedia.org/wiki/' + encodeURIComponent(t);
			extractContent = true;
		}
		else {
			url = search ? '/wiki/search/' + t : '/wiki/' + t + '/html';
			extractContent = false;
		}

        function newPopupButton(target) {
            var p = $('<a href="#" title="Tag">+</a>');
            p.click(function() {
                if (onTagAdded)
                    onTagAdded(target);
            });
            return p;
        }

        $.get(url, function(d) {


			//HACK rewrite <script> tags so they dont take effect
			d = d.replace(/<script(.*)<\/script>/g, '');

           br.empty().append(d);

		   if (extractContent) {
				br.find('head').remove();
				br.find('script').remove();
				br.find('link').remove();
				if (search) {
					//TODO this is a hack of a way to get the acctual page name which may differ from the search term after a redirect happened
					var pp = 'ns-subject page-';
					var ip = d.indexOf(pp) + pp.length;
					var ip2 = d.indexOf(' ', ip);
					currentTag = d.substring(ip, ip2);
				}
		   }
           else {
				//WIKIPAGEREDIRECTOR is provided by the node.js server, so don't look for it when using CORS proxy
				if (search) {
            	    currentTag = $('.WIKIPAGEREDIRECTOR').html();
				}
           }

           br.find('#top').remove();
           br.find('#siteSub').remove();
           br.find('#contentSub').remove();
           br.find('#jump-to-nav').remove();
		   if (search) {
				br.find('.search-types').remove();
				br.find('.mw-specialpage-summary').remove();
				br.find('.mw-search-top-table').remove();
		   }
           br.find('.IPA').remove();
           br.find('a').each(function() {
               var t = $(this);
               var h = t.attr('href');
               t.attr('href', '#');
               if (h) {
                if (h.indexOf('/wiki') == 0) {
                    var target = h.substring(6);

                    t.click(function() {
                         gotoTag(target);
                    });

                    if ((target.indexOf('Portal:') != 0) && (target.indexOf('Special:') != 0)) {
                        t.after(newPopupButton(target));
                    }
                }
               }
           });
           var lt = newPopupButton(currentTag);

           if (currentTag.indexOf('Portal:') != 0)
                br.find('#firstHeading').append(lt);
        });

    }
	if (options.initialSearch) {
		searchInput.val(options.initialSearch);
		gotoTag(options.initialSearch, true);
	}
	else {
	    gotoTag(currentTag);
	}

    b.append(br);


    return b;
}

function newWikiView(v) {

    var frame = newDiv().attr('class', 'SelfView');
    frame.append(newWikiBrowser($N, onWikiTagAdded));

    v.append(frame);

    frame.onChange = function() {
        //update user summary?
    };

    return frame;

    /*
     var roster = newRoster();
     roster.addClass('SelfRoster');

     var contentTags = newDiv().attr('class', 'SelfViewTags');
     var contentTime = newDiv().attr('class', 'SelfViewTime');
     var content = newDiv().attr('class', 'SelfViewContent');

     frame.append(roster);
     frame.append(content);

     var currentUser = $N.myself();

     function summaryUser(x) {
     currentUser = x;
     content.empty();
     content.append(newSelfSummary(s, x, content));
     content.append(contentTags);
     content.append(contentTime);
     updateTags(x);
     }

     function updateTags(x) {
     contentTags.html(newSelfTagList(s, x, content));

     if (x)
     if (configuration.showPlanOnSelfPage) {
     //contentTime.html(newSelfTimeList(x, contentTime));
     }

     roster.html(newRoster(function(x) {
     summaryUser(x);
     }));
     }

     summaryUser(currentUser);

     v.append(frame);

     frame.onChange = function() {
     updateTags(currentUser);
     //update user summary?
     };
     */

}

