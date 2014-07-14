//Personas (profile) widgets

function openSelectProfileModal(title) {
    if (!title)
        title = 'Profiles';
    //var d = newPopup(title, {width: '450px', modal: true});
    
    $('#LoadingSplash').show();
    
    var s;
    var ident = identity();
    if (ident == ID_AUTHENTICATED) {
        s = 'Authenticated: ' + getCookie('account');
    }
    else if (ident == ID_ANONYMOUS) {
        s = 'Anonymous';
    }
    else {
        s = 'Unidentified';
    }
    
    $('#LoadingSplashTitle').html(
            (configuration.connection == 'static') ?
            '' :
            s
            );
    
    $('#LoadingSplashTitle').append(
            (configuration.connection == 'static') ?
            '' :
            ' (<a href="/logout">Logout</a>)'
            );
    $('#AuthSelect').hide();
    $('#ProfileSelect').html(newProfileWidget());
}


function newProfileWidget() {
    var d = newDiv();


    function closeDialog() {
        //d.parent().dialog('close');
        $('#LoadingSplash').hide();
    }

    function become(u) {
        $N.become(u);
    }

    var selector = $('<select/>');
    var okButton = $('<button autofocus="autofocus"><b>Become</b></button>');
    var deleteButton = $('<button>Delete</button>');

    function disableBecome() {
        /*
         selector.attr('disabled', 'disabled');
         okButton.attr('disabled', 'disabled');
         deleteButton.attr('disabled', 'disabled');*/
        d.empty();
    }

    var otherSelves = $N.get('otherSelves');

    /*if (!otherSelves) {
     if ($N.myself())
     selector.append('<option>' + $N.myself().name + '</option>');
     disableBecome();
     }
     else*/
    var c = 0;
    if (otherSelves) {
        for (var i = 0; i < otherSelves.length; i++) {
            var s = otherSelves[i];
            var o = $N.getObject(s);
            if (o) {
                var n = o.name;
                var selString = (o.id === $N.id()) ? 'selected' : '';
                selector.append('<option value="' + s + '" ' + selString + '>' + n + '</option>');
                c++;
            }
            else {
                //console.log('unknown self: ' + s);
            }
        }
    }

	if (identity() === ID_UNKNOWN) {
		$('#LoadingSplashTitle').html('<a href="/login">Login</a>');
	}
    else if (c === 0) {
        d.empty().append(newNewProfileWidget(function(user) {
            become(user);
            closeDialog();
        }));
    }
    else {

        okButton.click(function() {
            var id = selector.val();
            if (id) {
                become($N.getObject(id));
                closeDialog();
            }
        });

        deleteButton.click(function() {
            if (confirm('Permanently delete?')) {
                $N.deleteSelf(selector.val());
                closeDialog();
            }
        });


        var newButton = $('<button>New Profile...</button>');
        newButton.click(function() {
            newButton.hide();
            d.append(newNewProfileWidget(function(user) {
                become(user);
                closeDialog();
            }));
        });

        d.append(selector).append(okButton).append(deleteButton).append('<hr/>').append(newButton);
    }

    return d;
}

function newNewProfileWidget(whenFinished) {
    var d = newDiv();

    var nameField = $('<input type="text" placeholder="Name"></input>');
    d.append(nameField).append('<br/>');


    var emailField = $('<input type="text" placeholder="E-Mail (optional)"></input>');
    d.append(emailField).append('<br/>');

    var extraProperties = configuration.newUserProperties;
    if (extraProperties) {
        var extraPropertyInputs = [];
        for (var i = 0; i < extraProperties.length; i++) {
            var e = extraProperties[i];
            var ep = $N.getProperty(e);
            var en = ep ? ep.name : e;
            var ei = $('<input type="text"/>');
            d.append(en, ei, '<br/>');
            extraPropertyInputs.push(ei);
        }
    }


    var locationEnabled = true;
    var locEnabled = $('<input type="checkbox" checked="true"/>');

    d.append('<br/>').append(locEnabled).append('Location Enabled').append('<br/>');

    var cm = $('<div id="SelfMap"/>').appendTo(d);

    var createButton = $('<button>Create User</button>');
    d.append('<br/>').append(createButton);

    var location = configuration.mapDefaultLocation;

    var lmap;
    later(function() {
        lmap = initLocationChooserMap('SelfMap', location, 7, true);
    });

    locEnabled.change(function() {
        locationEnabled = locEnabled.is(':checked');
        if (locationEnabled) {
            cm.show();
        }
        else {
            cm.hide();
        }
    });


    createButton.click(function() {
        var name = nameField.val();
        if (name.length == 0) {
            alert('Enter a name');
            return;
        }
        var email = emailField.val();

		var o = $N.newUser(name);

        if (extraProperties) {
            for (var i = 0; i < extraProperties.length; i++) {
                o.add(extraProperties[i], extraPropertyInputs[i].val());
            }
        }

        var location = lmap.location();
        if (locationEnabled)
            objSetFirstValue(o, 'spacepoint', {lat: location.lat, lon: location.lon, planet: 'Earth'});

        if (email.length > 0) {
            objSetFirstValue(o, 'email', email);
        }

        whenFinished(o);
    });

    return d;
}


function newRosterWidget(full) {
    if (!$N.get('roster')) {
        $N.updateRoster();
    }

    var d = newDiv();

    var wasAttached = false;

    var updateRosterDisplay = function() {

        var attached = d.closest(document.documentElement).length > 0;
        if ((!attached) && (wasAttached)) {
           $N.off('change:roster', this);
           return;
        }
        else {
            wasAttached = true;
        }

        var r = $N.get('roster');
        d.empty();
        if (!r)
            return;

        _.keys(r).forEach(function(uid) {
            var U = $N.instance[uid];
            if (U) {
                if ((full && (uid != $N.id())) || (!full)) {
                    var a = newAvatarImage(U).appendTo(d);
                    a.click(function() {
                        newPopupObjectView(U);
                    });
                    if (full && configuration.webrtc && (uid != $N.id())) {
                        var webrtc = r[uid];
                        if (Array.isArray(webrtc)) {
                            a.css('padding-left', '1.85em');
                            webrtc.forEach(function(i) {
                                newEle('button').html('&gt;').attr('title', 'Private Call ' + i).data('webrtc', [uid, i])
                                    .click(function() {
                                        var w = $(this).data('webrtc');
                                        newWebRTCCall(w[1]);
                                        return false;
                                    })
                                    .appendTo(a);
                            });
                        }
                    }
                }

            }
        });
    };

    $N.on('change:roster', updateRosterDisplay);

    d.destroy = function() {
        $N.off('change:roster', updateRosterDisplay);
    };


    updateRosterDisplay();

    return d;
}
