var GRAPH_MAX_NODES = 300;



function newGraphView(v) {
    var eid = uuid();
    var nd = $('<div/>').attr('id', eid);
    nd.css('height', '100%');
    nd.appendTo(v);

    /*
     //add Project filter
     var projectFilter = $('<div/>');
     projectFilter.append('<b>Projects:</b><br/>');
     projectFilter.attr('id', 'projectFilter');
     for (var i in valnet.projects()) {
     var P = valnet.projects()[i];
     var cb = $('<input type="checkbox"/>');
     cb.click(function() {
     alert('TODO: redraw graph');
     });
     projectFilter.append(cb);
     projectFilter.append(P.name);
     projectFilter.append('<br/>');
     }
     $('#content').append(projectFilter);*/

    var maxWidth = 400,
        maxHeight = 400;

    //var svgCanvas = d3.select("#" + eid).append("svg")
    var svgCanvas = d3.select(nd[0]).append("svg")
        .attr('id', 'svgroot')
        .attr("version", "1.1")
        .attr("width", "100%")
        .attr("height", "100%");

    //svg = d3.select("#" + eid + " svg").append('g');
    var svg = svgCanvas.append('g');

    var force = d3.layout.force()
        .gravity(.02)
        .linkDistance(150)
        .linkStrength(0.1) //necessary to be < 1.0 to make sure charge (repulsion) is stronger
        .charge(-500)
        .size([maxWidth, maxHeight]);

    var cc = nd;
    var ss = nd.find("svg"); //$("#content svg");
    var ssg = ss.find("g").first(); //$("#content svg g");
    //var ssg2 = ssg.next(); //$("#content svg g");

    $('#svgroot').svg()
    var SVG = $('#svgroot').svg('get');

    var sketchPoly = SVG.polyline([], {
        fill: 'none',
        stroke: 'black',
        'stroke-width': '5'
    });

    var nodes = [];
    var nodeIndex = {};
    var edges = [];
    var edgeIndex = { };
    
    var defaultIcon = getTagIcon("unknown");

    function addNode(i, name, color, width, height, icon, shape) {
        if (!icon)
            icon = defaultIcon;

        var nn = {
            objectID: i,
            name: _s(name, 24),
            color: color,
            width: width,
            height: height,
            icon: icon,
            shape: shape
        };
        nodes.push(nn);
        nodeIndex[i] = nodes.length - 1;
        return nn;
    }

    function addEdge(from, to, style) {
        if (edgeIndex[from+'|'+to] !== undefined)
            return;

        var ee = {
            source: nodeIndex[from],
            target: nodeIndex[to],
            style: style
        };

        if ((ee.source !== undefined) && (ee.target !== undefined)) {
            edgeIndex[from+'|'+to] = ee;
            edges.push(ee);
        }
        return ee;
    }

    var timeline = false;
    var timelineWidth = 2500;

    var includeEdges = {};

    var defaultIconSize = 34;
    var defaultNodeSize = 34;
    var defaultTagSize = 56;
    var defaultColor = "rgba(200,200,200,0.4)"; //#ccc";
    var tagColor = "rgba(150,150,150,0.2)";
    var highlightColor = '#eee';
    var thickLine = 8.0;
    var thinLine = thickLine/2.0;
    var sketchResolution = 6.0;

    var scale = 1.0;
    var dragging = false,
        sketching = false;
    var lastPoint = null;
    var startDragPoint = null;
    var tx = 0,
        ty = 0;
    var oncell = false;
    var touched = null;

    var ended = false;
    force.on("end", function () {
        ended = true;
    });


    function updateSVGTransform() {
        ssg.attr('transform', 'translate(' + tx + ',' + ty + ') scale(' + scale + ',' + scale + ')');
        if (ended) {
            force.start();
            force.tick();
            force.stop();
        }
    }

    ss.mousewheel(function (evt) {
        var direction = evt.deltaY;

        if (direction > 0) {
            scale *= 0.9;
        } else {
            scale /= 0.9;
        }

        updateSVGTransform();
    });

    cc.bind("contextmenu", function (e) {
        return false;
    });

    cc.mousedown(function (m) {
        if (m.which == 3) {
            sketching = true;
            startDragPoint = [m.clientX, m.clientY];
            if (touched)
                sketchStart = touched;
            return;
        }

        if ((m.which == 1) && (!oncell)) {
            dragging = true;
            startDragPoint = [m.clientX, m.clientY];
            return;
        }

    });
    cc.mouseup(function (m) {
        if (sketching) {
            if (touched) {
                sketchEnd = touched;
                if ((sketchStart) && (sketchEnd)) {
                    var x = objNew();
                    var S = $N.getObject(sketchStart);
                    var E = $N.getObject(sketchEnd);
                    var Sn = S ? S.name : S;
                    var En = E ? E.name : E;

                    x.setName('Link: ' + Sn + ' -> ' + En);
                    x.addTag('Link');
                    if (S && E) {
                        x.add('incidentObject', S.id);
                        x.add('incidentObject', E.id);
                    }

                    newPopupObjectEdit(x, {
                        width: '50%'
                    });
                }
            }
            sketchPoly.setAttribute('points', '');
            sketchStart = sketchEnd = null;
        }
        dragging = sketching = false;
        lastPoint = null;
    });
    cc.mousemove(function (m) {
        if (sketching) {
            var nextPoint = [m.clientX, m.clientY];
            /* 			<polyline fill="none" stroke="blue" stroke-width="5" points="450,250 */

            function addNextPoint() {
                sketchPoly.setAttribute('points', (sketchPoly.getAttribute('points') || '') + nextPoint[0] + ',' + nextPoint[1] + ' ');
                lastPoint = nextPoint;
            }

            if (lastPoint) {
                var distSq = (lastPoint[0] - nextPoint[0]) * (lastPoint[0] - nextPoint[0]) + (lastPoint[1] - nextPoint[1]) * (lastPoint[1] - nextPoint[1]);

                var resolution = sketchResolution;

                if (distSq > resolution * resolution) {
                    addNextPoint();
                }
            } else {
                addNextPoint();
            }

            return false;
        }

        if (m.which != 1) {
            dragging = false;
            lastPoint = null;
            return;
        }

        if (dragging) {
            if (lastPoint) {
                var dx = m.clientX - lastPoint[0];
                var dy = m.clientY - lastPoint[1];
                tx += dx;
                ty += dy;
                updateSVGTransform();
            }

            lastPoint = [m.clientX, m.clientY];

        }
    });

    var node = null;
    var nodePositions = {};

    function savePositions() {
        nodePositions = {};
        if (node) {
            node.attr("transform", function (d) {
                nodePositions[d.objectID] = [d.x, d.y];
            });
        }
    }

    function loadPositions() {
        if (node) {
            node.attr("transform", function (d) {
                var existingPosition = nodePositions[d.objectID];
                if (existingPosition) {
                    d.x = existingPosition[0];
                    d.y = existingPosition[1];
                }
            });
        }
    }

    nd.onChange = function () {
        savePositions();

        force.stop();

        svg.selectAll(".node").remove();
        svg.selectAll(".link").remove();

        nodes = [];
        edges = [];
        nodeIndex = {};
        edgeIndex = {};


        renderItems(v, GRAPH_MAX_NODES, function (s, v, xxrr) {

            var minTime, maxTime;
            if (timeline) {
                var times = _.map(xxrr, function (o) {
                    return objTime(o[0]);
                });
                minTime = _.min(times);
                maxTime = _.max(times);
            }

            function addNodeForObject(x) {
                var N = addNode(x.id, x.name || "", defaultColor, defaultNodeSize, defaultNodeSize, getTagIcon(x));
                if (timeline) {
                    if (minTime !== maxTime) {
                        var when = objTime(x);
                        N.fixedX = timelineWidth * (when - minTime) / (maxTime - minTime);
                    }
                }
            }

            for (var i = 0; i < xxrr.length; i++) {
                var x = xxrr[i][0];
                addNodeForObject(x);

                if (includeEdges['Reply']) {
                    var replies = $N.getReplies(x);
                    for (var j = 0; j < replies.length; j++) {
                        xxrr.push([replies[j], 1]);
                    }
                }
            }

            for (var i = 0; i < xxrr.length; i++) {
                var x = xxrr[i][0];
                var r = xxrr[i][1];

                /*var N = addNode(x.id, x.name || "", defaultColor, 35, 35, getTagIcon(x) );
                 if (timeline) {
                 if (minTime!=maxTime) {
                 var when = objTime(x);
                 N.fixedX = timelineWidth * (when - minTime) / (maxTime - minTime);
                 }
                 }*/

                var rtags = [];

                //add Tags (intensional inheritance)

                   
                if (includeEdges['Type']) {
                    _.each(objTagStrength(x, true, true), function(v, k) {
                        rtags.push([k, {
                            stroke: 'rgba(64,64,64,0.5)',
                            strokeWidth: (thickLine * v),
                            strength: v
                        }]);
                    });
                }

                if (includeEdges['Author']) {
                    if (x.author)
                        rtags.push([x.author, {
                            stroke: 'rgba(128,64,64,0.5)',
                            strokeWidth: thinLine
                        }]);
                }
                if (includeEdges['Subject']) {
                    if (x.subject)
                        rtags.push([x.subject, {
                            stroke: 'rgba(64,64,128,0.5)',
                            strokeWidth: thinLine
                        }]);
                }
                if (includeEdges['Reply']) {
                    var replies = x.reply;
                    if (replies) {
                        var str = 1.0 / replies.length;
                        var thi = thickLine * str;
                        _.values(replies).forEach(function(rj) {
                            rtags.push([rj.id, {
                                stroke: 'rgba(64,128,64,0.5)',
                                strokeWidth: Math.max(1.0, thi),
                                strength: str
                            }]);
                        });
                        
                    }
                }


                if (rtags) {

                    for (var j = 0; j < rtags.length; j++) {
                        var tj = rtags[j][0];
                        var edgeStyle = rtags[j][1];

                        if (tj === 'Link')
                            continue; //ignore the Link tag

                        if (nodeIndex[tj] === undefined) {
                            var tag;
                            var ttj = $N.tag(tj);
                            if (ttj) {
                                tag = true;
                            } else {
                                ttj = $N.getObject(tj) || null; // || { name: '<' + tj + '>' };
                                tag = false;
                            }
                            if (!ttj) {
                                tag = true;
                                ttj = { id: tj, name: tj };
                            }
                                //continue;

                            if (tag) {
                                var tagIcon = null;
                                if (ttj)
                                    tagIcon = getTagIcon(tj);

                                addNode(tj, ttj.name, tagColor, defaultTagSize, defaultTagSize, tagIcon);
                            } else {
                                //add node for object
                                addNodeForObject(ttj);
                            }

                        }

                        addEdge(x.id, tj, edgeStyle);
                    }
                }

            }

            if (includeEdges['Trust']) {
                var t = objUserRelations($N.objectsWithTag('Trust', true));
                for (var u in t) {
                    for (var v in t[u]['trusts']) {
                        addEdge(u, v, edgeStyle);
                    }
                }
            }

            /*
            if (includeEdges['Value']) {
                var t = objUserRelations($N.objectsWithTag('Value', true));
                console.log('value', t);
            }
            */



            //add object links
            if (includeEdges['Object']) {
                for (var k = 0; k < xxrr.length; k++) {
                    var x = xxrr[k][0];

                    if (!x.value)
                        continue;

                    for (var j = 0; j < x.value.length; j++) {
                        var vi = x.value[j];
                        var vid = vi.id;
                        if (isPrimitive(vid))
                            continue;
                        var vidp = $N.property[vid];
                        if (!vidp)
                            continue;
                        if (vidp.extend === 'object') {
                            var target = vi.value;
                            if (nodeIndex[target] !== undefined) {
                                var str = vi.strength || 1.0;                                
                                addEdge(x.id, target, {
                                    stroke: 'rgba(200,200,200,' + (0.25 + 0.75 * str) + ')',
                                    strokeWidth: Math.max(1.0, thickLine * str),
                                    strength: str
                                });
                            }
                        }
                    }
                }
            }

            if (includeEdges['Directed']) {
                for (var k = 0; k < xxrr.length; k++) {
                    var x = xxrr[k][0];

                    var inEdges = $N.dgraph.inEdges(x.id);
                    for (var j = 0; j < inEdges.length; j++) {
                        var e = inEdges[j];
                        var edgeValue = $N.dgraph.edge(e);
                        var source = $N.dgraph.source(e);
                        var s = 1.0;
                        if (typeof edgeValue === "number")
                            s = parseFloat(edgeValue);                        
                        addEdge(source, x.id, {
                            stroke: 'rgba(200,200,200,' + (0.1 + 0.9 * s) + ')',
                            strokeWidth: Math.max(1.0, thickLine * s),
                            strength: s
                        });                                                    
                    }
                    var outEdges = $N.dgraph.outEdges(x.id);
                    for (var j = 0; j < outEdges.length; j++) {
                        var e = outEdges[j];
                        var edgeValue = $N.dgraph.edge(e);
                        var target = $N.dgraph.target(e);
                        var s = 1.0;
                        if (typeof edgeValue === "number")
                            s = parseFloat(edgeValue);                        
                        addEdge(x.id, target, {
                            stroke: 'rgba(200,200,200,' + (0.1 + 0.9 * s) + ')',
                            strokeWidth: Math.max(1.0, thickLine * s),
                            strength: s
                        });                                                    
                    }
                }
            }


            force
                .nodes(nodes)
                .links(edges);

            var drag = force.drag()
                .on("dragstart", function () {
                    oncell = true;
                }).on("dragend", function () {
                    oncell = false;
                });

            var link = svg.selectAll(".link")
                .data(edges)
                .enter().append("line")
                .attr("class", "link");

            node = svg.selectAll(".node")
                .data(nodes)
                .enter().append("g")
                .attr("class", "node")
                .call(force.drag);

            loadPositions();

            force.start();


            node.on("mouseover", function (d) {
                if (d3.event.defaultPrevented)
                    return; // ignore drag
                var oid = d.objectID;
                if (oid)
                    touched = oid;

                d3.select(this).select('circle').style("fill", highlightColor);
            });
            node.on("mouseout", function (d) {
                if (d3.event.defaultPrevented)
                    return; // ignore drag
                touched = null;
                d3.select(this).select('circle').style("fill", d.color);
            });

            node.on("click", function (d) {
                if (d3.event.defaultPrevented)
                    return; // ignore drag
                var oid = d.objectID;
                if (oid)
                    newPopupObjectView(oid);
            });

            /*node.append("rect")
             .attr("x", function(d) { return -d.width/2; })
             .attr("y", function(d) { return -d.height/2; })
             .attr("width", function(d) { return d.width; } )
             .attr("height", function(d) { return d.height; } )
             .style("fill", function(d) { return d.color; });*/

            node.append("circle")
                .attr("x", function (d) {
                    return -d.width / 2;
                })
                .attr("y", function (d) {
                    return -d.height / 2;
                })
                .attr("r", function (d) {
                    return d.width;
                })
                .style("fill", function (d) {
                    return d.color;
                });

            node.append("image")
                .attr("xlink:href", function (d) {
                    return d.icon;
                })
                .attr("x", -defaultIconSize / 2.0)
                .attr("y", -defaultIconSize / 2.0)
                .attr("width", defaultIconSize)
                .attr("height", defaultIconSize);

            node.append("text")
                .attr("dx", function (d) {
                    return -d.width / 2;;
                })
                .attr("dy", "4em")
                .text(function (d) {
                    return d.name;
                });


            link.attr("stroke-width", function (l) {
                if ((l.style) && (l.style.strokeWidth))
                    return l.style.strokeWidth;
                return 3;
            }).attr("stroke", function (l) {
                if ((l.style) && (l.style.stroke))
                    return l.style.stroke;
                return 'black';
            });/*.attr("opacity", function (l) {
                if ((l.style) && (l.style.opacity))
                    return l.style.opacity;
                return 1.0;
            });*/

            force.on("tick", function () {
                node.attr("transform", function (d) {
                    if (timeline) {
                        if (d.fixedX != undefined)
                            d.x = d.fixedX;
                    }
                    return "translate(" + d.x + "," + d.y + ")";
                });

                link.attr("x1", function (d) {
                    return d.source.x;
                })
                .attr("y1", function (d) {
                    return d.source.y;
                })
                .attr("x2", function (d) {
                    return d.target.x;
                })
                .attr("y2", function (d) {
                    return d.target.y;
                });

            });




        });

    };



    var submenu = $('#AvatarViewMenu');

    var modeSelect = $('<select/>').appendTo(submenu);
    modeSelect.append('<option value="Network">Network</option>');
    modeSelect.append('<option value="Timeline">Timeline</option>');
    modeSelect.change(function () {
        timeline = $(this).val() == 'Timeline';
        nd.onChange();
    });

    submenu.append('<hr/>');
    submenu.append('Edges:<br/>');

    var edgeTypes = ['Type', 'Author', 'Object', 'Subject', 'Reply', 'Trust', 'Directed' /*, 'Value'*/ ];
    _.each(edgeTypes, function (e) {
        var includeCheck = $('<input type="checkbox"/>').appendTo(submenu);
        submenu.append(e + '<br/>');
        includeCheck.click(function () {
            includeEdges[e] = (includeCheck.is(':checked'));
            nd.onChange();
        });
    });


    nd.onChange();



    return nd;


}