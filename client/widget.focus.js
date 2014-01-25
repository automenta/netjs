
function newFocusTagTree(currentFocus, onTagChanged) {
    var e = newDiv('FocusTagTree');
    
    //$('.TagChoice').remove();
	var prefix = 'FTT_';
    
    var p = {
        target: e,
        newTagDiv: function(id, content) {
            var ti = getTagIcon(id);
            if (ti)
                content = '<img style="height: 1em" src="' + ti + '"/>' + content;
            return {
                label: ('<input id="' + prefix + id + '" type="checkbox" class="FTT_TagChoice"/>' + content)
            };
        },
		onCreated: function() {
			e.find('.FTT_TagChoice').each(function(x) {
				var t = $(this);
				t.change(function() {

					var tag = t.attr('id').substring(prefix.length);
					if (t.is(':checked')) {



						function strength(v) {
							later(function() {
								if (onTagChanged)
									onTagChanged(tag, v);
							});
						}

						strength(1.0);					
						/*

						var sd = $('<span/>').addClass('tagButtons').addClass('tagButtonsLeft').appendTo(t.parent());
						//2 placeholders to match the CSS nth child
						$('<button style="display: none"></button>').appendTo(sd);
						$('<button style="display: none"></button>').appendTo(sd);
						var p25Button =  $('<button title="25%">&nbsp;</button>').appendTo(sd).click(function() {  strength(0.25); });
						var p50Button =  $('<button title="50%">&nbsp;</button>').appendTo(sd).click(function() {  strength(0.5); });
						var p75Button =  $('<button title="75%">&nbsp;</button>').appendTo(sd).click(function() {  strength(0.75); });
						var p100Button = $('<button title="100%">&nbsp;</button>').appendTo(sd).click(function() {  strength(1.0); });
				
						p100Button.addClass('tagButtonSelected');

						var bb = [p25Button, p50Button, p75Button, p100Button];
						_.each(bb, function(b) {
							b.click(function() {
								_.each(bb, function(c) { c.removeClass('tagButtonSelected'); });
								b.addClass('tagButtonSelected');
					
							});
						});*/
					}
					else {
						t.parent().find('span').remove();
						if (onTagChanged)
							onTagChanged(tag, 0);
					}

				   //onTagAdded();
				});
			});
		}
    };
    newTagTree(p);    
    
    return e;
    
}

//DEPRECATED
function newLayersWidget() { 
    var target = newDiv();

    //var isGeographic = $('#GeographicToggle').is(':checked');
    //updateLayers();
    
    var l = self.layer();
    if (!l.include) 
        l.include = { };
    if (!l.exclude)
        l.exclude = { };
    if (!l.kml)
        l.kml = [ ];

    var p = {
        'target': target,
        addToTree: function(T) {
            function kmlsubtree(root) {
                var kmlFolder = {
                    label: 'Map Layer',
                    children: []
                };      

                function addKML(label, url) {
                    kmlFolder.children.push({
                        label: ('<span url="' + url + '" class="KMLLayer">' + label + '</span>'),
                    });
                }
                addKML('HAARP', '/kml/haarp.kml');
                addKML('HPM', '/kml/hpm-radars.kml');
                addKML('NUKE', '/kml/nuke-explosions.kml');

                root.push(kmlFolder);
            }
            function externalsubtree(root) {
                var extFolder = {
                    label: 'External Link',
                    children: []
                }; 
                var t = [
                    {
                        label: 'Global Alerts',
                        children: [
                            {
                                label: 'ClimateViewer 3D',
                                url: 'http://climateviewer.com/3D/'
                            },
                            {
                                label: 'RSOE EDIS',
                                url: 'http://hisz.rsoe.hu/alertmap/index2.php'
                            }
                        ]
                    }
                ];
                root.push(extFolder);        
            }

            kmlsubtree(T);
            externalsubtree(T);        
    
        },
        newTagDiv: function(id, content) {
            var ti = getTagIcon(id);
            if (ti)
                content = '<img style="height: 1em" src="' + ti + '"/>' + content;
            return {
                label: ('<span id="' + id + '" class="TagLayer">' + content + '</span>')
            };
        }        
    };
    newTagTree(p);
    
    function commitLayer() {
        self.save('layer', l);
        updateLayers();
    }
    
    if (_.size(l.include) > 0) {
        $('.TagLayer').addClass('TagLayerFaded');
    }
    
    $('.TagLayer').each(function(x) {
        var t = $(this);
        var id = t.attr('id');
        var included = l.include[id]; 
        var excluded = l.exclude[id];
        
        if (included) {
            t.addClass('TagLayerInclude');
        }
        else if (excluded) {
            t.addClass('TagLayerExclude');
        }
        
        t.click(function() {
            later(function() {
                if ((!included) && (!excluded)) {
                    //make included
                    l.include[id] = true;
                    delete l.exclude[id];
                    commitLayer();
                }
                else if (included) {
                    //make excluded
                    delete l.include[id];
                    l.exclude[id] = true;
                    commitLayer();
                }
                else {
                    //make neither
                    delete l.include[id];
                    delete l.exclude[id];
                    commitLayer();
                }                
            });
        });
    });
    $('.KMLLayer').each(function(x) {
        var t = $(this);        
        var url = t.attr('url');
        
        var included = _.contains(l.kml, url);
        if (included) {
            t.addClass('TagLayerInclude');
        }
        t.click(function() {
            if (included) {
                //uninclude
                l.kml = _.without(l.kml, url);
                commitLayer();
            }
            else {
                //include
                l.kml.push(url);
                commitLayer();
            }
        });
    });
    
//    a.delegate("a", "click", function(e) {
//        /*if ($(e.currentTarget).blur().attr('href').match('^#$')) {
//            $("#layer-tree").jstree("open_node", this);
//            return false;
//        } else {
//            var embedLocation = (this).href;
//            $('#View').html('');
//            $('#View').html('<iframe src="' + embedLocation + '" frameBorder="0" id="embed-frame"></iframe>');
//            $("#View").removeClass("ui-widget-content");
//            var vm = $('#ViewMenu');
//            var shown = vm.is(':visible');
//            showAvatarMenu(!shown);
//            e.preventDefault();
//            return false;
//        }*/
//    });
                   
    
    /*
    //update display of type counts and other type metadata
    function updateTypeCounts() {
        for (var t in stc) {
            $('a:contains("' + t + '")').append(' '+ stc[t]);
        }    
    }
    */

}

/*
    //KML
    {        
        if (self.layer)
            delete self.layer().kml;
        
        $("#KMLLayers input").change(function() {
           var t = $(this);
           var url = t.attr('url');
           var checked = t.is(':checked');
           
           var l = self.layer();
           
           if (!l.kml) l.kml = [];
           
           if (checked) {
               l.kml.push(url);
               l.kml = _.unique( l.kml );
           }
           else {
               l.kml = _.without( l.kml, url);
           }                      
           
           self.save('layer', l);
           self.trigger('change:layer');
        });
    }
*/
    /* IFRAME EMBED */

    //$("#url-tree").jstree({"plugins": ["html_data", "ui", "themeroller"]});

    /*
    $("#url-tree").delegate("a", "click", function(e) {
        if ($(e.currentTarget).blur().attr('href').match('^#$')) {
            $("#url-tree").jstree("open_node", this);
            return false;
        } else {

            var embedLocation = (this).href;
            $('#View').html('');
            $('#View').html('<iframe src="' + embedLocation + '" frameBorder="0" id="embed-frame"></iframe>');
            $("#View").removeClass("ui-widget-content");
            $('#View').addClass('view-indented');
            
            $('#close-iframe').show();
            
            var vm = $('#ViewMenu');

            var shown = vm.is(':visible');
            showAvatarMenu(!shown);
            e.preventDefault();
            return false;
        }
    });
     */

/*
    $('#close-iframe').click(function() {
        updateView(true);
        $('#close-iframe').hide();
    });
    */


