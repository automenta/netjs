addView({
	id: 'time',
	name: 'Time',
	icon: 'icon/view.time.svg',
	start: function(v) {

		//            <script src="lib/timeline/timeline-min.js" type="text/javascript"></script>
		var twrap = newDiv().appendTo(v);

			$LAB
				.script('lib/timeline/timeline-min.js')
				.wait(function() {
					var timeline = new links.Timeline(v[0]);

					//http://visjs.org/docs/timeline.html
					var data = [];
					var options = {
						'width': '100%',
						'height': '100%',
						'editable': true, // enable dragging and editing events
						'style': 'box',
						'eventMargin': 0,
						'cluster': true,
						'autoResize': true,
						'start': Date.now() - 1 * 60 * 60 * 1000 /* -1 hour */,
						'end': Date.now() + 2 * 24 * 60 * 60 * 1000, /* 2 days */
						'zoomMin': 60 * 1000, /* 1 min */
						'groupsChangeable': false,
						'animate': 0
					};

					var times = {};

					var numTimeSegments = 128;
					var timeUnitLengthMS = 30 * 60 * 1000; //30min

					var currentViewRange = null;
					function redraw() {
						if (currentViewRange) {
							options.start = currentViewRange.start;
							options.end = currentViewRange.end;
						}

						timeline.clearItems();
						data = [];

						foreachTimedObject(null, function(goals, centroids) {
							function addGoal(g) {
								var duration = g.duration || timeUnitLengthMS;
								var gs = newObjectView(g, {
									depthRemaining: 0,
									nameClickable: false,
									showActionPopupButton: false,
									showSelectionCheck: false,
									showTime: false,
									showAuthorName: false,
									startMinimized: true
								});

								var G = {
									'id': g.id,
									'start': g.when,
									'end': g.when + duration,
									'content': '<div class="timelineLabel" uid="' + g.id + '">' + gs.html() + '</span>'
								};
								if (g.author == $N.id()) {
									G.group = 'me';
								}
								else if (g.author) {
									G.group = 'others';
								}
								else {
									G.group = 'system';
								}
								G.editable = (g.author === $N.id());
								if (G.editable) {
									times[g.id] = [G.start, G.end];
								}


								data.push(G);
							}

							_.each(goals, addGoal);
							_.each(centroids, addGoal);

						});

						timeline.draw(data, options);

					}

					function changed(x) {
						var d = timeline.getData();
						for (var i = 0; i < d.length; i++) {
							if (d[i].editable) {
								var D = d[i];
								var id = D.id;
								var lastTimes = times[id];
								var dstart = D.start;
								var dend = D.end;
								if (dstart.getTime)
									dstart = dstart.getTime();
								if (dend.getTime)
									dend = dend.getTime();
								if ((lastTimes[0] != dstart) || (lastTimes[1] != dend)) {
									times[id] = [dstart, dend];

								var G = $N.getObject(id);
									if (G) {
										G.when = dstart;
										G.duration = dend - dstart;
										$N.pub(G);
									}
								}
							}
						}
					}

					redraw();

					function updateHandlers() {
						$('.timelineLabel').off('dblclick');
						$('.timelineLabel').dblclick(function() {
							var uid = $(this).attr('uid');
							newPopupObjectView($N.getObject(uid));
							return false;
						});
					}

					links.events.addListener(timeline, 'ready', function() {
						updateHandlers();
					});

					//links.events.addListener(timeline, 'rangechanged', changed);
					links.events.addListener(timeline, 'edit', changed);
					links.events.addListener(timeline, 'change', changed);
					links.events.addListener(timeline, 'changed', changed);
					/*links.events.addListener(timeline, 'select', function(s) {

					});*/
					links.events.addListener(timeline, 'add', function() {
						var dd = timeline.getData();
						var tti = dd[dd.length - 1].start.getTime();
						var d = newPopup('Add a Goal at ' + new Date(tti), {width: 800, height: 600, modal: true});
						d.append(newTagger([], function(results) {
							saveAddedTags(results, 'Goal', 'goal', tti);
							later(function() {
								d.dialog('close');
							});
						}));
						dd.pop();

						timeline.draw(dd, options);
					});
					links.events.addListener(timeline, 'rangechanged', function(p) {
						updateHandlers();
						currentViewRange = p;
					});

					twrap.onChange = redraw;

				});


		return twrap;
	},
	stop: function(v) {
	}
});


//DEPRECATED:
function newTimeViewGridster(v) {
    var numTimeSegments = 48;
    var timeUnitLengthMS = 30 * 60 * 1000; //30min

    var goalWidgetSize = [170, 170];
    var goalWidgetScale = '75%';

    var d = newDiv().appendTo(v);

    var colTimes = {};

    var gridsterParam = {
        widget_base_dimensions: goalWidgetSize,
        widget_margins: [6, 6],
        min_cols: numTimeSegments
    };

    function updateGoal(g, when, duration) {
        var G = $N.getObject(g);
        if (when)
            G.when = when;
        if (duration)
            G.duration = duration;
        $N.pub(G);
    }

    var resizingGoalID = null;
    var goalGridsterParam = _.extend(_.clone(gridsterParam), {
        resize: {
            enabled: true,
            max_size: [Infinity, 1],
            start: function(e, ui, $widget) {
                resizingGoalID = $widget.attr('goalid');
            },
            stop: function(e, ui, $widget) {
                var cols = $widget.attr('data-sizex');
                var colTime = cols * timeUnitLengthMS;
                updateGoal(resizingGoalID, null, colTime);
                resizingGoalID = null;
            }
        },
        draggable: {
            start: function() {
            },
            stop: function(event, ui) {
                var p = ui.$player;
                var g = p.attr('goalid');
                var targetCol = p.attr('data-col') - 1;
                var targetTime = colTimes[targetCol];
                updateGoal(g, targetTime, null);
                //console.log(, , 'dragged');
            }
        }
    });

    var headerRow = newDiv().addClass('gridster').appendTo(d);
    var headerRowGrid = $('<ul/>').appendTo(headerRow);

    d.append('<br/><br/>');

    var goalRows = newDiv().addClass('gridster').appendTo(d);
    var goalRowsGrid = $('<ul/>').appendTo(goalRows);

    var goalRowsGridster = goalRowsGrid.gridster(goalGridsterParam).data('gridster');




    foreachGoal(numTimeSegments, timeUnitLengthMS, $N.id(), function(time, goals, centroids, column) {
        colTimes[column] = time;

        var b = $('<li class="mainViewButton"></li>');
        b.attr('data-col', 1 + column);
        b.attr('data-row', 1);
        b.css('border-bottom', '1px solid gray');

        //b.append(name);

        var ts = new Date(time);

        if ((ts.getHours() !== 0) || (ts.getMinutes() !== 0)) {
            var m = ts.getMinutes();
            if (m === 0)
                m = '00';
            ts = ts.getHours() + ':' + m;
        }
        else {
            ts = ts.toDateString();
            ts = ts.substring(0, ts.length - 5);
        }
        b.append(ts);

        var addbutton = $('<button title="Add Tag">[+]</button>').appendTo(b);

        var y = function() {
            var tti = time;
            var tts = ts;
            addbutton.click(function() {
                var d = newPopup('Add a Goal at ' + tts, {width: 800, height: 600, modal: true});
                d.append(newTagger([], function(results) {
                    saveAddedTags(results, 'Goal', 'goal', tti + timeUnitLengthMS / 2);

                    //now = _.unique(now.concat(results));
                    later(function() {
                        d.dialog('close');
                        //updateGoalList();
                    });
                    //container.html(newSelfTimeList(s, x, container));
                }));
            });
        };
        y();

        headerRowGrid.append(b);

        function addGoal(g) {
            var gg = $('<li class="mainViewButton"></li>');
            gg.css('font-size', goalWidgetScale);
            var O = newObjectView(g, {
                showAuthorIcon: false,
                showAuthorName: false,
                showActionPopupButton: false
            });
            gg.attr('goalid', g.id);
            O.css('height', '95%');

            gg.append(O);

            var duration = g.duration || timeUnitLengthMS;
            var cols = parseInt(Math.round(parseFloat(duration) / parseFloat(timeUnitLengthMS)));

            goalRowsGridster.add_widget(gg, cols, 1, 1 + column, 1);
        }

        _.each(goals, addGoal);
        _.each(centroids, addGoal);

    });



    var headerRowGridster = headerRowGrid.gridster(gridsterParam).data('gridster');

    headerRowGridster.disable();


    return d;
}

function foreachTimedObject(user, withObjects) {
    var time = new Date();
    time.setMinutes(0);
    time.setSeconds(0);
    time.setMilliseconds(0);
    time = time.getTime();

    var goals = _.filter(_.values($N.instance), function(x) {
        var w = x.when || 0;
        if (x.duration)
            w += x.duration;
        return (w >= time);
    });

    withObjects(goals);

}

function foreachGoal(numTimeSegments, timeUnitLengthMS, user, onTimeSegment) {

    var time = new Date();
    time.setMinutes(0);
    time.setSeconds(0);
    time.setMilliseconds(0);
    time = time.getTime();

    var GOALS = $N.objectsWithTag('Goal', true);

    for (var i = 0; i < numTimeSegments; i++) {

        var ti = time + (i * timeUnitLengthMS);

        var goals = _.filter(GOALS, function(x) {
            if (user)
                if (x.author != user)
                    return;

            var w = x.when || 0;
            return ((w >= ti) && (w < ti + timeUnitLengthMS));
        });


        /*
         var ts = new Date(ti);
         if (ts.getHours() != 0) {
         ts = ts.getHours() + ":00";
         }

         var d = newDiv().addClass('alternatingDiv').append('<span class="goalRowHeading">' + ts + '</span>');

         var addbutton = $('<button title="Add Tag">[+]</button>').appendTo(d);

         var y = function() {
         var tti = ti;
         var tts = ts;
         addbutton.click(function() {
         var d = newPopup("Add a Goal at " + tts, {width: 800, height: 600, modal: true});
         d.append(newTagger([], function(results) {
         saveAddedTags(results, 'Goal', tti + timeUnitLengthMS / 2);

         //now = _.unique(now.concat(results));
         later(function() {
         d.dialog('close');
         //updateGoalList();
         });
         //container.html(newSelfTimeList(s, x, container));
         }));
         });
         };
         y();

         _.each(goals, function(g) {
         var ogg = objTags(g);
         if (_.contains(ogg, 'GoalCentroid'))
         return;

         var gg = newObjectView(g).addClass("miniGoalSummary");
         d.append(gg);
         });
         */


        var centroids = $N.objectsWithTag('GoalCentroid', true) || [];
        if (centroids) {
            centroids = _.filter(centroids, function(c) {
                return (c.when >= ti) && (c.when < ti + timeUnitLengthMS);
            });
        }

        onTimeSegment(ti, goals, centroids, i);


    }

}


//Deprecated
function newGoalList(target, user, centroids) {
    var numTimeSegments = 24;
    var timeUnitLengthMS = 30 * 60 * 1000; //30min

    var time = new Date();
    time.setMinutes(0);
    time.setSeconds(0);
    time.setMilliseconds(0);
    time = time.getTime();

    var GOALS = $N.objectsWithTag('Goal', true);

    for (var i = 0; i < numTimeSegments; i++) {

        var ti = time + (i * timeUnitLengthMS);

        var goals = _.filter(GOALS, function(x) {
            if (x.author != user)
                return;

            var w = x.when || 0;
            return ((w >= ti) && (w < ti + timeUnitLengthMS));
        });


        var ts = new Date(ti);

        if ((ts.getHours() !== 0) || (ts.getMinutes() !== 0)) {
            var m = ts.getMinutes();
            if (m === 0)
                m = '00';
            ts = ts.getHours() + ':' + m;
        }
        else {
            ts = ts.toDateString();
            ts = ts.substring(0, ts.length - 5);
        }

        var d = newDiv().addClass('alternatingDiv').append('<span class="goalRowHeading">' + ts + '</span>');

        var addbutton = $('<a href="#" title="Add Tag">[+]</a>').appendTo(d);

        var y = function() {
            var tti = ti;
            var tts = ts;
            addbutton.click(function() {
                var d = newPopup('Add a Goal at ' + tts, {width: 800, height: 600, modal: true});
                d.append(newTagger([], function(results) {
                    saveAddedTags(results, 'Goal', 'goal', tti + timeUnitLengthMS / 2);

                    //now = _.unique(now.concat(results));
                    later(function() {
                        d.dialog('close');
                        //updateGoalList();
                    });
                    //container.html(newSelfTimeList(s, x, container));
                }));
            });
        };
        y();

        _.each(goals, function(g) {
            var ogg = objTags(g);
            if (_.contains(ogg, 'GoalCentroid'))
                return;

            var gg = newObjectView(g).addClass('miniGoalSummary');
            d.append(gg);
        });


        if (centroids) {
            _.each(_.filter(centroids, function(c) {
                return (c.when >= ti) && (c.when < ti + timeUnitLengthMS);
            }), function(g) {
                newObjectView(g).addClass('miniGoalSummary centroidSummary').appendTo(d);
            });
        }

        target.append(d);
    }

}
