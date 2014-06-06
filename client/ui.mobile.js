function updateIndent(viewmenushown) {
    if (viewmenushown) {
        $('.view-indented').addClass('view-indented-more');
    }
    else {
        $('.view-indented').removeClass('view-indented-more');
    }
    reflowView();
}

function toggleAvatarMenu() {    showAvatarMenu(!$('#MainMenu').is(':visible'));  }

function showAvatarMenu(b) {
    var vm = $('#MainMenu');
    if (!b) {
        $('#close-menu').hide();
        $('#AvatarButton').hide();
        vm.fadeOut();
        $('#AvatarButtonMini').show();
        updateIndent(false);
    }
    else {
        $('#AvatarButtonMini').hide();
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
            (configuration.connection == 'local') ?
            '' :
            s
            );
    
    $('#LoadingSplashTitle').append(
            (configuration.connection == 'local') ?
            '' :
            ' (<a href="/logout">Logout</a>)'
            );
    $('#AuthSelect').hide();
    $('#ProfileSelect').html(newProfileWidget());
}

  

/*
$('#MainMenu input').click(function(x) {
    var b = $(this);
    var v = b.attr('id');
    if ((b.attr('type') === 'text') || (b.attr('type') === 'checkbox'))
        return;
    $('#ViewControls').buttonset('refresh');
    $N.save('currentView', v);
    showAvatarMenu(false);
});
*/

$('#AvatarButtonMini').click(function() {
    var vm = $('#MainMenu');
    var shown = vm.is(':visible');
    showAvatarMenu(!shown);
});
$('#close-menu').click(function() {
    var vm = $('#MainMenu');
    var shown = vm.is(':visible');
    showAvatarMenu(!shown);
});
$('#avatar-img').click(function() {
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
$('#SelectProfileButton').click(function() {
    openSelectProfileModal();
    return false;
});
$('#EditProfileButton').click(function() {
    newPopup("Profile", true, true).append(newObjectEdit($N.myself(), true));    
    return false;
});

var _mainChatWindow = null;
$('#ToggleChatButton').click(function() {
    if (!_mainChatWindow) {
        _mainChatWindow = newChannelPopup('!main');
        _mainChatWindow.bind('dialogclose', function(event) {
            _mainChatWindow.dialog('close');        
            _mainChatWindow.remove();
            _mainChatWindow = null;
        });
    }
    else {
        _mainChatWindow.dialog('close');   
    }
        
    return false;
})


$('#AvatarButton').hover(function() {
    $('#IdentityPopout').fadeIn();
}, function() {
    $('#IdentityPopout').fadeOut();    
});

initFocusButtons();

setViewLock(configuration.viewlockDefault);

$('#Roster').append(newRosterWidget());


