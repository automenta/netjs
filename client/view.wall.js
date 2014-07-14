addView({
	id: 'wall',
	name: 'Home',
	icon: 'icon/view.main.svg',
	start: function(v) {
		v.addClass('ViewPage Wall');

		var objPerCategory = 8;

		function objNewest(objArray, n) {
			objArray.sort(function(a, b) {
				return objTime(a) - objTime(b);
			});
			return objArray.slice(0, n);
		}

		var category1 = configuration.shareTags;
		var category2 = configuration.shareCategories;
		var category3 = configuration.knowTags;

		function getCategory(tags) {
			var data = { tag: [] };
			tags.forEach(function(t) {
				//TODO convert to async getAllByTag

				var objs = $N.getTagged(t);
				var more = objs.length > objPerCategory;
				data.tag.push({
					id: t,
					object: objNewest(objs, objPerCategory),
					more: more
				});
			});
			return data;
		}

		if ($N.roster) {
			var roster = newDiv().addClass('Roster panel panel-default').appendTo(v);
			var rosterHeading = $('<div class="panel-heading">Online</div>'/* <span class="badge">42</span></div>*/);
			rosterHeading.append(newShoutLine().css('float', 'right').css('width', '40%').css('text-align', 'right'));
			rosterHeading.append('<br/>');
			roster.append(rosterHeading);
			roster.append(newRosterWidget().addClass('panel-body'));
		}
		

		var categories = newDiv().addClass('CategoryPreviews panel panel-default').appendTo(v);
		categories.append('<div class="panel-heading">News</div>');
		var categoryBody = newDiv().addClass('panel-body').appendTo(categories);
		var col1 = newDiv().appendTo(categoryBody);
		var col2 = newDiv().appendTo(categoryBody);
		var col3 = newDiv().appendTo(categoryBody);

		React.renderComponent(CategoryPreviews(getCategory(category1)), col1[0]);
		React.renderComponent(CategoryPreviews(getCategory(category2)), col2[0]);
		React.renderComponent(CategoryPreviews(getCategory(category3)), col3[0]);

	},
	stop: function() {
	}
});

/* a text input line that creates a message nobject */
function newShoutLine() {

	function send(name, desc, tag) {
		var o = objNew();
		o = o.own();
		o = objName(o, name);
		//o = objAddTag(o, 'Message');
		if (desc)
			o = objAddDescription(o, desc);
		if (tag)
			o = o.add(tag);

		$N.pub(o, null, function() {
			notify({title: 'Published', text: name});
		});
	}

	var d = newEle('span');//.addClass('input-group');
	var e = $('<input type="text" placeholder="Say..." x-webkit-speech="x-webkit-speech"/>').appendTo(d);
	d.append('<button title="Publish"><i class="fa fa-share-alt"></i></button>');
    e.keyup(function(event) {
        if (event.keyCode === 13) {
            var t = e.val();
			send(t, null, null);
            e.val('');
        }
    });

	/*
	<div class="btn-group">
  <button type="button" class="btn btn-danger">Action</button>
  <button type="button" class="btn btn-danger dropdown-toggle" data-toggle="dropdown">
    <span class="caret"></span>
    <span class="sr-only">Toggle Dropdown</span>
  </button>
  <ul class="dropdown-menu" role="menu">
    <li><a href="#">Action</a></li>
    <li><a href="#">Another action</a></li>
    <li><a href="#">Something else here</a></li>
    <li class="divider"></li>
    <li><a href="#">Separated link</a></li>
  </ul>
</div>*/
	/*
<div class="input-group">
  <input type="text" class="form-control">
  <div class="input-group-btn">
    <!-- Button and dropdown menu -->
  </div>
</div>
	*/
	return d;
}
