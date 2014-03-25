var shareSearchFocusUpdateMS = 1500;

/* Sharetribe.com inspired view */
function renderShare(v) {
	var shareTags = [ 'Offer', 'Sell', 'Lend', 'Rent', 'Swap', 'GiveAway', 'Need', 'Teach', 'Learn' ];
	var shareCategories = ['Food', 'Service', 'Volunteer', 'Shelter', 'Tools', 'Health', 'Transport', 'Animal' ];

    clearFocus();
    renderFocus();

    var frame = newDiv().addClass('Share').appendTo(v);
    
    var header = newDiv().addClass('Header').appendTo(frame);
	header.append('<span class="Logo">' + configuration.siteName + '</span>');

	var selfmenu = newDiv().addClass('SelfMenu').appendTo(frame);


	var searchMenu = newDiv().addClass('SearchMenu').appendTo(frame);
	var searchInput = $('<input type="text" placeholder="What are you looking for?"/>').appendTo(searchMenu);

	var updateSearchFocus = function() {
		var k = searchInput.val();
		var f = $N.focus();
		if (k.length > 0)
			f.name = k;
		else
			delete f.name;
		$N.setFocus(f);
	};

	searchInput.on('input', _.throttle(updateSearchFocus, shareSearchFocusUpdateMS));

	var searchButton = $('<button>?</button>').appendTo(searchMenu);

	var sidebar = newDiv().addClass('ShareSidebar').appendTo(frame);
	{
		var listButton = $('<button>List</button>');
		var gridButton = $('<button>Grid</button>');
		var mapButton = $('<button>Map</button>');
		sidebar.append(listButton, gridButton, mapButton, '<br/>');

		sidebar.append('<hr/>');

		var typeFilter = newCheckboxTagFilter( shareTags );
		typeFilter.appendTo(sidebar);

		sidebar.append('<hr/>');

		var catFilter = newCheckboxTagFilter( shareCategories );
		catFilter.appendTo(sidebar);

		sidebar.append('<hr/>');

		var distCombo = $('<select>').appendTo(sidebar);
		distCombo.append('<option>Anywhere</option>');
		distCombo.append('<option>&lt; 1 km</option>');
 		distCombo.append('<option>&lt; 5 km</option>');
 		distCombo.append('<option>&lt; 20 km</option>');
 		distCombo.append('<option>&lt; 50 km</option>');
 		distCombo.append('<option>&lt; 200 km</option>');

		sidebar.append('<hr/>');

		var userSelect = newAuthorCombo($N.focus().who, true).appendTo(sidebar);
		userSelect.change(function(n) {
			var v = userSelect.val();
			var f = $N.focus();
			
			if (v && (v.length > 0))
				f.who = v;
			else
				delete f.who;

			$N.setFocus(f);
			renderFocus(true);		
		});

	}

	var content = newDiv().addClass('ShareContent').appendTo(frame);

	function updateContent() {
		selfmenu.html('');

		var me = $N.myself();
		if (me) {

			var editButton = $("<button title='Edit Profile'><img style='height: 1.0em; vertical-align: middle' src='" + getAvatarURL($N.myself()) + "'/>" + $N.myself().name + "</button>");
			editButton.click(function() {
				newPopup("Profile", {width: 375, height: 450, modal: true, position: 'center'} ).
				append(newObjectEdit($N.myself(), true));
			});

			editButton.appendTo(selfmenu);
		
			var addButton = $('<button>Post...</button>').appendTo(selfmenu);
			addButton.click(function() {
				var o = objNew();
				o.addDescription('');

				var mpdl = configuration.mapDefaultLocation || [0,0];
				o.add('spacepoint', { lat: mpdl[0], lon: mpdl[1] });

				var ee = newPopupObjectEdit( o );
				ee.addTagButtons(_.union(shareTags, ['\n'], shareCategories));
			});
		}

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
		i.click(function() {
			var checked = i.is(':checked');
			var f = $N.focus();
			if (checked) {
				objAddTag(f, t);
			}
			else {
				objRemoveTag(f, t);
			}
			$N.setFocus(f);
			renderFocus(true);
		});		
		d.append(i, newTagButton(t), '<br/>');
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
	
	var actionLine = newDiv().addClass('ShareSummaryAction').appendTo(e);
	if ($N.id() == x.author) {
		var editButton = $('<button>Edit</button>').appendTo(actionLine);
		editButton.click(function() {
			newPopupObjectEdit(x);
		});
		var deleteButton = $('<button>Delete</button>').appendTo(actionLine);
		deleteButton.click(function() {
			$N.deleteObject(x);
		});
	}
	var replyButton = $('<button disabled>Reply</button>').appendTo(actionLine);
	replyButton.click(function() {
	});


	if (x.author) {
		var authorline = newDiv().addClass('ShareSummaryAuthor');
		
		var A = $N.getObject(x.author);
		authorline.append(getAvatar(A).attr('style', 'height: 1.5em; vertical-align: middle'));
		var authorLink = $('<a href="#">' + A.name + '</a>');
		authorLink.click(function() {
			newPopupObjectView(A);
		});
		authorline.append(authorLink);
	
		e.append(authorline);
	}

	d.append('<div style="clear: both"/>');
	return d;
}

