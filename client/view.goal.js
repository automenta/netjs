var updatePeriod = 30 * 1000; //in ms

function newGoalWidget(g)  {

	var d = newDiv();

	d.attr('class', 'GoalSummary ui-widget-content');

	var aa = $('<a href="#"><h2>' + g.name + '</h2></a>');
	d.append(aa);
	aa.click(function() {
		newPopupObjectView(g);
	});

	d.attr('style', 'font-size: ' + (100.0 * (0.25 + g.strength) )+ '%');

	//display author avatar

	//display ETA - estimated time to activation

	var dismissButton = $('<button title="Dismiss">OK</button>');
	d.append(dismissButton);

	return d;
}

function saveGoalTags(gt, when) {
	_.each(gt, function(g) {
		var ng = objNew();

		if (when)
			ng.when = when;
		else
			ng.delay = 0; //NOW

		ng.own();
		ng = objName(ng, g);
		ng = objAddTag(ng, 'Goal');
		ng = objAddTag(ng, g);
		
		self.pub(ng, function(err) {
			$.pnotify({
					title: 'Unable to save Goal.',
					type: 'Error'            
				});                
			}, function() {
				$.pnotify({
					title: 'Goal saved (' + ng.id.substring(0,6) + ')'
				});        
			self.notice(ng);
		});		

	});

	saveSelf();				
}


function renderGoal(v) {
	var numHours = 24;
	var timeUnitLengthMS = 60 * 60 * 1000;

    var s = self;
	var plan = getPlan();
    
    var planTimes = _.keys(plan);
    
    var time = new Date();
    time.setMinutes(0);
    time.setSeconds(0);
    time.setMilliseconds(0);
    time = time.getTime();
    
    var d = newDiv();
    d.attr('style', 'width:100%; overflow: auto;');

    
    var centroidTimes = self.objectsWithTag('PlanCentroid');
    if (!centroidTimes) centroidTimes = [];

    var plans = [];
    var centroids = [];
    for (var k = 0; k < centroidTimes.length; k++) {
        centroids.push( self.object(centroidTimes[k]) );
    }
    

    function save() {
		if (!s.myself()) {
			$.pnotify('Can not save; not identified.');
			return;
		}

        if (self.id() !== s.myself().id)
            return;

        plan = { };
        for (var i = 0; i < numHours; i++) {
            var tt = planSlotTimes[i];
            if (planSlots[i].length > 0)
                plan[tt] = planSlots[i];
            
        }
        
        later(function() {
            saveSelf(function(m) {
               m.plan = plan; 
               return m;
            });
        });
        /*s.notice(me);
        s.pub(me, function(err) {
            $.pnotify({
               title: 'Unable to save Self.',
               type: 'Error',
               text: err
            });           
        }, function() {
            $.pnotify({
               title: 'Self Saved.'            
            });           
        });*/
    }

	function newSelfTimeGrid(clicked) {
		
		for (var i = 0; i < numHours; i++) {
		    var cell = $('<a>');
			cell.addClass('timecell');

			//http://css-tricks.com/how-to-create-a-horizontally-scrolling-site/
			var fs = 100.0 * (0.25 + (numHours-i)/numHours);
			cell.attr('style', 'display: inline-block;');

		    var endtime = time + 60.0 * 60.0 * 1000.0 * 1.0;
		    var timed = new Date(time);
		    var rowHeader = newDiv();

			/*
		    if (i % 12 == 0) {
		        rowHeader.html(timed.toLocaleDateString() + ': ' + timed.toLocaleTimeString());            
		    }
		    else {
		        rowHeader.html(timed.toLocaleTimeString());                        
		    }*/
			var lds = timed.toLocaleDateString()
			cell.attr('title', timed.toLocaleDateString() + ': ' + timed.toLocaleTimeString());
			rowHeader.html(timed.toLocaleTimeString().substring(0, 2));
		    
		    var t = newDiv();        
		    var u = newDiv();
		    
		    
		    
		    t.append('&nbsp;');
		    _.each(plans, function(p) {
		        t.append(newTagButton(p));
		        t.append('&nbsp;');
		    });
		    
		    _.each(centroids, function(c) {
		        u.append(newObjectSummary(c));
		    });
		    
		    if (plans.length > 0)
		        t.addClass('SelfTimeFilled');

		    (function(i, time, endtime) {
		        cell.click(function() {
		            var targetTime = (time + endtime)/2.0;
					clicked(time);
					/*
		            var targetTime = (time + endtime)/2.0;
		            var d = newPopup("Select Tags for " + new Date(targetTime), {width: 800, height: 600, modal: true});
		            d.append(newTagger(planSlots[i], function(results) {
		                planSlots[i] = results;
		                later(function() {
		                    save();                    
		                    d.dialog('close');                        
		                });
		                //container.html(newSelfTimeList(s, x, container));
		            }));
					*/
		        });
		    })(i, time, endtime);
		    
			cell.append(rowHeader);
		    cell.append(t);
		    cell.append(u);
		    d.append(cell);
		    time = endtime;
		}
		
		return d;
	}
    


	var sidebar = newDiv('goalviewSidebar');
	{
		function newNowDiv() {
			sidebar.empty();

			//sidebar.html(newProtogoalMenu());	
			var currentGoalHeader = $('<div id="GoalHeader">Goals</div>');
			sidebar.append(currentGoalHeader);


			var addbutton = $('<button title="Add Tag">[+]</button>');
			currentGoalHeader.append(addbutton);
			currentGoalHeader.append('<button disabled title="Set Focus To This Goal">Focus</button>')
			currentGoalHeader.append('<button disabled title="Clear">[x]</button>');

			var userSelect = $('<select></select>');
			if (self.myself())
				userSelect.append('<option>My (' + self.myself().name + ')</option>');
			userSelect.append('<option>Everyone\'s</option>');

			var users = self.objectsWithTag('User');
			_.each(users, function(uid) {
				var u = self.getObject(uid);
				if (u)
					userSelect.append('<option oid="' + u + '">' + u.name + '</option>');
			});
			currentGoalHeader.prepend(userSelect);

			var now = self.getGoals(null);
			_.each(now, function(g) {
				sidebar.append( newObjectSummary(g) );
			});

			addbutton.click(function() {
				var d = newPopup("Add a Goal", {width: 800, height: 600, modal: true});
		        d.append(newTagger([], function(results) {
					saveGoalTags(results);

		            //now = _.unique(now.concat(results));
		            later(function() {
		                d.dialog('close');                        
						newNowDiv();
		            });
		            //container.html(newSelfTimeList(s, x, container));
		        }));
			});

		}

		newNowDiv();
	}
	v.append(sidebar);

	var goalList = newDiv('goalviewList');
	v.append(goalList);


	var now = true;
	var goalTime = Date.now();

	function updateGoalList() {
		goalList.html('');


		for (var i = 0; i < numHours; i++) {
			var d = newDiv();
			d.addClass('ui-widget-content');
			d.addClass('ui-corner-all');

			var ti = time + (i * timeUnitLengthMS);
			
			var goals = self.getGoals(ti, ti+timeUnitLengthMS);

			var ts = new Date(ti);
			d.append('<span class="goallistTimestamp">' + ts + '</span>');

			var addbutton = $('<button title="Add Tag">[+]</button>');
			d.append(addbutton);

			var y = function() {
				var tti = ti;
				var tts = ts;
				addbutton.click(function() {
					var d = newPopup("Add a Goal at " + tts, {width: 800, height: 600, modal: true});
				    d.append(newTagger([], function(results) {
						saveGoalTags(results, tti+timeUnitLengthMS/2);

				        //now = _.unique(now.concat(results));
				        later(function() {
				            d.dialog('close');                        
							updateGoalList();
				        });
				        //container.html(newSelfTimeList(s, x, container));
				    }));
				});
			}; y();

			_.each(goals, function(g) {
				var ogg = objTags(g);
				if (_.contains(ogg, 'PlanCentroid'))
					return;

				var gg = newObjectSummary( g );
				gg.addClass('miniGoalSummary');
				d.append(gg);
			});


			_.each( _.filter(centroids, function(c) {
				return (c.when >= ti) && (c.when < ti + timeUnitLengthMS);
			}), function(g) {
				var gg = newObjectSummary( g );
				gg.addClass('miniGoalSummary');
				gg.addClass('centroidSummary');
				d.append(gg);
			});

			goalList.append(d);			
		}

/*		if (now)
			goalTime = Date.now();

		var st = newSelfTimeGrid(function(clickedTime) {
			goalTime = clickedTime;
			now = false;
			updateGoalList();
		});

		goalList.append(st);

		goalList.append('<br/>');
		goalList.append('<hr/>');
		goalList.append('NOW: ' + new Date(goalTime));

		var goals = self.getGoals(goalTime);
		for (var i = 0; i < goals.length; i++) {
			goalList.append(newGoalWidget(goals[i]));
		}*/
	}
	setInterval(updateGoalList, updatePeriod);
	updateGoalList();

}

function getPlan() {
	if (!self.myself())
		return { };

    var plan = self.myself().plan;
    if (!plan) {
        plan = self.myself().plan = { };
	}

	return plan;
}
