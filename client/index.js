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

                //select the current view in the ViewControls
                $('#ViewControls #' + self.get('currentView')).attr('checked', true);
                $('#ViewControls').buttonset('refresh');

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

                    $('#View').show();
                    $('#LoadingSplash2').hide();

                    if (isAnonymous()) {
                        //show profile chooser
                        openSelectProfileModal("Anonymous Profiles");
                    }
                    else if (self.myself() === undefined) {
                        if (configuration.requireIdentity)
                            openSelectProfileModal("Start a New Profile");
                    }
                });

                var ii = identity();

                if (ii === ID_AUTHENTICATED) {
                    $.pnotify({
                        title: 'Authorized.',
                        text: self.myself().name
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
    $('#openid-toggle').click(function() {
        $('#openid-login').fadeIn();
    });

    var focusValue;
    function clearFocus() {
        $('#FocusKeywords').val('');
        focusValue = {tags: [], when: null, where: null};
    }
    clearFocus();

    function renderFocus() {
        self.setFocus(focusValue);

        var fe = $('#FocusEdit');
        fe.html('');
        var noe = newObjectEdit(focusValue, true, true, function(xx) {
            focusValue = xx;
            renderFocus();
        }, function(x) {
            focusValue = x;
            self.setFocus(x);
        });

        fe.append(noe);


        if (focusValue.when) {
        }
        if (focusValue.where) {
            var uu = uuid();
            var m = newDiv(uu);
            m.attr('style', 'height: 150px; width: 95%');	//TODO use css
            fe.append(m);
            var lmap = initLocationChooserMap(uu, focusValue.where, 3);
        }
    }

    $('#FocusWhereButton').click(function() {
        if (!focusValue.where) {
            focusValue.where = _.clone(objSpacePoint(self.myself()) || {lat: 40, lon: -79, planet: 'Earth'});
            renderFocus();
        }
        else {
            if (confirm("Remove focus's 'Where'?")) {
                focusValue.where = null;
                renderFocus();
            }
        }
    });

    var periodMS = FOCUS_KEYWORD_UPDATE_PERIOD;
    var ty = _.throttle(function() {
        var t = $('#FocusKeywords').val();
        focusValue.name = t;
        self.setFocus(focusValue);
    }, periodMS);

    $('#FocusKeywords').keyup(
            function() {
                ty();
            }
    );


    $('#FocusClearButton').click(function() {
        clearFocus();
        renderFocus();
    });

    $('#FocusWhatButton').click(function() {
        var d = newPopup("Focus on Tags", {width: 800, height: 600, modal: true});
        d.append(newTagger([], function(x) {
            for (var i = 0; i < x.length; i++)
                objAddTag(focusValue, x[i]);

            renderFocus();
            d.dialog('close');
        }));
    });
    $('#FocusWhenButton').click(function() {
        objAddValue(focusValue, {id: 'timerange', value: {from: 0, to: 0}});
        renderFocus();
    });

    //TODO ABSTRACT this into a pluggable focus template system

    $('#FocusNeedButton').click(function() {
        var needs = ['Volunteer', 'Shelter', 'Food', 'Tools', 'Health', 'Transport', 'Service', 'Animal'];
        _.each(needs, function(n) {
            objAddValue(focusValue, {id: n});
        });
        renderFocus();
    });
});
