addView({
	id: 'wall',
	name: 'Home',
	icon: 'icon/view.share.svg',
	start: function(v) {		
		v.addClass('ViewPage Wall');
		
		var objPerCategory = 6;

		function objNewest(objArray, n) {
			objArray.sort(function(a, b) {
				return objTime(a) - objTime(b);
			});
			objArray.slice(0, n);
			return objArray;
		}

		var categories = ['Can', 'Need', 'Learn', 'Teach', 'Do'];

		var data = { tag: [] };
		categories.forEach(function(t) {
			data.tag.push({
				id: t,
				object: objNewest($N.getTagged(t), objPerCategory)
			});
		});

		var roster = newDiv().addClass('Roster panel panel-default').appendTo(v);
		var rosterHeading = $('<div class="panel-heading">Online <span class="badge">42</span></div>');
		rosterHeading.append(newShoutLine().css('float', 'right').css('width', '40%').css('text-align', 'right'));
		rosterHeading.append('<br/>');
		roster.append(rosterHeading);

		roster.append(newRosterWidget().addClass('panel-body'));

		var categories = newDiv().appendTo(v);
		React.renderComponent(
			CategoryPreviews(data),
			categories[0]
		);
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
			notify({title:'Published', text: name});
		});
	}

	var d = newEle('span').addClass('input-group');
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
