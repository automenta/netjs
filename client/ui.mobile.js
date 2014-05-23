function startTalk() {

    TogetherJSConfig_on_ready = function() {
    };
    TogetherJSConfig_toolName = 'Collaboration';
    TogetherJSConfig_getUserName = function() {
        return $N.myself().name;
    };
    //TogetherJSConfig_getUserAvatar = function () {return avatarUrl;};

    TogetherJSConfig_dontShowClicks = true;
    TogetherJSConfig_suppressJoinConfirmation = true;
    TogetherJSConfig_suppressInvite = true;

    //TogetherJS.refreshUserData()
    TogetherJS(this);

}

function toggleAvatarMenu() {
    showAvatarMenu(!$('#ViewMenu').is(':visible'));
}

function updateIndent(viewmenushown) {
    if (viewmenushown) {
        $('.view-indented').addClass('view-indented-more');
    }
    else {
        $('.view-indented').removeClass('view-indented-more');
    }
    reflowView();
}

function showAvatarMenu(b) {
    var vm = $('#ViewMenu');
    if (!b) {
        $('#close-menu').hide();
        $('#AvatarButton').hide();
        vm.fadeOut();
        $('#toggle-menu').show();
        updateIndent(false);
    }
    else {
        $('#toggle-menu').hide();
        vm.fadeIn();
        $('#close-menu').show();
        $('#AvatarButton').show();
        updateIndent(true);
    }
}

function openSelectProfileModal(title) {
    if (!title)
        title = 'Profiles';
    //var d = newPopup(title, {width: '450px', modal: true});
    $('#LoadingSplash').show();
    $('#LoadingSplashTitle').html(
            (configuration.connection == 'local') ?
            '' :
            'Authenticated: ' + getCookie('authenticated')
            );
    $('#LoadingSplashTitle').append(
            (configuration.connection == 'local') ?
            '' :
            ' (<a href="/logout">Logout</a>)'
            );
    $('#AuthSelect').hide();
    $('#ProfileSelect').html(newProfileWidget());
}

$( "#FocusTabs" ).tabs({
  collapsible: true
});
  
$('#SelectProfileButton').click(function() {
    openSelectProfileModal()
});

$('#ViewMenu input').click(function(x) {
    var b = $(this);
    var v = b.attr('id');
    if ((b.attr('type') === 'text') || (b.attr('type') === 'checkbox'))
        return;
    $('#ViewControls').buttonset('refresh');
    $N.save('currentView', v);
    showAvatarMenu(false);
});


$('#toggle-menu').click(function() {
    var vm = $('#ViewMenu');
    var shown = vm.is(':visible');
    showAvatarMenu(!shown);
});
$('#close-menu').click(function() {
    var vm = $('#ViewMenu');
    var shown = vm.is(':visible');
    showAvatarMenu(!shown);
});
$('#AvatarButton').click(function() {
    showAvatarMenu(false);
});


$('#AddContentButton').click(function() {
    var o = objNew();
    var focus = $N.focus();
    if (focus)
        if (focus.value)
            o.value = focus.value;
    newPopupObjectEdit(o, {title: 'New...', width: '50%'});
});

$('#FocusButton').click(function() {
    /*
     <div id="Layer" class="ui-widget-header overthrow">
     </div>
     <span>
     <input type="text" placeholder="Filter" disabled/>
     <input type="checkbox" id="GeographicToggle">Exclude Un-Mappable</input>
     </span>                                                        
     */
});

if (configuration.avatarMenuDisplayInitially)
    showAvatarMenu(true);
else
    showAvatarMenu(false);



$('#FocusWhereButton').click(function() {
    if (!objSpacePointLatLng(focusValue)) {
        /*focusValue.where = _.clone(objSpacePoint($N.myself()) || 
         {lat: configuration.mapDefaultLocation[0] , lon: configuration.mapDefaultLocation[0], planet: 'Earth'});*/
        objSetFirstValue(focusValue, 'spacepoint', {lat: configuration.mapDefaultLocation[0], lon: configuration.mapDefaultLocation[1], planet: 'Earth'});
        renderFocus();
    }
    else {
        if (confirm("Remove focus's 'Where'?")) {
            var tags = objTags(focusValue, true);
            var spi = _.indexOf(tags, 'spacepoint');
            if (spi != -1)
                objRemoveValue(focusValue, spi);
            renderFocus();
        }
    }
});

/*
var periodMS = FOCUS_KEYWORD_UPDATE_PERIOD;
var ty = _.throttle(function() {
    var t = $('#FocusKeywords').val();
    var newFocus = _.clone(focusValue);
    newFocus.name = t;
    $N.setFocus(newFocus);
}, periodMS);

$('#FocusKeywords').keyup(
        function() {
            ty();
        }
);
*/


$('#FocusClearButton').click(function() {
    clearFocus();
    renderFocus();
});

$('#FocusWhatButton').click(function() {
    focusValue.what = !focusValue.what;
    renderFocus();
});
$('#FocusWhenButton').click(function() {
    objAddValue(focusValue, {id: 'timerange', value: {from: 0, to: 0}});
    renderFocus();
});

//TODO ABSTRACT this into a pluggable focus template system

$('#FocusNeedButton').click(function() {
    /*var needs = ['Volunteer', 'Shelter', 'Food', 'Tools', 'Health', 'Transport', 'Service', 'Animal'];
     //TODO select child tags of 'Support' (their parent tag) to avoid hardcoding it here
     _.each(needs, function(n) {
     objAddValue(focusValue, {id: n});
     });
     renderFocus();*/
    var d = newPopup("Add Focus Tags", true, true);
    d.append(newTagger([], function(x) {
        for (var i = 0; i < x.length; i++)
            objAddTag(focusValue, x[i]);

        renderFocus();
        d.dialog('close');
    }));

});

if (configuration.avatarMenuTagTreeAlways) {
    $('#FocusWhatButton').hide();
    renderFocus();	//force a render
}


