/*!
 * index.js
 */

"use strict";

var FOCUS_KEYWORD_UPDATE_PERIOD = 1500; //milliseconds
var viewDebounceMS = 100;

var updateView;


var lastView = null;
var currentView = null;

var Actions = [];
var ActionMenu = {};


function loadCSS(url, med) {
    $(document.head).append(
            $("<link/>")
            .attr({
                rel: "stylesheet",
                type: "text/css",
                href: url,
                media: (med !== undefined) ? med : ""
            })
    );
}

function loadJS(url) {
    $(document.head).append(
            $("<script/>")
            .attr({
                type: "text/javascript",
                src: url
            })
            );
}

function later(f) {
    //setTimeout(f, 0);
    setImmediate(f);
}

var stack_bottomleft = {"dir1": "right", "dir2": "up", "push": "top"};



function addAction(a) {
    if (!a.menu) 	//{ 		console.error('addAction missing menu: ' + a); 	return; 	}
        a.menu = 'Other';
    if (!a.name) {
        console.error('addAction missing name: ' + a);
        return;
    }
    if (!a.accepts) //{ 		console.error('addAction missing accepts: ' + a); 	return; 	}
        a.accepts = function() {
            return false;
        }

    Actions.push(a);
    if (!ActionMenu[a.menu])
        ActionMenu[a.menu] = [];
    ActionMenu[a.menu].push(a);
}

function newContextMenu(s, excludeEmptyMenus, clickCallback) {
    //s = list of objects

    var u = $('<ul class="ActionMenu"></ul>');

    /*u.append('<li><a href="#">Action1</a></li>');
     u.append('<li><a href="#">SubMenu</a><ul><li><a href="#">Action2</a></li></ul></li>');*/

    _.each(ActionMenu, function(v, k) {
        var menu = k;
        var submenu = $('<li><a href="#">' + menu + '</a></li>');
        var subcontents = $('<ul style="width: 80%"></ul>');
        submenu.append(subcontents);

        var added = 0;

        _.each(v, function(vv) {
            var a = $('<a href="#">' + vv.name + '</a>');

            if (vv.description)
                a.attr('title', vv.description);

            var accepts = vv.accepts(s);

            if (accepts) {
                var clickFunction = function() {
                    if (vv.run) {
                        later(function() {
                            var result = vv.run(s);
                            if (result)
                                $.pnotify(result);
                        });
                    }
                    else {
                        $.pnotify('"' + vv.name + '" not ready yet.');
                    }

                    if (clickCallback)
                        clickCallback(vv.name);
                }
                added++;
            }
            else {
                if (excludeEmptyMenus)
                    return;

                a.attr('style', 'opacity: 0.4');
                a.attr('disabled', 'true');
            }

            a.click(clickFunction);

            var la = $('<li></li>');
            la.append(a);
            subcontents.append(la);
        });

        if ((added == 0) && (excludeEmptyMenus))
            return;

        u.append(submenu);

    });

    u.menu();

    return u;
}

var refreshActionContext = _.throttle(function() {
    later(function() {
        var s = [];

        //get selected items from .ObjectSelection
        $('.ObjectSelection:checked').each(function(index) {
            var x = $(this);
            var aoid = x.attr('oid');
            if (aoid) {
                var o = self.getObject(aoid);
                if (o)
                    s.push(o);
            }
        });

        //jquery menu - http://jqueryui.com/menu/#default

        /*if ($('.ActionMenu').destroy)
         $('.ActionMenu').destroy();*/

        //dont render the menu if the wrapper isnt visible:
        if (!$('#ActionMenuWrapper').is(':visible')) {
            return;
        }

        $('#ActionMenuWrapper').html('');

        if (s.length == 0)
            return;

        var u = newContextMenu(s);
        u.addClass('ActionMenuGlobal');

        var selectedLabel = $('<div style="float:right"><i>' + s.length + ' selected. </i></div>');

        var clearButton = $('<button>Clear</button>');
        clearButton.click(function() {
            later(function() {
                $('.ObjectSelection:checked').each(function(index) {
                    var x = $(this);
                    x.prop('checked', false);
                });
                refreshActionContext();
            });
        });
        selectedLabel.append(clearButton);

        u.append(selectedLabel);


        $('#ActionMenuWrapper').append(u);
    });
}, 850);


function updateBrand() {
    if (!self.myself())
        return;

    $('.brand').html(self.myself().name);

    var avatarURL = getAvatarURL(self.myself());
    $('#avatar-img').attr('src', avatarURL);
    $('#toggle-img').attr('src', avatarURL);
}

function updateViewControls() {
    //select the current view in the ViewControls

    //TODO uncheck all that are checked


}


function _updateView(force) {

    var s = window.self;

    updateBrand();

    //s.saveLocal();

    var view = s.get('currentView');
    var param = null;

    if (view.view) {
        param = _.clone(view);
        view = view.view;
        delete param.view;
    }

    var o = $('#ViewOptions');
    var v = $('#View');
    var submenu = $('#AvatarViewMenu');

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

    v.empty();
    o.empty();
    $('#AvatarViewMenu').empty();
    submenu.empty();

    updateIndent(false);

    lastView = view;
	$('#ViewMenu a').removeClass('ViewActive');
	$('#' + view).addClass('ViewActive');

    if (currentView)
        if (currentView.destroy)
            currentView.destroy();

    v.css('font-size', '100%').removeClass('ui-widget-content view-indented overthrow overflow-hidden nobg');

    function indent() {
        submenu.show();
        v.addClass('overthrow ui-widget-content view-indented');
        updateIndent($('#ViewMenu').is(":visible"));
    }


    if (view === 'browse') {
        indent();
        currentView = newListView(v);
    }
    else if (view === 'us') {
        indent();
        currentView = newUsView(v);
    }
    else if (view === 'map') {
        v.addClass('overflow-hidden');
        v.addClass('nobg');
        currentView = newMapView(v);
    }
    else if (view === 'trends') {
        indent();
        currentView = newTrendsView(v);
    }
    else if (view === 'graph') {
        v.addClass('overflow-hidden');
        currentView = newGraphView(v);
    }
    else if (view === 'wiki') {
        indent();
        currentView = newWikiView(v);
    }
    else if (view === 'options') {
        indent();
        currentView = renderOptions(s, o, v);
    }
    else if (view === 'chat') {
        indent();
        currentView = newChatView(v);
    }
    else if (view === 'share') {
        indent();
        currentView = newShareView(v);
    }
    else if (view === 'templates') {
        indent();
        currentView = newTemplatesView(v);
    }
    else if (view === 'user') {
        indent();
        currentView = newUserView(v, param ? param.userid : null);
    }
    else if (view === 'main') {
        indent();
        currentView = newMainView(v);
    }   
    else if (view === 'time') {
        indent();
        currentView = newTimeView(v);
    }   
    else {
        v.html('Unknown view: ' + view);
        currentView = null;
    }


}


function initKeyboard() {
    var views = [];
    $('.ViewControl').each(function(x) {
        views.push($(this).attr('id'));
    });

    for (var i = 0; i < views.length; i++) {
        var f = function(I) {
            jwerty.key('ctrl+' + (1 + I), function() {
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
        var currentIndex = _.indexOf(views, self.get('currentView'));
        var nextIndex = currentIndex + delta;

        if (nextIndex < 0)
            nextIndex = views.length - 1;
        if (nextIndex >= views.length)
            nextIndex = 0;

        later(function() {
            self.set('currentView', views[nextIndex]);
            updateViewControls();
        });
    };


    jwerty.key('esc', function() {
        toggleAvatarMenu();
        return false;
    });
    jwerty.key('ctrl+[', function() {
        viewDelta(-1);
        return false;
    });
    jwerty.key('ctrl+]', function() {
        viewDelta(+1);
        return false;
    });
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
        themeURL = 'lib/jquery-ui/1.10.4/themes/' + t + '/jquery-ui.min.css';
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


    if (configuration.enableTogetherJS) {
        loadJS('https://togetherjs.com/togetherjs-min.js');
        $('#TogetherJSTalk').show();
    }
    else {
        TogetherJS = null;
    }

    if (configuration.enableAnonymous)
        $('#AnonymousLoginButton').show();

    if (configuration.focusEnable)
        $('#AvatarFocus').show();

    $('title').html(configuration.siteName);
    $('#loginLogo').attr('src', configuration.loginLogo);
    if (configuration.favicon)
        $('#favicon').attr('href', configuration.favicon);

    var conviews = configuration.views;
    for (var i = 0; i < conviews.length; i++) {
        var c = conviews[i];
        $('#' + c).show();
    }

    $('#openid-open').click(function() {
        $('#password-login').hide();
        $('#openid-login').fadeIn();
    });
	$('#password-open').click(function() {
        $('#openid-login').hide();
        $('#password-login').fadeIn();
    });
	$('#password-login-login').click(function() {
		var u = $('#login_email').val();
		var ph = hashpassword( $('#login_password').val() );

		window.location.href = '/login?username=' + encodeURIComponent(u) + '&password=' + ph; 
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

    $('#NotificationArea').html('Loading...');

    netention(function(schemaURL, $N) {
        $('#NotificationArea').html('System loaded.');

        window.self = $N; //DEPRECATED
        window.$N = $N;

        setTheme($N.get('theme'));

        $N.clear();

        $N.loadOntology(schemaURL, function() {
            $('#NotificationArea').html('Ontology ready. Loading objects...');

            $N.getUserObjects(function() {

                $N.listenAll(true);

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
                        "example": "completeExample",
                        "user/:userid": "user",
                        ":view": "view",
                        //"search/:query/:page":  "query"   // #search/kiwis/p7
                    },
                    me: function() {
                        commitFocus($N.myself());
                    },
                    completeExample: function() {
                        commitFocus(exampleObject);
                    },
                    showObject: function(id) {
                        var x = $N.getObject(id);
                        if (x) {
                            newPopupObjectView(x);
                        }
                        else {
                            /*$.pnotify({
                             title: 'Unknown object',
                             text: id.substring(0, 4) + '...'
                             });*/
                        }
                    },
                    view: function(view) {
                        self.set('currentView', view);
                    },
                    user: function(userid) {
                        self.set('currentView', {view: 'user', userid: userid});
                    }

                });

                var w = new Workspace();
                Backbone.history.start();
                $N.router = w;

                if (!$N.get('currentView')) {
                    if (configuration.initialView) {
                        $N.save('currentView', configuration.initialView);
                    }
                }

                updateViewControls();

                $('body').timeago();
                
                updateView = _.debounce(_.throttle(function() {
                    later(function() {
                        _updateView();
                    });
                }, configuration.viewUpdateMS), viewDebounceMS);


                var msgs = ['I think', 'I feel', 'I wonder', 'I know', 'I want'];
                //var msgs = ['Revolutionary', 'Extraordinary', 'Bodacious', 'Scrumptious', 'Delicious'];
                function updatePrompt() {
                    var l = msgs[parseInt(Math.random() * msgs.length)];
                    $('.nameInput').attr('placeholder', l + '...');
                }
                setInterval(updatePrompt, 7000);
                updatePrompt();

                $.getScript(configuration.ui, function(data) {

                    var ii = identity();

                    if (ii === ID_AUTHENTICATED) {
                        $('#NotificationArea').html('Authorized.');
                    }
                    else if (ii === ID_ANONYMOUS) {
                        $('#NotificationArea').html('Anonymous.');
                    }
                    else {
                        $('#NotificationArea').html('Read-only public access.');
                        /*$('.loginlink').click(function() {
                         $('#LoadingSplash').show();
                         nn.hide();
                         });*/
                    }

                    $('#View').show();
                    $('#LoadingSplash2').hide();

                    $N.on('change:attention', updateView);
                    $N.on('change:currentView', updateView);
                    $N.on('change:tags', updateView);
                    $N.on('change:focus', updateView);


	                var alreadyLoggedIn = false;
	                if ((configuration.autoLoginDefaultProfile) || (configuration.connection=='local')) {
	                    var otherSelves = _.filter($N.get("otherSelves"), function(f) {
	                        return $N.getObject(f) != null;
	                    });
	                    if (otherSelves.length >= 1) {
	                        $N.become(otherSelves[0]);
	                        alreadyLoggedIn = true;
	                    }
	                }


                    if (!alreadyLoggedIn) {
                        if (isAnonymous()) {
                            //show profile chooser
                            openSelectProfileModal("Anonymous Profiles");
                        }
                        else if ($N.myself() === undefined) {
                            if (configuration.requireIdentity)
                                openSelectProfileModal("Start a New Profile");
                            else {
                                //$N.trigger('change:attention');
                                updateView();
                            }
                        }
                    }

                    $('#NotificationArea').html('Ready...');
                    $('#NotificationArea').fadeOut();

                    initKeyboard();


                    /*
                     //USEFUL FOR DEBUGGING EVENTS:
                     $N.on('change:attention', function() { console.log('change:attention'); });
                     $N.on('change:currentView', function() { console.log('change:currentView'); });
                     $N.on('change:tags', function() { console.log('change:tags'); });
                     $N.on('change:focus', function() { console.log('change:focus'); });
                     */

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
    $(".ViewControl").click(function() {
        var v = $(this);
        var vi = v.attr('id');
        $N.router.navigate(vi, {trigger: false});
        self.set('currentView', vi);
    });

    $('#about-toggle').click(function() {
        $('#about-netention').fadeIn();
    });




});


//http://stackoverflow.com/questions/918792/use-jquery-to-change-an-html-tag
$.extend({
    replaceTag: function (currentElem, newTagObj, keepProps) {
        var $currentElem = $(currentElem);
        var i, $newTag = $(newTagObj).clone();
        if (keepProps) {//{{{
            var newTag = $newTag[0];
            newTag.className = currentElem.className;
            $.extend(newTag.classList, currentElem.classList);
            $.extend(newTag.attributes, currentElem.attributes);
        }//}}}
        $currentElem.wrapAll($newTag);
        $currentElem.contents().unwrap();
        //return node;
    }
});

$.fn.extend({
    replaceTag: function (newTagObj, keepProps) {
        this.each(function() {
            jQuery.replaceTag(this, newTagObj, keepProps);
        });
    }
});
