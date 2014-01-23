/*!
 * index.js
 */

"use strict";

var FOCUS_KEYWORD_UPDATE_PERIOD = 1500;

var updateView;


var lastView = null;
var currentView = null;

function updateBrand() {
    if (!self.myself())
        return;

    $('.brand').html(self.myself().name);

    var avatarURL = getAvatarURL(self.myself().email);
    $('#avatar-img').attr('src', avatarURL);
    $('#toggle-img').attr('src', avatarURL);
}

function updateViewControls() {
    //select the current view in the ViewControls

	//TODO uncheck all that are checked

    $('#ViewControls #' + self.get('currentView')).attr('checked', true);
    $('#ViewControls').buttonset('refresh');
}


function _updateView(force) {

    var s = window.self;

    updateBrand();

    //s.saveLocal();

    var view = s.get('currentView');

    var o = $('#ViewOptions');
    var v = $('#View');
    var submenu = $('#toggle-submenu');

    if (v.is(':visible')) {
    }
    else
        return;

    if (!force) {
        if ((currentView) && (view === lastView)) {
            if (currentView.onChange) {
                currentView.onChange();
                return;
            }
        }
    }

    v.html('');
    o.html('');
    submenu.html('');
    submenu.hide();

    lastView = view;

    v.css('font-size', '100%');
    v.removeClass('ui-widget-content');
    v.removeClass('view-indented');
    v.removeClass('overthrow');
    v.removeClass('overflow-hidden');
    v.removeClass('nobg');

    function indent() {
        submenu.show();
        v.addClass('overthrow ui-widget-content view-indented');
    }

    if (view === 'browse') {
        indent();
        currentView = renderList(s, o, v);
    }
    else if (view === 'us') {
        indent();
        currentView = renderUs(v);
    }
    else if (view === 'map') {
        v.addClass('overflow-hidden');
        v.addClass('nobg');
        currentView = renderMap(s, o, v);
    }
    else if (view === 'trends') {
        indent();
        currentView = renderTrends(s, o, v);
    }
    else if (view == 'graph') {
        v.addClass('overflow-hidden');
        currentView = renderGraph(s, o, v);
    }
    /*    else if (view == 'slides') {
     currentView = renderSlides(s, o, v);
     }*/
    else if (view == 'self') {
        indent();
        currentView = renderSelf(s, o, v);
    }
    else if (view == 'plan') {
        indent();
        currentView = renderPlan(v);
    }
    else if (view == 'options') {
        indent();
        currentView = renderOptions(s, o, v);
    }
    else if (view == 'chat') {
        indent();
        currentView = renderChat(v);
    }
    else {
        v.html('Unknown view: ' + view);
        currentView = null;
    }

}


function initKeyboard() {
	var views = [];
	$('#ViewControls input').each(function(x) { views.push($(this).attr('id')); });

	for (var i = 0; i < views.length; i++) {
		var f = function(I) { 
			jwerty.key('ctrl+' + (1+I), function() {
				later(function() {
					self.set('currentView', views[I]); 
					updateViewControls();
				});
				return false; 
			})
		};
		f(i);
	}
	
	var viewDelta = function(delta) {
		var currentIndex = _.indexOf( views, self.get('currentView') );
		var nextIndex = currentIndex + delta;

		if (nextIndex < 0) nextIndex = views.length - 1;
		if (nextIndex >= views.length) nextIndex = 0;

		later(function() {
			self.set('currentView', views[nextIndex]); 
			updateViewControls();
		});
	};


	jwerty.key('esc', function() {	toggleAvatarMenu(); return false;	});
	jwerty.key('ctrl+left',  function()	{	viewDelta(-1); return false;	});
	jwerty.key('ctrl+right', function() {	viewDelta(+1); return false;	});
}


function setTheme(t) {
    if (!t)
        t = configuration.defaultTheme;
    if (!_.contains(_.keys(themes), t))
        t = configuration.defaultTheme;

    var oldTheme = window.self.get('theme');
    if (oldTheme !== t) {
        self.save('theme', t);
    }

    $('.themecss').remove();

    var themeURL;
    var inverse = false;
    if (t[0] == '_') {
        t = t.substring(1);
        themeURL = 'theme/' + t + '.css';
        if (t === 'Dark')
            inverse = true;
    }
    else {
        themeURL = 'lib/jquery-ui/1.10.3/themes/' + t + '/jquery-ui.min.css';
        if (t === 'ui-darkness')
            inverse = true;
    }

    $('head').append('<link class="themecss" href="' + themeURL + '" type="text/css" rel="stylesheet"/>');
    if (inverse) {
        $('head').append('<link class="themecss" href="/theme/black-background.css" type="text/css" rel="stylesheet"/>');
    }

}



function popupAboutDialog() {
    $.get('/about.html', function(d) {
        var p = newPopup('About');
        p.html(d);
    });
}

var TogetherJS;

$(document).ready(function() {

    var themeSelect = $('#uitheme');
    for (var k in themes) {
        themeSelect.append($('<option id="' + k + '">' + themes[k] + '</option>'));
    }
    themeSelect.change(function() {
        var t = $(this).children(":selected").attr("id");
        setTheme(t);
    });

    if (configuration.enableTogetherJS) {
        loadJS('https://togetherjs.com/togetherjs-min.js');
        $('#TogetherJSTalk').show();
    }
    else {
        TogetherJS = null;
    }

    if (configuration.enableAnonymous)
        $('#AnonymousLoginButton').show();


	$('#openid-open').click(function() {
		$('#openid-login').fadeIn();
	});


    $('.logout').show();

    function newLoginButton() {
        var lb = $('<button>Login</button>');
        lb.click(function() {
            $('#LoadingSplash').show();
        });
        return lb;
    }

    var ii = identity();
    if (ii == ID_UNKNOWN) {
        if (configuration.requireIdentity) {
            $('#LoadingSplash').show();
            return;
        }
        else {
            $('#welcome').html(newLoginButton());
            $('#LoadingSplash').hide();
        }
    }
    else {
        $('#LoadingSplash').hide();
    }

    var ll = $.pnotify({
        title: 'Loading...'
    });

    netention(function(self) {
        ll.pnotify({
            text: 'System loaded.'
        });

        window.self = self;

        setTheme(self.get('theme'));

        self.clear();

        self.loadSchemaJSON('/ontology/json', function() {
            ll.pnotify({
                text: 'Ontology ready. Loading objects...'
            });

            self.getLatestObjects(configuration.maxStartupObjects, function() {
                ll.hide();

                self.listenAll(true);

                //SETUP ROUTER
                var Workspace = Backbone.Router.extend({
                    routes: {
                        "new": "new",
                        "me": "me", // #help
                        "help": "help", // #help
                        "query/:query": "query", // #search/kiwis
                        "object/:id": "object",
                        "object/:id/focus": "focus",
                        "tag/:tag": "tag",
                        //"new/with/tags/:t":     "newWithTags",
                        "example": "completeExample"
                                //"search/:query/:page":  "query"   // #search/kiwis/p7
                    },
                    me: function() {
                        commitFocus(self.myself());
                    },
                    completeExample: function() {
                        commitFocus(exampleObject);
                    },
                    showObject: function(id) {
                        var x = self.getObject(id);
                        if (x) {
                            newPopupObjectView(x);
                        }
                        else {
                            /*$.pnotify({
                             title: 'Unknown object',
                             text: id.substring(0, 4) + '...'
                             });*/
                        }
                    }

                });

                var w = new Workspace();
                Backbone.history.start();

                if (configuration.initialView) {
                    self.save('currentView', configuration.initialView);
                }

				updateViewControls();

                $('body').timeago();
                updateView = _.throttle(function() {
                    later(function() {
                        _updateView();
                    });
                }, 850);

                function doUpdate() {
                    updateView();
                }


                self.on('change:attention', doUpdate);
                self.on('change:layer', doUpdate);
                self.on('change:currentView', doUpdate);
                self.on('change:tags', doUpdate);
                self.on('change:focus', doUpdate);

                var msgs = ['I think', 'I feel', 'I wonder', 'I know', 'I want'];
                //var msgs = ['Revolutionary', 'Extraordinary', 'Bodacious', 'Scrumptious', 'Delicious'];
                function updatePrompt() {
                    var l = msgs[parseInt(Math.random() * msgs.length)];
                    $('.nameInput').attr('placeholder', l + '...');
                }
                setInterval(updatePrompt, 7000);
                updatePrompt();

                $.getScript(configuration.ui, function(data) {
                    doUpdate();

		            var ii = identity();

		            if (ii === ID_AUTHENTICATED) {
		                $.pnotify({
		                    title: 'Authorized.'
		                });
		            }
		            else if (ii === ID_ANONYMOUS) {
		                $.pnotify({
		                    title: 'Anonymous.'
		                });
		            }
		            else {
		                var nn = $.pnotify({
		                    title: 'Unidentified.',
		                    text: 'Read-only public access.  <b><a class="loginlink" href="#">Login</a>?</b>'
		                });
		                $('.loginlink').click(function() {
		                    $('#LoadingSplash').show();
		                    nn.hide();
		                });
		            }

                    $('#View').show();
                    $('#LoadingSplash2').hide();
					

					var alreadyLoggedIn = false;
					if (configuration.autoLoginDefaultProfile) {
						var otherSelves = _.filter(self.get("otherSelves"), function(f) { return self.getObject(f)!=null; } );
						if (otherSelves.length >= 1) {
							self.become(otherSelves[0]);
							alreadyLoggedIn = true;
						}
					}


					if (!alreadyLoggedIn) {
		                if (isAnonymous()) {
		                    //show profile chooser
		                    openSelectProfileModal("Anonymous Profiles");
		                }
		                else if (self.myself() === undefined) {
		                    if (configuration.requireIdentity)
		                        openSelectProfileModal("Start a New Profile");
		                }
					}

					initKeyboard();

                });


            });
        });


    });



    $('#logout').hover(
            function() {
                $(this).addClass('ui-state-hover');
                $(this).addClass('shadow');
            },
            function() {
                $(this).removeClass('ui-state-hover');
                $(this).removeClass('shadow');
            }
    );


    $('#close-menu').button();
    $("#ViewControls").buttonset();

    $('#about-toggle').click(function() {
        $('#about-netention').fadeIn();
    });

	


});
