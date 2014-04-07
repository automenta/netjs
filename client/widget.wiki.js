function getENWikiURL(t) {
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
    
        
	function loading() {
        br.html('Loading...');
	}

    var currentTag = configuration.wikiStartPage;
    
    function gotoTag(t,search) {        
		loading();
        currentTag = t;
    
        var url;
		var extractContent;
		if (configuration.wikiProxy) {
			if (search)
				url = configuration.wikiProxy + 'en.wikipedia.org/wiki/' + t;
			else
				url = configuration.wikiProxy + 'en.wikipedia.org/wiki/' + t;
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
					var ip = d.indexOf(pp)+pp.length;
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
