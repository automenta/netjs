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
	if(otherSelves){
	    for (var i = 0; i < otherSelves.length; i++) {
	        var s = otherSelves[i];
	        var o = self.getObject(s);
	        if (o) {                    
	            var n = o.name;
	            var selString = (o.id === self.id()) ? 'selected' : '';
	            selector.append('<option value="' + s + '" ' + selString + '>' + n + '</option>');
				c++;
	        }
	        else {
	            //console.log('unknown self: ' + s);
	        }
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
				become(self.getObject(id));
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
		lmap = initLocationChooserMap('SelfMap', location, 7, true );
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

        var u = uuid();
        var uo = u;
        var o = objNew(uo, name);
		o.self = true;
		o.author = uo;
        objAddTag(o, 'Human');
        objAddTag(o, 'User');     

		if (extraProperties) {
			for (var i = 0; i < extraProperties.length; i++) {
				var e = extraProperties[i];
				var ei = extraPropertyInputs[i];
				objAddValue(o, e, ei.val());
			}
		}
						
		var location = lmap.location();
		if  (locationEnabled)
		    objSetFirstValue( o, 'spacepoint', {lat: location.lat, lon: location.lon, planet: 'Earth'} );            

		if (email.length > 0) {
			objSetFirstValue( o, 'email', email);
		}

		whenFinished(o);  
	});

	return d;
}
