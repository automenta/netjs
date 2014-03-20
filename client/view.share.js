/* Sharetribe.com inspired view */
function renderShare(v) {
    clearFocus();
    renderFocus();

    var frame = newDiv().addClass('Share').appendTo(v);
    
    var header = newDiv().addClass('Header').appendTo(frame);
	header.append('<span class="Logo">' + configuration.siteName + '</span>');

	var selfmenu = newDiv().addClass('SelfMenu').appendTo(frame);

	var me = $N.myself();
	if (me) {

		var editButton = $("<button title='Edit Profile'><img style='height: 1.0em; vertical-align: middle' src='" + getAvatarURL($N.myself()) + "'/>" + $N.myself().name + "</button>");
		editButton.click(function() {
		    newPopup("Profile", {width: 375, height: 450, modal: true, position: 'center'} ).
			append(newObjectEdit($N.myself(), true));
		});

		var avatarImg = getAvatar($N.myself());
		avatarImg.attr('style', 'height: 1.5em; vertical-align: middle').prepend(editButton);

		editButton.appendTo(selfmenu);
		
		var addButton = $('<button>Add...</button>').appendTo(selfmenu);
		addButton.click(function() {
			var o = objNew();
			o.addDescription('');
			o.add('spacepoint', { lat: 0, lon: 0 });

			newPopupObjectEdit( o );
		});
	}

	var searchMenu = newDiv().addClass('SearchMenu').appendTo(frame);
	var searchInput = $('<input type="text" placeholder="What are you looking for?"/>').appendTo(searchMenu);
	var searchButton = $('<button>?</button>').appendTo(searchMenu);

	var sidebar = newDiv().addClass('ShareSidebar').appendTo(frame);
	{
		var listButton = $('<button>List</button>');
		var gridButton = $('<button>Grid</button>');
		var mapButton = $('<button>Map</button>');
		sidebar.append(listButton, gridButton, mapButton, '<br/>');

		sidebar.append('<hr/>');

		var typeFilter = newCheckboxTagFilter( ['Offer', 'Sell', 'Lend', 'Rent', 'Swap', 'GiveAway', 'Need'] );
		typeFilter.appendTo(sidebar);

		sidebar.append('<hr/>');

		var catFilter = newCheckboxTagFilter( ['Food', 'Services', 'Supplies' ] );
		catFilter.appendTo(sidebar);

		sidebar.append('<hr/>');

		var distCombo = $('<select>').appendTo(sidebar);
		distCombo.append('<option>Anywhere</option>');
		distCombo.append('<option>&lt; 0.25 km</option>');
		distCombo.append('<option>&lt; 0.50 km</option>');
		distCombo.append('<option>&lt; 1.00 km</option>');
		distCombo.append('<option>&lt; 5.00 km</option>');
		distCombo.append('<option>&lt; 10.00 km</option>');
	}

	var content = newDiv().addClass('ShareContent').appendTo(frame);

	function updateContent() {
		content.html('');
		renderItems(null, content, BROWSE_ITEMS_MAX_DISPLAYED, function(s, v, xxrr) {
		    var elements = [];

		    for (var i = 0; i < xxrr.length; i++) {
		        var x = xxrr[i][0];
				var o = newObjectSummary2(x);
		        elements.push(o);
		    }
		    content.append(elements);

			//$('body').timeago('refresh');
		});   
	}	

    frame.onChange = function() {
        updateContent();
    };
    
    frame.onChange();

    
    return frame;
}

function newCheckboxTagFilter(tags) {
	var d = newDiv();
	_.each(tags, function(t) {
		var i = $('<input type="checkbox"/>');
		d.append(i, t, '<br/>');
	});
	return d;
}

function newObjectSummary2(x) {
	/*
	Name
	Photo
	Price / Value
	Author Image
	Author Name
	Tags
	*/
	var d = newDiv().addClass('ShareSummary');

	var img = newDiv().addClass('ShareSummaryImage').appendTo(d);

	var firstMedia = objFirstValue(x, 'media');
	var imgurl = 'http://localhost:8080/theme/default-avatar.jpg';
	if (firstMedia) {
		imgurl = firstMedia;
	}
	img.append('<img src="' + imgurl + '"/>');

	var e = newDiv().addClass('ShareSummaryContent').appendTo(d);
	var titleLink = $('<a href="#"><h1>' + x.name + '</h1></a>');
	titleLink.click(function() {
		newPopupObjectView(x);
	});
	e.append(titleLink);
	e.append(newMetadataLine(x));

	if (x.author) {
		var authorline = newDiv();
		var A = $N.getObject(x.author);
		authorline.append(getAvatar(A).attr('style', 'height: 1.5em; vertical-align: middle'));
		authorline.append(A.name);
	
		e.append(authorline);
	}

	d.append('<div style="clear: both"/>');
	return d;
}

