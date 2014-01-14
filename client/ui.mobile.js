function showAvatarMenu(b) {
    var vm = $('#ViewMenu');
    if (!b) {
        $('#close-menu').hide();
        $('#AvatarButton').hide();
        vm.fadeOut();
        $('#toggle-menu').show();
    }
    else {
        $('#toggle-menu').hide();
        vm.fadeIn();
        $('#close-menu').show();
        $('#AvatarButton').show();
        vm.show();
    }
}

function openSelectProfileModal(title) {
	if (!title) title = 'Profiles';
    //var d = newPopup(title, {width: '450px', modal: true});
	$('#LoadingSplash').show();
	$('#LoadingSplashTitle').html('Authenticated: ' + getCookie('authenticated'));
	$('#LoadingSplashTitle').append(' (<a href="/logout">Logout</a>)');
	$('#AuthSelect').hide();
	$('#ProfileSelect').html(newProfileWidget());
}

$('#SelectProfileButton').click(function() { openSelectProfileModal()  });

$('#ViewMenu input').click(function(x) {
    var b = $(this);
    var v = b.attr('id');
    if ((b.attr('type') === 'text') || (b.attr('type') === 'checkbox'))
        return;
    $('#ViewControls').buttonset('refresh');
    self.save('currentView', v);
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
	newPopupObjectEdit( objNew() );
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

if (configuration.initialDisplayAvatarMenu)
    showAvatarMenu(true);
else
    showAvatarMenu(false);


function startTalk() {

	TogetherJSConfig_on_ready = function () {};
	TogetherJSConfig_getUserName = function () {
		return self.myself().name;
	};
	//TogetherJSConfig_getUserAvatar = function () {return avatarUrl;};

	TogetherJSConfig_suppressJoinConfirmation = true;
	TogetherJSConfig_suppressInvite = true;

	//TogetherJS.refreshUserData()
	TogetherJS(this);

}
