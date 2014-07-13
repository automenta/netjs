addView({
	id: 'graph',
	name: 'Network',
	icon: 'icon/view.graph.svg',
	start: function(v) {

		var GRAPH_MAX_NODES = 200;

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
		var svgCanvas = d3.select(nd[0]).append('svg')
			.attr('id', 'svgroot')
			.attr('version', '1.1')
			.attr('width', '100%')
			.attr('height', '100%');

		// build the arrow.
		svgCanvas.append('svg:defs').selectAll('marker')
			.data(['end'])      // Different link/path types can be defined here
		  .enter().append('svg:marker')    // This section adds in the arrows
			.attr('id', String)
			.attr('viewBox', '0 -5 10 10')
			.attr('refX', 30)
			.attr('refY', 0)
			.attr('markerWidth', 3)
			.attr('markerHeight', 3)
			.attr('orient', 'auto')
			.attr('class', 'graphArrowhead')
		  .append('svg:path')
			.attr('d', 'M0,-5L10,0L0,5');

		//svg = d3.select("#" + eid + " svg").append('g');
		var svg = svgCanvas.append('g');

		//var defaultDrag = d3.behavior.drag();
			/*.origin(function(d) { return d; })
			.on("drag", function (d) {
				  d3.select(this)
					.attr("x", d3.event.x)
					.attr("y", d3.event.y);
				});*/

		var force = d3.layout.force()
			.gravity(.02)
			.linkDistance(150)
			.linkStrength(0.1) //necessary to be < 1.0 to make sure charge (repulsion) is stronger
			.charge(-500)
			.size([maxWidth, maxHeight]);

		var cc = nd;
		var ss = nd.find('svg'); //$("#content svg");
		var ssg = ss.find('g').first(); //$("#content svg g");
		//var ssg2 = ssg.next(); //$("#content svg g");

		$('#svgroot').svg();

		var SVG = $('#svgroot').svg('get');

		var sketchPoly = SVG.polyline([], {
			fill: 'none',
			stroke: 'black',
			'stroke-width': '5'
		});

		var nodes = [];
		var nodeIndex = {};
		var edgeIndex = { };

		var defaultIcon = getTagIcon('unknown');

		function addNode(i, name, color, width, height, icon, shape, spacepoint) {
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

			if (spacepoint) {
				nn.lat = spacepoint[0];
				nn.lon = spacepoint[1];
			}

			nodes.push(nn);
			nodeIndex[i] = nodes.length - 1;
			return nn;
		}

		function hasEdge(from, to, edgeType) {
			var edgeID = from + '|' + to;
			if (edgeType)
				edgeID += '|' + edgeType;

			if (edgeIndex[edgeID] !== undefined)
				return true;
			return edgeID;
		}
		function addEdge(from, to, style, edgeType) {
			var ees = nodeIndex[from];
			var eet = nodeIndex[to];
			if ((ees !== undefined) && (eet !== undefined)) {
				var index = hasEdge(from, to, edgeType, true);
				if (index === true)
					return;

				var ee = {
					source: ees,
					target: eet,
					style: style
				};
				edgeIndex[index] = ee;

				return ee;
			}

		}

		var layout;
		var timeline = false;
		var geographic = false;
		var timelineWidth = 2500;

		var nodeScale = { };
		var includeEdges = {};

		var defaultNodeSize = 34;
		var defaultTagSize = 56;
		var defaultColor = 'rgba(180,180,180,0.3)'; //#ccc";
		var tagColor = 'rgba(150,150,150,0.2)';
		var highlightColor = 'rgba(200,200,200,0.5)';
		var thickLine = 8.0;
		var thinLine = thickLine / 2.0;
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
		force.on('end', function() {
			ended = true;
		});

		var nodeMenu = newDiv().addClass('HUDTopLeft').appendTo(nd);

		var selected = null;
		var selectedVisual = null;
		var selectedID = null;

		function unselectNode(d, visual) {
			if (!d) return;

			d.fixed = (layout !== 'ForceDirected');
			visual.select('circle').attr('class', '');
			visual.select('.graphSelectionMenu').remove();
		}

		function selectNode(d, visual) {

			if (d === selected) return;

			if (d === undefined) {
				//objectID -> d,visual
				/*svg.selectAll(".node").data(nodes).select()
				d = selected;
				visual = d3.select(d);*/
				d = selected;
				visual = d3.select(selectedVisual);
			}
			else {
				if (selected)
					unselectNode(selected, selectedVisual);
			}

			if (!d) return;

			d.fixed = true;

			var circle = visual.select('circle');
			var menu = visual.append('g').attr('class', 'graphSelectionMenu');

			circle.attr('class', 'graphNodeSelected');

			menu.append('rect')
				 .attr('x', function(d) { return d.width; })
				 .attr('y', function(d) { return -10; })
				 .attr('width', function(d) { return 20; })
				 .attr('height', function(d) { return 20; })
				 .style('fill', function(d) { return 'lightgray'; })
				 .style('stroke', function(d) { return 'black'; })
				 .style('stroke-width', function(d) { return 1; })
				 .on('click', function() {
					//var b = this.getBBox();
					var b = this.getCTM();
					var s = ssg[0].getCTM();
					tx = (s.e - b.e) + ($(document).width() / 2.0);
					ty = (s.f - b.f) + ($(document).height() / 2.0);
					//scale *= 2.0;
					updateSVGTransform();
				 });
			menu.append('rect')
				 .attr('x', function(d) { return -10; })
				 .attr('y', function(d) { return -d.width - 20; })
				 .attr('width', function(d) { return 20; })
				 .attr('height', function(d) { return 20; })
				 .style('fill', function(d) { return 'lightgray'; })
				 .style('stroke', function(d) { return 'black'; })
				 .style('stroke-width', function(d) { return 1; })
				 .on('click', function() {
					if (selectedID)
						newPopupObjectView(selectedID);
				 });


			selected = d;
			selectedID = d.objectID;
			selectedVisual = visual;
		}

		function updateSVGTransform() {
			ssg.attr('transform', 'translate(' + tx + ',' + ty + ') scale(' + scale + ',' + scale + ')');
			if (ended) {
				if (layout === 'ForceDirected') {
					force.start();
					force.tick();
					force.stop();
				}
			}
		}

		ss.mousewheel(function(evt) {
			var direction = evt.deltaY;

			if (direction > 0) {
				scale *= 0.9;
			} else {
				scale /= 0.9;
			}

			updateSVGTransform();
		});

		cc.bind('contextmenu', function(e) {
			return false;
		});

		cc.mousedown(function(m) {
			if (m.which === 3) {
				sketching = true;
				startDragPoint = [m.clientX, m.clientY];
				if (touched)
					sketchStart = touched;
				return;
			}

			if ((m.which === 1) && (!oncell)) {
				dragging = true;
				startDragPoint = [m.clientX, m.clientY];
				return;
			}

		});
		cc.mouseup(function(m) {
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
		cc.mousemove(function(m) {
			if (sketching) {
				var nextPoint = [m.offsetX, m.offsetY];
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
				node.attr('transform', function(d) {
					nodePositions[d.objectID] = [d.x, d.y];
				});
			}
		}

		function loadPositions() {
			if (node) {
				node.attr('transform', function(d) {
					var existingPosition = nodePositions[d.objectID];
					if (existingPosition) {
						d.x = existingPosition[0];
						d.y = existingPosition[1];
					}
				});
			}
		}

		nd.onChange = function() {
			savePositions();

			force.stop();

			svg.selectAll('.node').remove();
			svg.selectAll('.link').remove();

			var nodeTags = { };

			nodes = [];
			nodeIndex = {};
			edgeIndex = {};

			renderItems(v, GRAPH_MAX_NODES, function(s, v, xxrr) {

				var minTime, maxTime;
				if (timeline) {
					var times = _.map(xxrr, function(o) {
						return objTime(o[0]);
					});
					minTime = _.min(times);
					maxTime = _.max(times);
				}

				function addNodeForObject(x, ots) {
					var size = defaultNodeSize;

					if (ots) {
						var maxScale = undefined;
						for (var i in ots) {
							if (nodeScale[i] !== undefined) {
								if (maxScale === undefined)
									maxScale = nodeScale[i];
								else
									maxScale = Math.max(maxScale, nodeScale[i]);
							}
						}
						if (maxScale !== undefined)
							size *= maxScale;
					}

					if (size <= 0)
						return;

					var N = addNode(x.id, x.name || '', defaultColor, size, size, objIcon(x), 'circle', geographic ? objSpacePointLatLng(x) : null);

					if (timeline) {
						if (minTime !== maxTime) {
							var when = objTime(x);
							N.fixedX = timelineWidth * (when - minTime) / (maxTime - minTime);
						}
					}
				}

				for (var i = 0; i < xxrr.length; i++) {
					var x = xxrr[i][0];

					var ots = objTagStrength(x, true, true);
					x.ots = ots;

					addNodeForObject(x, ots);

					for (var t in ots) {
						if (nodeTags[t] === undefined)
							nodeTags[t] = 0;
						nodeTags[t] += ots[t];
					}

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

					var ots = x.ots;

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
						_.each(ots, function(v, k) {
							rtags.push([k, {
								stroke: 'rgba(64,64,64,0.5)',
								strokeWidth: (thickLine * v),
								strength: v,
								undirected: true
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
								strokeWidth: thinLine,
								contains: true
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

				if (includeEdges['trust'] || includeEdges['value'] || includeEdges['not'] || includeEdges['other']) {

					function edgeType(e) {
						if (!e) return 'Other';
						if (typeof e === 'number')
							return 'Other';
						if (typeof e === 'string') {
							if (e === 'trust') return 'trust';
							if (e === 'value') return 'value';
							if (e === 'not') return 'not';
						}
						return 'Other';
					 }

					 //TODO if edge already exists, replace with a style that indicates multiple edge types exist

					 function getEdgeVisual(e, undirected) {
						var edgeValue = undirected ? $N.ugraph.edge(e) : $N.dgraph.edge(e);

						var et = edgeType(edgeValue);
						if (!includeEdges[et]) return null;

						var s = null;
						if (typeof edgeValue === 'number') s = edgeValue;
						else {
							var values = _.values(edgeValue);
							for (var i = 0; i < values.length; i++) {
								if (typeof values[i] === 'number')
									s = (s === null) ? values[i] : Math.max(values[i], s);
							}
						}
						if (s === null) s = 1.0;

						function p(s, min, max) {
							return s * (max - min) + min;
						}

						var stroke;
						var strokeWidth = Math.max(1.0, thickLine * s);
						if (et === 'trust') {
							stroke = 'rgba(40,' + parseInt(p(s, 0.7, 1.0) * 255) + ',40,' + p(s, 0.5, 0.9) + ')';
						}
						else if (et === 'value') {
							stroke = 'orange';
							strokeWidth /= 2;
						}
						else if (et === 'not') {
							stroke = 'red';
							strokeWidth /= 2;
						}
						else {
							var g = p(s, 0.4, 0.5);
							stroke = 'rgba(' + parseInt(g * 255) + ',' + parseInt(g * 255) + ',' + parseInt(g * 255) + ',' + g + ')';
						}

						var q = {
							stroke: stroke,
							strokeWidth: strokeWidth,
							strength: s
						};
						if (undirected)
							q.undirected = true;
						return q;
					 }


					for (var k = 0; k < xxrr.length; k++) {
						var x = xxrr[k][0];

						var inEdges = $N.dgraph.inEdges(x.id);
						for (var j = 0; j < inEdges.length; j++) {
							var e = inEdges[j];
							var source = $N.dgraph.source(e);

							if (hasEdge(source, x.id, e) === true) continue;

							var ev = getEdgeVisual(e);
							if (ev)
								addEdge(source, x.id, ev, e);
						}

						var outEdges = $N.dgraph.outEdges(x.id);

						for (var j = 0; j < outEdges.length; j++) {
							var e = outEdges[j];
							var target = $N.dgraph.target(e);


							if (hasEdge(x.id, target, e) === true) continue;

							var ev = getEdgeVisual(e);

							if (ev)
								addEdge(x.id, target, ev, e);
						}

						var uedges = $N.ugraph.incidentEdges(x.id);
						for (var j = 0; j < uedges.length; j++) {
							var e = uedges[j];
							var incidentNodes = $N.ugraph.incidentNodes(e);

							var order = incidentNodes[0] < incidentNodes[1];
							var a = order ? incidentNodes[1] : incidentNodes[0];
							var b = order ? incidentNodes[0] : incidentNodes[1];

							if (hasEdge(a, b, e) === true) continue;


							var ev = getEdgeVisual(e, true);
							if (ev)
								addEdge(a, b, ev, e);
						}

					}
				}

				var edges = _.values(edgeIndex);


				force
					.nodes(nodes)
					.links(edges)
					.drag()
						.on('dragstart', function() { oncell = true;})
						.on('dragend', function() { oncell = false; });


				node = svg.selectAll('.node').data(nodes).enter().append('g').attr('class', 'node');

				var link = svg.selectAll('.link')
					.data(edges)
					.enter().append('line')
					.attr('class', 'link')
					.attr('marker-end', function(l) {
						if (l.style)
							if (l.style.undirected)
								return '';
						return 'url(#end)';
					});





				/*node.append("rect")
				 .attr("x", function(d) { return -d.width/2; })
				 .attr("y", function(d) { return -d.height/2; })
				 .attr("width", function(d) { return d.width; } )
				 .attr("height", function(d) { return d.height; } )
				 .style("fill", function(d) { return d.color; });*/
				node.append('circle').each(function(d) {
					d3.select(this).attr({
						x: -d.width / 2,
						y: -d.width / 2,
						r: d.width,
						fill: d.color
					});
				});
				node.append('image').each(function(d) {
					var iconSize = d.width;
					d3.select(this).attr({
						'xlink:href': d.icon,
						x: -iconSize / 2,
						y: -iconSize / 2,
						width: iconSize,
						height: iconSize
					});
				});
				node.append('text').each(function(d) {
					d3.select(this).attr({
						dx: -d.width / 2,
						dy: '4em'
					}).text(d.name);
				});

				svg.selectAll('.node').each(function(n) {
					if (n.objectID === selectedID) {
						selected = n;
						selectedVisual = this;
					}
					return true;
				 });

				link.each(function(l) {
					var sw = ((l.style) && (l.style.strokeWidth)) ? l.style.strokeWidth : 3;
					var s = ((l.style) && (l.style.stroke)) ? l.style.stroke : 'black';
					d3.select(this).attr({
						'stroke-width': sw,
						'stroke': s
					});
				});

				force.linkDistance(function(d) {
					if (d.style.contains) {
						return 0;
					}

					var sw = d.source.width;
					var tw = d.target.width;
					return sw + tw;
				});
				force.charge(function(d) {
					return -(d.width * 12.0);
				});
				force.chargeDistance(1000);
				force.theta(0.5); //default=0.8


				force.on('tick', function() {
					node.attr('transform', function(d) {
						if (timeline) {
							if (d.fixedX !== undefined)
								d.x = d.fixedX;
						}
						if (geographic) {
							//TODO project
							if ((d.lon !== undefined) && (d.lat !== undefined)) {
								d.x = d.lon * 35;
								d.y = d.lat * -50;
							}
						}
						return 'translate(' + d.x + ',' + d.y + ')';
					});

					link.each(function(d) {
						if (d.link === undefined)
							d.link = d3.select(this);
						d.link.attr({
							x1: d.source.x,
							y1: d.source.y,
							x2: d.target.x,
							y2: d.target.y
						});
					});

				});


				node.on('mouseover', function(d) {
					if (d3.event.defaultPrevented)
						return; // ignore drag
					var oid = d.objectID;
					if (oid)
						touched = oid;

					d3.select(this).select('circle').style('fill', highlightColor);
				});
				node.on('mouseout', function(d) {
					if (d3.event.defaultPrevented)
						return; // ignore drag
					touched = null;
					d3.select(this).select('circle').style('fill', d.color);
				});

				node.on('click', function(d) {
					if (d3.event.defaultPrevented)
						return; // ignore drag
					selectNode(d, d3.select(this));
				});

				loadPositions();

				node.call(force.drag);
				force.start();

				var fixed = (layout !== 'ForceDirected');
				node.each(function(d) {
				   d.fixed = fixed;
				});

				later(function() {
					selectNode();

					_.each(nodeTags, function(v, k) {
						if (nodeScale[k] === undefined) {
							var nc = newDiv();
							var v = 1; //(nodeScale[k]!==undefined) ? nodeScale[k] : 1;
							var sl = $('<input type="range" min="0" max="5" step="0.1" value="' + v + '"/>')
								.change(function() {
									var nv = parseFloat(sl.val());
									if (nv < 0.2) nv = 0;

									nodeScale[k] = nv;

									later(nd.onChange);
									return false;
								});
							nodeScale[k] = v;
							nc.append(sl, k);
							nodeMenu.append(nc);
						}
					});

				});

				edges = null;

			});

		};



		var submenu = $('#ViewMenu');

		var modeSelect = $('<select/>').appendTo(submenu);
		modeSelect.append('<option value="Network">Network</option>');
		modeSelect.append('<option value="Geographic">Geographic</option>');
		modeSelect.append('<option value="Timeline">Timeline</option>');
		modeSelect.change(function() {
			timeline = $(this).val() == 'Timeline';
			geographic = $(this).val() == 'Geographic';
			nd.onChange();
		});

		var layoutSelect = $('<select/>').appendTo(submenu);
		layoutSelect.append('<option value="ForceDirected">Force Directed</option>');
		layoutSelect.append('<option value="None">None</option>');
		layoutSelect.change(function() {
			layout = $(this).val();
			nd.onChange();
		});
		layout = 'ForceDirected';


		var edgeMenu = newDiv().addClass('HUDTopRight').appendTo(nd);
		edgeMenu.css('text-align', 'right');

		var edgeTypes = ['Type', 'Author', 'Object', 'Subject', 'Reply', 'trust', 'value', 'not', 'other'];
		_.each(edgeTypes, function(e) {
			var includeCheck = $('<input type="checkbox"/>');
			includeCheck.click(function() {
				includeEdges[e] = (includeCheck.is(':checked'));
				nd.onChange();
			});

			edgeMenu.append(e, includeCheck, '<br/>');
		});


		nd.onChange();

		nd.destroy = function() {
			svg = null;
			force = null;
		};

		return nd;


	},
	stop: function() {
	}
});
