$.timeago.settings.allowFuture = true;
$.timeago.settings.strings = {
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
$.ajaxSetup({
  cache: true
});

var stack_bottomleft = {"dir1": "right", "dir2": "up", "push": "top"};
var stack_bottomright = {"dir1": "left", "dir2": "up", "push": "top"};

var TogetherJS;


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

    var u = newEle('ul').addClass('ActionMenu');

    _.each(ActionMenu, function(v, k) {
        var menu = k;
        var submenu = newEle('li').append(newEle('a').html(menu));
        var subcontents = newEle('ul').addClass('ActonMenuSubContents');
        submenu.append(subcontents);

        var added = 0;

        _.each(v, function(vv) {
            var a = newEle('a').html(vv.name);

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
                a.click(clickFunction);
                added++;
            }
            else {
                if (excludeEmptyMenus)
                    return;

                a.attr({
                    style: 'opacity: 0.4',
                    disabled: 'true'
                });
            }

            newEle('li').append(a).appendTo(subcontents);
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
            var aoid = $(this).parent().parent().attr('xid');
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

        var u = newContextMenu(s).addClass('ActionMenuGlobal');

        var selectedLabel = $('<div style="float:right"><i>' + s.length + ' selected. </i></div>');

        var clearButton = $('<button>Clear</button>');
        clearButton.click(function() {
            later(function() {
                $('.ObjectSelection:checked').each(function(index) {
                    $(this).prop('checked', false);
                });
                refreshActionContext();
            });
        });
        selectedLabel.append(clearButton);

        u.append(selectedLabel);


        $('#ActionMenuWrapper').append(u);
    });
}, configuration.viewUpdateTime[configuration.device || 1][0]);


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
    renderFocus(true);

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

    v.css('font-size', '100%').removeClass('ui-widget-content overflow-hidden nobg');
    vw.removeClass('view-indented overthrow');

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
    else if (view === 'notebook') {
        indent();
        currentView = newNotebookView(v);
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
                ext = ext[ext.length - 1];
                if (ext === 'md')
                    type = 'markdown';
                else if (ext === 'html')
                    type = 'html';
            }

            x.add(type, h);
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




var _reflowView;
function reflowView() {    
    if (!_reflowView) {
        _reflowView = _.debounce(function() {
            later(function() {
                $('#View').freetile({
                    callback: function() {
                        $('#View').css('height', '100%');
                    }
                });                
            });    
        }, configuration ? configuration.viewUpdateTime[configuration.device][1] : 200);
    }
    
    if (window.$N) {
        if ($('.tiled').length > 0) {
            _reflowView();
        }
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

    reflowView();
    return true;
}

$('#NotificationArea').html('Loading...');

$(document).ready(function() {
    $.pnotify.defaults.animation = 'none';
    

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


    netention(function(schemaURL, $N) {
        $('#NotificationArea').html('System loaded.');

        window.$N = $N;

        $N.loadOntology(schemaURL, function() {
            $('#NotificationArea').html('Ontology ready. Loading objects...');

            $N.getUserObjects(function() {
                
                setTheme($N.get('theme'));

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
                        later(function() {
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
                    $('#AvatarButton').addClass('ViewBusy');
                    later(function() {
                        _updateView();
                        if (firstView) {
                            updateView = _.debounce(throttledUpdateView, viewDebounceMS);
                            firstView = false;
                        }
                        $('#AvatarButton').removeClass('ViewBusy');
                    });
                }, viewUpdateMS);

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
                    $('#NotificationArea').hide();


                    //initKeyboard();

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
    var f = $N.focus();
    if (!f)
        return true;

    if (f.value)
        if (f.value.length > 0)
            return false;
    if (f.when)
        return false;
    if (f.where)
        return false;
    if (f.who)
        return false;
    if (f.userRelation)
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
later(clearFocus);

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

            if (existingIndex !== -1)
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
        var uu = duid();
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
    
    var tc = newTagCloud(function(filter) {
        later(function() {
            var f = new $N.nobject();
            _.keys(filter).forEach(function(t) {
                f.addTag(t);
            });
            $N.setFocus(f);
            renderFocus(true);            
        });
    });
    fe.append(tc);
    
}


function newTagCloud(onChanged) {
    var tagcloud = newDiv().addClass('FocusTagCloud').css('word-break','break-all');
    var browseTagFilters = {};
    
    var f =  $N.focus();
    var ft = objTags(f);
    ft.forEach(function(t) {
      browseTagFilters[t] = true;
    });


    function updateTagCloud() {
        var tagcount = $N.getTagCount();
        //TODO noramlize to 1.0
        var counts = _.values(tagcount);
        var minc = _.min(counts);
        var maxc = _.max(counts);
        if (minc!=maxc) {
            _.each(tagcount, function(v, k) {
                tagcount[k] = (v - minc) / (maxc-minc);
            });
        }
        
        var tags = _.keys(tagcount);
        tags.sort(function(a,b) {
           return tagcount[b] - tagcount[a]; 
        });
        
        tagcloud.empty();

        tags.forEach(function(k) {

            var t = $N.tag(k);
            var ti = tagcount[k];

            var name;
            if (t !== undefined)
                name = t.name;
            else
                name = k;

            var ab;

            function toggleTag(x) {
                return function() {
                    if (browseTagFilters[x]) {
                        delete browseTagFilters[x];
                        ab.css('opacity', 0.4);
                    }
                    else {
                        browseTagFilters[x] = true;
                        ab.css('opacity', 1.0);
                    }
                    if (onChanged)
                        onChanged(browseTagFilters);
                };
            }

            ab = newTagButton(t, toggleTag(k));
            var label = ab.html();
            ab.html('&nbsp;');
            ab.attr('title', label||k);

            ab.css('font-size', 200.0 * ( 0.5  + 0.5 * ti) + '%');            
            //ab.css('float','left');

            if (!browseTagFilters[k]) {
                ab.css('opacity', 0.4);
            }

            tagcloud.append(ab,'&nbsp;');

        });

    }

    updateTagCloud();

    tagcloud.update = updateTagCloud;

    return tagcloud;
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

var _duid = 0;
/** document unique ID */
function duid() {
    return '_' + (_duid++);
}
function _rgba(r, g, b, a) {
    return 'rgba(' + parseInt(256.0 * r) + ',' + parseInt(256.0 * g) + ',' + parseInt(256.0 * b) + ',' + a + ')';
}


/**
 * Converts an HSL color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes h, s, and l are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   Number  h       The hue
 * @param   Number  s       The saturation
 * @param   Number  l       The lightness
 * @return  Array           The RGB representation
 */
function hslToRgb(h, s, l) {
    var r, g, b;

    if (s == 0) {
        r = g = b = l; // achromatic
    } else {
        function hue2rgb(p, q, t) {
            if (t < 0)
                t += 1;
            if (t > 1)
                t -= 1;
            if (t < 1 / 6)
                return p + (q - p) * 6 * t;
            if (t < 1 / 2)
                return q;
            if (t < 2 / 3)
                return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        }

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }

    return [r * 255, g * 255, b * 255];
}




