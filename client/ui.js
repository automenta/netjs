"use strict";

jQuery.timeago.settings.allowFuture = true;
jQuery.timeago.settings.strings = {
    prefixAgo: null,
    prefixFromNow: null,
    suffixAgo: "ago",
    suffixFromNow: "from now",
    inPast: 'any moment now',
    seconds: "<1 minute",
    minute: "~1 minute",
    minutes: "%d minutes",
    hour: "~1 hour",
    hours: "~%d hours",
    day: "1 day",
    days: "%d days",
    month: "~1 month",
    months: "%d months",
    year: "~1 year",
    years: "%d years",
    wordSeparator: " ",
    numbers: []
};


//$.pnotify
var stack_bottomleft = {"dir1": "right", "dir2": "up", "push": "top"};
var stack_bottomright = {"dir1": "left", "dir2": "up", "push": "top"};


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
                var o = $N.getObject(aoid);
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

        $('#ActionMenuWrapper').empty();

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
    if (!$N.myself())
        return;

    $('.brand').html($N.myself().name);

    var avatarURL = getAvatarURL($N.myself());
    $('#avatar-img').attr('src', avatarURL);
    $('#toggle-img').attr('src', avatarURL);
}

function updateViewControls() {
    //select the current view in the ViewControls

    //TODO uncheck all that are checked


}


var _firstView = true;

function _updateView(force) {
    

    updateBrand();

    //s.saveLocal();

    var view = $N.get('currentView');
    if (!view) {
        if (configuration.initialView) {
            view = configuration.initialView;
        }
		else {
			return;
		}
    }

    var param = null;

    if (view.view) {
        param = _.clone(view);
        view = view.view;
        delete param.view;
    }

    var vw = $('#ViewWrapper');

    var o = $('#ViewOptions');
    var submenu = $('#AvatarViewMenu');

    if (vw.is(':visible')) {
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

	$('#View').remove();
    var v = newDiv().attr('id', 'View').appendTo(vw);

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
        vw.addClass('overthrow view-indented');
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

    if (configuration.device == configuration.MOBILE) {
        //auto-hide the menu
        if (!_firstView)
            showAvatarMenu(false);
        else
            _firstView = false;
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
                    $N.set('currentView', views[I]);
                    updateViewControls();
                });
                return false;
            })
        };
        f(i);
    }

    var viewDelta = function(delta) {
        var currentIndex = _.indexOf(views, $N.get('currentView'));
        var nextIndex = currentIndex + delta;

        if (nextIndex < 0)
            nextIndex = views.length - 1;
        if (nextIndex >= views.length)
            nextIndex = 0;

        later(function() {
            $N.set('currentView', views[nextIndex]);
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

function viewRead(urlstring) {
    var urls = urlstring.split('+');

    var f = objNew();
    
    _.each(urls, function(u) {        
        var x = objNew();
        x.id = 'read:' + u;
        x.name = u;
        x.addTag(x.id);
        f.addTag(x.id);
        
        $.get(u, function(h) {           
            var ext = u.split('.');
            var type = 'html';
            if (ext.length > 1) {
                ext = ext[ext.length-1];
                if (ext === 'md')
                    type = 'markdown';
                else if (ext === 'html')
                    type = 'html';
            }
            
            x.add('media', { content: h, type: type }  );
            $N.notice(x);    
        }).error(function(e) {
            x.addDescription('Error Loading', JSON.stringify(e));
            $N.notice(x);
        });
    });

    
    f.author = $N.id();
    f.focus = 'change';

    $N.set('currentView', 'browse');
    
    focusValue = f;    
    renderFocus(false);

}


function setTheme(t) {
    if (!t)
        t = configuration.defaultTheme;
    if (!_.contains(_.keys(themes), t))
        t = configuration.defaultTheme;

    var oldTheme = $N.get('theme');
    if (oldTheme !== t) {
        $N.save('theme', t);
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



function freetileView() {
    if (window.$N)
        if ($('.tiled').length > 0) {
            $('#View').freetile({
                callback: function() {
                    $('#View').css('height', '100%');
                }
            });
        }
}

function whenResized() {
    var isMobile = window.matchMedia("only screen and (max-width: 700px)");

    configuration.MOBILE = 0;
    configuration.DESKTOP = 1;

    if (isMobile.matches) {
        configuration.device = configuration.MOBILE;
    }
    else {
        configuration.device = configuration.DESKTOP;
    }

    freetileView();
    return true;
}

$(document).ready(function() {

    $(window).resize(whenResized);
    whenResized();

    if (configuration.enableTogetherJS) {
        loadJS('https://togetherjs.com/togetherjs-min.js');
        $('#TogetherJSTalk').show();
    }
    else {
        TogetherJS = null;
    }

    if (configuration.enableAnonymous)
        $('#AnonymousLoginButton').show();


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
        var ph = hashpassword($('#login_password').val());

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
                        "read/*url": "read"
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
                        $N.set('currentView', view);
                    },
                    user: function(userid) {
                        $N.set('currentView', {view: 'user', userid: userid});
                    },
                    read: function(url) {
                        later(function(){
                            viewRead(url);                            
                        });
                    }

                });


                updateViewControls();

                $('body.timeago').timeago();

                var viewUpdateMS = configuration.viewUpdateTime[configuration.device][0];
                var viewDebounceMS = configuration.viewUpdateTime[configuration.device][1];
                var firstViewDebounceMS = configuration.viewUpdateTime[configuration.device][2];
                var firstView = true;
                
                var throttledUpdateView = _.throttle(function() {
                    later(function() {
                        _updateView();
                        if (firstView) {
                            updateView = _.debounce(throttledUpdateView, viewDebounceMS);                                 firstView = false;
                        }                        
                    });
                }, configuration.viewUpdateMS);
                
                updateView = _.debounce(throttledUpdateView, firstViewDebounceMS);


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

                    $('#ViewWrapper').show();
                    $('#LoadingSplash2').hide();


                    var alreadyLoggedIn = false;
                    if ((configuration.autoLoginDefaultProfile) || (configuration.connection == 'local')) {
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

                    $N.on('change:attention', updateView);
                    $N.on('change:currentView', updateView);
                    $N.on('change:tags', updateView);
                    $N.on('change:focus', updateView);

                    
                    initKeyboard();

                    var w = new Workspace();
                    $N.router = w;

                    
                     //USEFUL FOR DEBUGGING EVENTS:
					 /*
                     $N.on('change:attention', function() { console.log('change:attention'); });
                     $N.on('change:currentView', function() { console.log('change:currentView'); });
                     $N.on('change:tags', function() { console.log('change:tags'); });
                     $N.on('change:focus', function() { console.log('change:focus', $N.focus() ); });
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
    $("#ViewSelect .ViewControl").click(function() {
        var v = $(this);
        var vi = v.attr('id');
        $N.router.navigate(vi, {trigger: false});
        $N.set('currentView', vi);
    });

    $('#about-toggle').click(function() {
        $('#about-netention').fadeIn();
    });




});


//http://stackoverflow.com/questions/918792/use-jquery-to-change-an-html-tag
$.extend({
    replaceTag: function(currentElem, newTagObj, keepProps) {
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

function isFocusClear() {
    if (!focusValue)
        return true;

    if (focusValue.value)
        if (focusValue.value.length > 0)
            return false;
    if (focusValue.when)
        return false;
    if (focusValue.where)
        return false;
    if (focusValue.who)
        return false;
    if (focusValue.userRelation)
        return false;
    return true;
}

var focusValue;
function clearFocus() {
    $('#FocusKeywords').val('');
    focusValue = {when: null, where: null};
    //userRelation = null
    $('#FocusClearButton').hide();
}
clearFocus();

function renderFocus(skipSet) {
    if (!skipSet)
        $N.setFocus(focusValue);

    var fe = $('#FocusEdit');
    fe.empty();

    var newFocusValue = _.clone(focusValue);

    var noe = newObjectEdit(newFocusValue, true, true, function(xx) {
        focusValue = xx;
        renderFocus();
    }, function(x) {
        focusValue = x;
        $N.setFocus(x);
    }, ['spacepoint']); //do not show spacepoint property, custom renderer is below

    if (!isFocusClear())
        $('#FocusClearButton').show();
    else
        $('#FocusClearButton').hide();

    noe.find('.tagSuggestionsWrap').remove();

    fe.append(noe);

    if ((configuration.avatarMenuTagTreeAlways) || (focusValue.what)) {
        var tt = newFocusTagTree(focusValue, function(tag, newStrength) {

            var tags = objTags(focusValue);
            var existingIndex = _.indexOf(tags, tag);

            if (existingIndex != -1)
                objRemoveValue(focusValue, existingIndex);

            if (newStrength > 0) {
                objAddTag(focusValue, tag, newStrength);
            }

            renderFocus();
        });
        tt.attr('style', 'height: ' + Math.floor($(window).height() * 0.4) + 'px !important');
        fe.append(tt);
    }
    if (focusValue.when) {
    }

    if (focusValue.who) {
        fe.append('User: ' + $N.getObject(focusValue.who).name + '<br/>');
    }
    if (focusValue.userRelation) {
        if (focusValue.userRelation.itrust) {
            fe.append('Sources I Trust<br/>');
        }
        if (focusValue.userRelation.trustme) {
            fe.append('Sources Trusting Me<br/>');
        }
    }

    var where = objSpacePointLatLng(focusValue);
    if (where) {
        var uu = uuid();
        var m = newDiv(uu);
        m.attr('style', 'height: 250px; width: 95%');	//TODO use css
        fe.append(m);
        var lmap = initLocationChooserMap(uu, where, 3);
        lmap.onClicked = function(l) {
            var newFocus = _.clone(focusValue);
            objSetFirstValue(newFocus, 'spacepoint', {lat: l.lat, lon: l.lon, planet: 'Earth'});
            $N.setFocus(newFocus);
        };
    }
}



//Global Prototype Modifications

$.fn.extend({
    replaceTag: function(newTagObj, keepProps) {
        this.each(function() {
            jQuery.replaceTag(this, newTagObj, keepProps);
        });
    }
});

String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};
