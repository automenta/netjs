//Personas (profile) widgets

function newProfileWidget() {
    var d = newDiv();

    function closeDialog() {
        //d.parent().dialog('close');            
		$('#LoadingSplash').hide();
    }

    function become(u) {
        self.become(u);             
    }

    var selector = $('<select/>');
    var okButton = $('<button autofocus="autofocus"><b>Become</b></button>');
    var deleteButton = $('<button>Delete</button>');

	function disableBecome() {
		/*
        selector.attr('disabled', 'disabled');
        okButton.attr('disabled', 'disabled');
        deleteButton.attr('disabled', 'disabled');*/
		d.html('');
	}

    var otherSelves = self.get('otherSelves');

    /*if (!otherSelves) {
		if (self.myself())
	        selector.append('<option>' + self.myself().name + '</option>');
		disableBecome();
    }
    else*/ 
	var c = 0;
    for (var i = 0; i < otherSelves.length; i++) {
        var s = otherSelves[i];
        if (s.indexOf('Self-')==0)
            s = s.substring(5);
        var o = self.getSelf(s);
        if (o) {                    
            var n = o.name;
            var selString = (o.id.substring(5) === self.id()) ? 'selected' : '';
            selector.append('<option value="' + s + '" ' + selString + '>' + n + '</option>');
			c++;
        }
        else {
            //console.log('unknown self: ' + s);
        }
    }

	if (c === 0) {
		d.html('').append(newNewProfileWidget(function(user) {
			become(user);
			closeDialog();
		}));
	}
	else {

		okButton.click(function() {
		    var id = selector.val();
			if (id) {
				become(self.getSelf(id));
				closeDialog();
			}
		});

		deleteButton.click(function() {
		    if (confirm('Permanently delete?')) {
		        self.deleteSelf(selector.val());
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
	
	var createButton = $('<button>Create User</button>');

	d.append(nameField).append('<br/>');

	var locationEnabled = true;
	var locEnabled = $('<input type="checkbox" checked="true"/>');

	d.append(locEnabled).append('Location Enabled').append('<br/>');

    var cm = $('<div id="SelfMap"/>').appendTo(d);

    d.append('<br/>').append(createButton);

	var location = configuration.mapDefaultLocation;

	later(function() {
		var lmap = initLocationChooserMap('SelfMap', location, 7, true );
		lmap.onClicked = function(l) {
			location = [ l.lat, l.lon ];
		};
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

        var u = uuid();
        var uo = 'Self-' + u;
        var o = objNew(uo, name);
        objAddTag(o, 'Human');
        objAddTag(o, 'User');     

		if  (locationEnabled)
		    objSetFirstValue( o, 'spacepoint', {lat: location[0], lon: location[1], planet: 'Earth'} );            

		whenFinished(o);  
	});

	return d;
}
