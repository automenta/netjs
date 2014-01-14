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


