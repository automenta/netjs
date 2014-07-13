addView({
	id: 'share',
	name: 'Share',
	icon: 'icon/view.share.svg',
	start: function(v) {
		var shareTags = configuration.shareTags;
		var shareCategories = configuration.shareCategories;
		var allShareTags = _.union(shareTags, shareCategories);


		var frame = newDiv().addClass('Share').appendTo(v);


		var selfmenu = newDiv();
		var searchMenu = newDiv();

		//var searchMenu = newDiv().addClass('SearchMenu').appendTo(frame);
		var searchInput = $('<input type="text" placeholder="What are you looking for?"/>').appendTo(searchMenu);
		searchInput.addClass('ShareSidebarQuery');

		var updateSearchFocus = function() {
			var k = searchInput.val();
			var f = $N.focus();
			if (k.length > 0)
				f.name = k;
			else
				delete f.name;

			//$N.setFocus(f);
		};

		searchInput.on('input', _.throttle(updateSearchFocus, shareSearchFocusUpdateMS));


		var sidebar = newDiv().addClass('ShareSidebar').appendTo(frame);
		{

			/*var listButton = $('<button>List</button>');
			var gridButton = $('<button>Grid</button>');
			var mapButton = $('<button>Map</button>');

			sidebar.append(selfmenu, '<hr/>');

			sidebar.append(listButton, gridButton, mapButton, '<br/><hr/>');*/

			sidebar.append(selfmenu);

			sidebar.append(searchMenu);

			var modeCombo = $('<select>').appendTo(sidebar);

			var sb = newDiv().appendTo(sidebar);

			var typeFilter = newCheckboxTagFilter(shareTags);
			typeFilter.appendTo(sb);

			sb.append('<br/>');

			var catFilter = newCheckboxTagFilter(shareCategories);
			catFilter.appendTo(sb);

			var onlyUsers = false;

			modeCombo.append('<option value="all">All</option>');
			//modeCombo.append('<option value="posts">Posts</option>');
			modeCombo.append('<option value="users">Users</option>');
			modeCombo.change(function() {
				var v = modeCombo.val();

				var f = $N.focus();

				supressCheckboxTagFilter = true;
				typeFilter.find('input').removeAttr('checked');
				catFilter.find('input').removeAttr('checked');
				supressCheckboxTagFilter = false;

				if (v == 'all') {
					sb.show();
					f.value = [];
				}
				else if (v == 'users') {
					sb.hide();

					f.value = [];
					objAddTag(f, 'User');
					onlyUsers = true;
				}
				else if (v == 'posts') {
					sb.show();
					f.value = [];
				}

				//$N.setFocus(f);
				//renderFocus(true);
			});

			sidebar.append('<br/>');

			//distance filter
			var distCombo = $('<select>').appendTo(sidebar);
			distCombo.append('<option>Anywhere</option>');
			distCombo.append('<option>&lt; 1 km</option>');
			distCombo.append('<option>&lt; 5 km</option>');
			distCombo.append('<option>&lt; 20 km</option>');
			distCombo.append('<option>&lt; 50 km</option>');
			distCombo.append('<option>&lt; 200 km</option>');


			//user filter
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

			//trust filter
			var itrust = $('<input type="checkbox"/>');
			var trustme = $('<input type="checkbox"/>');

			function updateTrustFilter() {
				var itrusting = itrust.is(':checked');
				var trustingme = trustme.is(':checked');

				var f = $N.focus();
				if (itrusting || trustingme) {
					f.userRelation = {itrust: itrusting, trustme: trustingme};
				}
				else
					delete f.userRelation;

				$N.setFocus(f);
				renderFocus(true);
			}

			itrust.click(updateTrustFilter);
			sidebar.append('<br/>', itrust, 'Sources I Trust', '<br/>');

			trustme.click(updateTrustFilter);
			sidebar.append(trustme, 'Sources Trusting Me', '<br/>');

		}

		var content = newDiv().addClass('ShareContent').appendTo(frame);

		function updateContent() {
			selfmenu.empty();

			var me = $N.myself();
			if (me) {

				var editButton = $("<button title='Edit Profile'><img style='height: 1.0em; vertical-align: middle' src='" + getAvatarURL($N.myself()) + "'/>" + $N.myself().name + '</button>');
				editButton.click(function() {
					newPopup('Profile', true, true).append(newObjectEdit($N.myself(), true));
				});

				editButton.appendTo(selfmenu);

				var addButton = $('<button>Post...</button>').appendTo(selfmenu);
				addButton.click(function() {
					var o = objNew();
					o.addDescription('');

					var mpdl = configuration.mapDefaultLocation || [0, 0];
					o.add('spacepoint', {lat: mpdl[0], lon: mpdl[1]});

					o.tagSuggestions = _.union(shareTags, ['\n'], shareCategories);
					var ee = newPopupObjectEdit(o, true);
				});
			}

			content.empty();
			renderItems(content, BROWSE_ITEMS_MAX_DISPLAYED, function(s, v, xxrr) {
				var elements = [];

				for (var i = 0; i < xxrr.length; i++) {
					var x = xxrr[i][0];
					var o = newObjectView2(x);
					elements.push(o);
				}
				content.append(elements);

				//$('body').timeago('refresh');
			}, (!onlyUsers) ? function(x, tags) {
				for (var i in tags) {
					if (allShareTags.indexOf(i) !== -1)
						return true;
				}
				return false;
			} : undefined);
		}

		frame.onChange = function() {
			updateContent();
		};


		frame.onChange();


		//clearFocus();
		//renderFocus();


		return frame;

	},
	stop: function() {
	}
});


var shareSearchFocusUpdateMS = 1500;
var supressCheckboxTagFilter = false;

/* Sharetribe.com inspired view */
function newShareView(v) {
}

function newCheckboxTagFilter(tags) {
    var d = newDiv();
    _.each(tags, function(t) {
        var i = $('<input type="checkbox"/>');
        i.click(function() {
            if (supressCheckboxTagFilter)
                return;

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

function objIcon(x) {
    if (x.author == x.id) {
        var a = getAvatarURL(x);
        if (a)
            return a;
    }
    
    var firstMedia = objFirstValue(x, 'image');

    var imgurl;

    if ((firstMedia) && (typeof firstMedia === "string")) {
        imgurl = firstMedia;
    }
    else {
        imgurl = getTagIcon(x) || getTagIcon(null);// 'icon/placeholder.png';
    }
    return imgurl;
}

function newObjectView2(x) {
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

    imgurl = objIcon(x);

    img.append(newEle('img').attr('src', imgurl));

    var e = newDiv().addClass('ShareSummaryContent').appendTo(d);
    var xnn = x.name || '?';
    var titleLink = newEle('a').append(newEle('h1').html(xnn))
            .click(function() {
                newPopupObjectView(x, true);
            });
    e.append(titleLink, newMetadataLine(x));


    var actionLine = newDiv().addClass('ShareSummaryAction').appendTo(e);
    if ($N.id() == x.author) {
        var editButton = newEle('button').text('Edit').appendTo(actionLine)
                .click(function() {
                    newPopupObjectEdit(x, true);
                });

        if (!objHasTag(x, 'User')) {
            var deleteButton = newEle('button').text('Delete').appendTo(actionLine)
                    .click(function() {
                        if (confirm('Permanently delete \"' + x.name + '\"?'))
                            $N.deleteObject(x);
                    });
        }
    }
    var replyButton = newEle('button').text('Reply').appendTo(actionLine)
            .click(function() {
                newReplyPopup(x);
            });
    var numReplies = $N.getReplies(x).length;
    if (numReplies) {
        actionLine.append(newEle('span').addClass('ReplyInfo').html('&nbsp;(Replies: ' + numReplies + ')'));
    }


    var nod = newDiv().css('clear', 'both').appendTo(e);
    addNewObjectDetails(x, nod);    

    if (x.author) {
        var authorline = newEle('span').addClass('ShareSummaryAuthor');

        var A = $N.getObject(x.author);
        if (A) {
            authorline.append(newAvatarImage(A).attr('style', 'height: 1.5em; vertical-align: middle'));
            var authorLink = $(newEle('a').html(A.name))
                    .appendTo(authorline)
                    .click(function() {
                        newPopupObjectView(A, true);
                    });
        }
        else {
            //missing author?
        }

        actionLine.append(authorline);
    }

    d.append(newDiv().attr('style', 'clear: both'));
    return d;
}

