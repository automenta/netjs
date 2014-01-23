/*
var ExampleAction = {
	menu: 'Object',
	name: 'Example Action',
	description: '',
	accepts: function(selection) {
		return false;
	},
	run: function(selection) {
		return "Example action completed."
	}
};
*/

function getMultiLine(title, value, ifEntered, ifNotEntered) {
	var d = newDiv();
	$('body').append(d);

	var textarea = $('<textarea style="width: 95%; height: 75%;"></textarea>');

	if (value)
		textarea.append(value);

	d.append(textarea);

    d.dialog({
      autoOpen: false,
      height: 300,
      width: 350,
      modal: true,
	  title: title,
      buttons: {
        "OK": function() {
			var text = textarea.val();
			ifEntered(text);
            $( this ).dialog( "close" );
        },
        Cancel: function() {
			if (ifNotEntered)
				ifNotEntered();
		    $( this ).dialog( "close" );
        }
      },
      close: function() {
			d.remove();
      }
    });
	d.dialog("open");	
}

var acceptsSelectionOfOne = function(s) { 	return (s.length == 1); };
var acceptsAll = function(s) { return true; };

addAction({
	menu: 'Object',
	name: 'Edit...',
	accepts: acceptsSelectionOfOne,
	run: function(selection) {
		var x = selection[0];
		var oid = x.id;

		//TODO consider screen geometry in creating the dialog
        newPopup("Edit " + oid, {width: 375, height: 450, position: 'center'} ).append(newObjectEdit(x, true));
	}
});
addAction({
	menu: 'Object',
	name: 'Clone',
	accepts: acceptsSelectionOfOne,
	run: function(selection) {
		var x = selection[0];

		var y = _.clone( x );
		y.id = uuid();
		y.when = Date.now();
		y.author = self.id();

		self.publish(y);

		return "Cloned to " + y.id;
	}
});

addAction({
	menu: 'Object',
	name: 'Merge',
	description: 'Create a new object containing the content of all those selected',
	options:  [ ['Union', 'Intersection'] ],
	accepts: function(s) { return (s.length > 1); 	}
});
addAction({	menu: 'Object',	name: 'Anonymize' });
addAction({	menu: 'Object',	name: 'Touch' });
addAction({	menu: 'Object',	name: 'Encrypt...' });
addAction({	menu: 'Object',	name: 'Decrypt...' });
addAction({	menu: 'Object',	name: 'View Source', description: 'Display object\'s JSON source',
	accepts: acceptsSelectionOfOne,
	run: function(selection) {
		var x = selection[0];
		$.pnotify({ title: x.id, text: JSON.stringify(x, null, 4) } );
		return null;
	}	
});
addAction({	menu: 'Object',	name: 'Delete', 
	accepts: acceptsAll,
	run: function(selection) {
       if (confirm('Permanently delete ' + selection.length + ' object(s)?')) {
			_.each(selection, function(x) {
		        if (self.deleteObject(x))
					return "Deleted " + selection.length + ' object(s).';
			});
        }
		return null;
	}	
});

var acceptsIfAllAreSpatial = function(s) {
	for (var i = 0; i < s.length; i++)
		if (!objGeographic(s[i]))
			return false;
	return true;
};
addAction({	menu: 'Space',	name: 'Route Directions...', 
	description: 'Route shortest paths to one or more destinations',
	accepts: acceptsIfAllAreSpatial
});
addAction({	menu: 'Space',	name: 'Find Nearby...', 
	description: 'Find nearby objects of certain types within a given range',
	accepts: acceptsIfAllAreSpatial
});

addAction({	menu: 'Text',	name: 'Change Case', description: 'UPPERCASE, lowercase, RaNDoMCaSE, & more' });
addAction({	menu: 'Text',	name: 'Separate per line' });
addAction({	menu: 'Text',	name: 'Separate per paragraph' });
addAction({	menu: 'Text',	name: 'Translate' });
addAction({	menu: 'Text',	name: 'Mutate' }); //hackertext, add spelling mistakes

addAction({	menu: 'Tag',	name: 'Favorite (toggle)', accepts: acceptsSelectionOfOne, 
	run: function(selection) {
		var x = selection[0];

        var ot = objTags(x);
        var exists = _.contains(ot, 'Favorite');
        if (!exists) {
            $.pnotify('Added favorite.');
            x = objAddTag(x, 'Favorite');
        }
        else {
            var n = ot.indexOf('Favorite');
            $.pnotify('Removed favorite.');
            //$.pnotify({ title: 'Removed favorite.', text: 'At index ' + n });
            x = objRemoveValue(x, n);
        }

        self.pub(x, function(err) {
            $.pnotify({
                title: 'Error updating Favorite',
                text: err,
                type: 'Error'
            })
        }, function() {
            self.notice(x);
        });
	}
});
addAction({	menu: 'Tag',	name: 'Add Tags...' });
addAction({	menu: 'Tag',	name: 'Remove Tags...' });
addAction({	menu: 'Tag',	name: 'Remove All Tags' });
addAction({	menu: 'Tag',	name: 'Add SuperCategories...' });

addAction({	menu: 'Meaning',	name: 'Auto-Tag...' });
addAction({	menu: 'Meaning',	name: 'Identify Entities', description: 'NLP "who, what, where, when, ..." entity extraction to identify mentioned entities' });

addAction({	menu: 'Analyze',	name: 'Compare Tags', description: 'Tags shared, differences, and other analyse' });
addAction({	menu: 'Analyze',	name: 'Create Timeline...' });
addAction({	menu: 'Analyze',	name: 'Cost / Benefit Report', description: 'Cost calculated from a multi-currency value network. Benefits calculated with regard to human needs satisfied' });
addAction({	menu: 'Analyze',	name: 'Solve...', description: 'Solve a problem by cause-effect chain...' });
addAction({	menu: 'Analyze',	name: 'Realize...', description: 'Find potential REAL matches for realizing an IMAGINARY object' });
addAction({	menu: 'Analyze',	name: 'Data Neighborhood...', description: 'The local subgraph centered around the selected objects...' });
	//display “neighborhood” relationships table/graph (with ‘add’ button for forming new relationships, as additional object properties)

//Visual (applies if content contains “<img src”)
addAction({	menu: 'Visual',	name: 'Apply CSS Style...' , 
	accepts: function(s) {
		return (s.length > 0);
	},
	run: function(selection) {
		var existingStyle = null;
		if (selection.length == 1) {
			existingStyle = selection[0].style;
		}
		getMultiLine('Apply CSS Style', existingStyle, function(style) {
			_.each(selection, function(s) {
				s.style = style;
				self.publish(s);
			});
		});
		
		return "Styles applied.";
	}

});
addAction({	menu: 'Visual',	name: 'Create Raptcha...' });
addAction({	menu: 'Visual',	name: 'Recognize Characters', description: 'OCR an image to get the visible text' });
addAction({	menu: 'Visual',	name: 'Add from Image Search...' });
addAction({	menu: 'Visual',	name: 'Crop and Scale...' });
addAction({	menu: 'Visual',	name: 'Color Adjust' });
addAction({	menu: 'Visual',	name: 'CortexIt (by Sentence)' });
addAction({	menu: 'Visual',	name: 'CortexIt (by Paragraph)' });
addAction({	menu: 'Visual',	name: 'CortexIt (by Word)' });

addAction({	menu: 'Audio',	name: 'Text to Speech...' });
addAction({	menu: 'Audio',	name: 'Add from Sound Search...' });

addAction({	menu: 'Share',	name: 'To TeleHash' });
addAction({	menu: 'Share',	name: 'To Twitter' });
	//Twitter share: https://dev.twitter.com/docs/tweet-button#properties
addAction({	menu: 'Share',	name: 'To E-Mail' });
addAction({	menu: 'Share',	name: 'To Blog' });
addAction({	menu: 'Share',	name: 'To Forum' });
addAction({	menu: 'Share',	name: 'To Torrent' });
addAction({	menu: 'Share',	name: 'To Printer' });
addAction({	menu: 'Share',	name: 'To G+' });
addAction({	menu: 'Share',	name: 'To FaceBook' });
addAction({	menu: 'Share',	name: 'To Craigslist' });

/*
object action buttons for implementing object actions via a set of client plugins:
run/execute
embedded script (output is displayed into target innerHTML or popup dialog)
embedded css
private/public toggle
delete
reply
export
COPY (selection)
LINK / GROUP (selection)
CLONE
MERGE (status notification dsplays selected objects), PASTE MERGE, NEW MERGE (status notification display undo)
bookmark presets, alternate focus modes
vary
split
sentence
word
paragraph
[other noticeable differentiation, by image, ex:]
imagine/real toggle
sentencize
speak text
speak metadata
maximize
visit link (open new browser tab)
client plugin interface for others: 
parameters displayed whether editable or not
icon
action function
popup menu function (returns displayed popup menu, or null)
enabled
plugin metadata
*/
