/*!
 * netention.js v1.2 - client-side functionality
 * Attentionated by @automenta and @rezn8d
 */


var ID_UNKNOWN = 0;
var ID_ANONYMOUS = 1;
var ID_AUTHENTICATED = 2;


function setClientID($N, cid, key, otherSelves) {
    if (cid) {
        $N.set('clientID', cid);
    }
    $N.set('authorized', key);
    $N.set('otherSelves', _.unique(otherSelves));

    /*$.pnotify({
     title: 'Connected',
     text: that.myself().name + ' (' + that.get('clientID').substring(0,4) + ')'
     });*/

    if (TogetherJS) {
        TogetherJS.reinitialize();
        TogetherJS.refreshUserData();
    }

}

function identity() {
    var a = getCookie('authenticated');
    if (a === 'anonymous') {
        return ID_ANONYMOUS;
    }
    if (a !== 'false') {
        return ID_AUTHENTICATED;
    }
    return ID_UNKNOWN;
}


function netention(f) {


    var $NClient = Backbone.Model.extend({
        clear: function() {
            this.clearObjects();
            this.set('clientID', 'undefined');
            this.attention = {};
            this.tags = {};
            this.properties = {};
            this.ontoIndex = lunr(function() {
                this.field('name', {boost: 4});
                this.field('description');
                this.field('properties');
                this.ref('id');
            });
        },
        clearObjects: function() {
            this.attention = {};
            this.set('deleted', {});
            this.set('replies', {});
            this.set('layer', {include: [], exclude: []});
            this.set('focus', null);
            this.userRelations = null;
        },
        tag: function(t) {
            return this.tags[t];
        },
        tagRoots: function() {
            var that = this;
            //this might be suboptimal
            return _.select(_.keys(this.tags), function(tt) {
                var t = that.tag(tt);
                if (!t.tag)
                    return true;
                else
                    return (t.tag.length == 0);
            });
        },
        getSubTags: function(s) {
            return subtags(this.tags, s);
        },
        isProperty: function(p) {
            return this.properties[p] != undefined;
        },
        objects: function() {
            return this.attention;
        }, //DEPRECATED

        /* returns a list of object id's */
        objectsWithTag: function(t, fullObject, includeSubTags) {
            //TODO support subtags
            var r = [];

            if (includeSubTags) {
                t = _.union([t], $N.getSubTags(t));
            }

            for (var k in this.objects()) {
                var v = this.getObject(k);
                if (objHasTag(v, t))
                    r.push(fullObject ? v : k);
            }
            return r;
        },
        getObject: function(id) {
            return this.attention[id];
        }, //deprecated
        object: function(id) {
            return this.attention[id];
        },
        deleteSelf: function(clientID) {
            var os = this.get('otherSelves');
            if (os.length < 2) {
                $.pnotify({
                    title: 'Can not delete self: ' + clientID.substring(6) + '...',
                    text: 'Must have one extra self to become after deleting',
                    type: 'Error'
                });
                return;
            }
            if (_.contains(os, clientID)) {
                os = _.without(os, clientID);
                this.set('otherSelves', os);

                this.deleteObject(this.object(clientID));
            }

        },
        //->tag
        getTag: function(t) {
            return this.tags[t];
        },
        getProperty: function(p) {
            return this.properties[p];
        },
        getIncidentTags: function(userid, oneOfTags) {
            return objIncidentTags(this.objects(), oneOfTags, userid);
        },
        setObject: function(o) {
            var i = o.id;
            this.objects()[i] = o;
            return o;
        },
        layer: function() {
            return this.get('layer');
        },
        id: function() {
            return this.get('clientID');
        },
        myself: function() {
            return this.getObject(this.id());
        },
        become: function(target) {

            if (!target)
                return;

            var targetID = target;
            if (typeof (target) !== "string") {
                this.notice(target);
                targetID = target.id;
            }

            if (configuration.connection == 'local') {
                var os = $N.get('otherSelves');
                os.push(targetID);

                $N.set('clientID', targetID);
                $N.save('otherSelves', _.unique(os));

                $N.trigger('change:attention');
                updateBrand(); //TODO use backbone Model instead of global fucntion            
                
                $N.startURLRouter();
            }
            else {
                this.socket.emit('become', target, function(nextID) {
                    if (nextID) {
                        /*$.pnotify( {
                         title: 'Switched profile',
                         text: nextID
                         });*/

                        //if (($N.id()) && ($N.id() == nextID)) //already target
                        //return;


                        later(function() {

                            $N.set('clientID', nextID);
                            setCookie('clientID', nextID);
                            //$N.connect(target, function() {
                            var os = $N.get('otherSelves');
                            os.push(nextID);

                            $N.save('otherSelves', _.unique(os));

                            $N.clearObjects();

                            $N.getAuthorObjects(nextID, function() {
                                $N.getLatestObjects(1000, function() {
                                    //$N.trigger('change:attention');
                                    updateBrand(); //TODO use backbone Model instead of global function
                                    
                                    $N.startURLRouter();
                                });
                            });


                            //});
                        });
                    }
                    else {
                        $.pnotify({
                            title: 'Unable to switch profile',
                            text: err + ' ' + (typeof (target) === "string" ? target : target.id),
                            type: 'Error'
                        });

                    }
                });
            }
        },
        connect: function(targetID, whenConnected) {
            var originalTargetID = targetID;
            var suppliedObject = null;
            if (targetID) {
                if (typeof (targetID) !== "string") {
                    suppliedObject = targetID;
                    targetID = suppliedObject.id;
                }
            }

            if (!targetID) {
                targetID = this.get('clientID');
                var os = this.get('otherSelves');
                if (os) {
                    if (os.length > 0) {
                        if (!_.contains(os, 'Self_' + targetID)) {
                            //targetID = os[os.length - 1];
                            targetID = os[0];
                        }
                    }
                }
            }
            else {
                $N.save('clientID', targetID);
            }

            function reconnect() {
                socket.emit('connectID', targetID, function(_cid, _key, _selves) {
                    setClientID($N, _cid, _key, _selves);
                    setCookie('clientID', _cid);

                    socket.emit('subscribe', 'User');

                    function doWhenConnected() {
                        if (whenConnected) {
                            whenConnected();
                            whenConnected = null;
                        }
                    }

                    doWhenConnected();

                });
            }

            var socket = this.socket;
            if (!socket) {
                /*this.socket = socket = io.connect('/', {
                 });*/
                this.socket = socket = io.connect('/', {
                    'transports': ['websocket', /*'flashsocket',*/ 'htmlfile', 'xhr-multipart', 'xhr-polling', 'jsonp-polling'],
                    'reconnection': true,
                    'reconnectionDelay': 750,
                    'reconnectionDelayMax': 25,
                    'try multiple transports': true
                });
                socket.on('connect', function() {
                    socket.on('disconnect', function() {
                        $.pnotify({
                            title: 'Disconnected.'
                        });
                    });
                    /*socket.on('reconnecting', function() {
                     $.pnotify({
                     title: 'Reconnecting..'
                     }); 
                     });*/
                    /*
                     socket.on('reconnect', function() {
                     $.pnotify({
                     title: 'Reconnected.'
                     }); 
                     init();
                     });*/

                    /*socket.on('error', function(){
                     socket.socket.reconnect();
                     });*/

                    socket.on('notice', function(n) {
                        $N.notice(n);
                    });

                    socket.on('addTags', function(t, p) {
                        $N.addProperties(p);
                        $N.addTags(t);
                    });

                    $.pnotify({
                        title: 'Connected.'
                    });

                    reconnect();

                });
            }

            return socket;
        },
        loadOntology: function(url, f) {
            var that = this;

            $.getJSON(url, function(schema) {
                that.addProperties(schema['properties']);
                that.addTags(schema['tags']);
                f();
            });

        },
        searchOntology: function(query, ontocache) {
            var terms = this.ontoIndex.pipeline.run(lunr.tokenizer(query));
            var results = {};
            for (var i = 0; i < terms.length; i++) {
                var T = terms[i];
                
                var r = ontocache[T];
                
                if (!r)
                    r = this.ontoIndex.search(T);
                
                ontocache[T] = r;
                
                for (var j = 0; j < r.length; j++) {
                    var R = r[j];
                    var id = R.ref;
                    var score = R.score;
                    if (!results[id])
                        results[id] = score;
                    else
                        results[id] += score;
                }
            }
                        
            results = _.map(_.keys(results), function(r) {
                return [r, results[r]];
            });
            results = results.sort(function(a, b) {
                return b[1] - a[1];
            });
            return results;
        },
        addProperty: function(p) {
            this.properties[p.uri] = p;
        },
        addTag: function(t) {
            var ty = this.tags;
            var p = this.properties;

            var tt = t;
            var xx = t.properties;
            /*if (ty[t.uri]!=undefined) {
             tt = _.extend(ty[t.uri], t);
             }*/
            ty[t.uri] = tt;

            if (xx) {
                var propertyIDs = xx;
                if (!_.isArray(xx)) {
                    //hash-array mode
                    propertyIDs = [];
                    for (var tp in xx) {
                        var c = ty[t.uri].properties[tp];
                        p[tp] = c;
                        propertyIDs.push(tp);
                    }
                }

                t.properties = propertyIDs;
            }

            this.ontoIndex.add({
                id: t.uri,
                name: t.name,
                description: t.description
            });

            if (t.icon)
                defaultIcons[t.uri] = t.icon;
        },
        /*geolocate : function(ex) {
         objSetFirstValue(this.myself(), 'spacepoint', {lat: ex[0], lon: ex[1], planet: 'Earth'} );
         
         var that = this;
         this.pub(this.myself(), function(err) {
         $.pnotify({
         title: 'Unable to share location.',
         text: err,
         type: 'Error'                        
         });              
         
         }, function() {
         $.pnotify({
         title: 'Geolocated.',
         text: that.myself().geolocation
         });              
         that.saveLocal();
         
         });    
         },*/

        addProperties: function(ap) {
            for (var k in ap) {
                this.addProperty(ap[k]);
            }
        },
        addTags: function(at) {

            for (var k in at) {
                this.addTag(at[k]);
            }
            this.trigger('change:tags');

        },
        deleteObject: function(x, localOnly) {
            var id;
            if (typeof x == "string")
                id = x;
            else
                id = x.id;
            var that = this;

            if (x.author == undefined)
                localOnly = true;
            
            if (configuration.connection != 'local') {
                if ((!this.socket) && (!localOnly)) {
                    $.pnotify({
                        title: 'Unable to delete: Not connected, must login.'
                    });
                    return false;
                }
            }
            else
                localOnly = true;

            function removeLocal() {
                if (!$N.getObject(id))
                    return false;
                
                that.get('deleted')[id] = Date.now();
                delete (that.objects())[id];

                //remove from replies
                for (var k in that.get('replies')) {
                    that.get('replies')[k] = _.without(that.get('replies')[k], id);
                }
                //remove its replies
                var replies = that.get('replies')[id];
                if (replies)
                    for (var k = 0; k < replies.length; k++)
                        that.deleteObject(k, true);
                
                return true;
            }

            if (!localOnly) {
                var that = this;
                this.socket.emit('delete', id, function(err) {
                    if (!err) {
                        that.trigger('change:deleted');
                        that.trigger('change:attention');

                        $.pnotify({
                            title: 'Deleted',
                            text: id,
                            addclass: "stack-bottomleft",
                            stack: stack_bottomleft
                        });

                        removeLocal();
                    }
                    else {
                        //console.dir(err);
                        $.pnotify({
                            title: 'Unable to delete: ' + err,
                            text: id
                        });
                    }
                });
            }
            else {
                if (removeLocal()) {
                    if (x.author) {
                        $.pnotify({
                            title: 'Deleted',
                            text: id,
                            addclass: "stack-bottomleft",
                            stack: stack_bottomleft
                        });
                        $N.trigger('change:attention');
                    }
                }
            }
            return true;

        },
        getPlugins: function(withPlugins) {
            var that = this;
            this.socket.emit('getPlugins', function(p) {
                that.unset('plugins');
                that.set('plugins', p);
                if (withPlugins)
                    withPlugins(p);
            });
        },
        setPlugin: function(pid, enabled, callback) {
            this.socket.emit('setPlugin', pid, enabled, callback);
        },
        /*getGoals: function(from, to, mineOnly ) {
         var that = this;
         
         if (from == null) {
         return _.where(_.map(this.objectsWithTag('Goal'), function(id) { return that.getObject(id); } ), { delay: 0 });
         }
         
         return _.filter(_.map(this.objectsWithTag('Goal'), function(id) { return that.getObject(id); } ), function(x) { 
         if (x.delay == 0) return false;
         var w = x.when || 0;
         return ((w >= from) && (w < to));
         } );
         },*/

        getObjects: function(query, onObject, onFinished) {
            var that = this;
            this.socket.emit('getObjects', query, function(objs) {
                for (var k in objs) {
                    var x = objs[k];
                    that.notice(x);
                    if (onObject != null)
                        onObject(x);
                }
                onFinished();
            });
        },
        getReplies: function(id) {
            return  this.get('replies')[id] || [];
        },
        listenAll: function(b) {
            if (b) {
                this.subscribe('*', function(f) {
                    this.notice(f);
                });
            }
            else {
                this.unsubscribe('*');
            }
        },
        setFocus: function(f) {
            //TODO avoid sending duplicate focuses
            /*
             var oldFocus = this.get('focus');
             if (oldFocus)
             if (f.when == oldFocus.when)
             if (f.where == oldFocus.where)
             if (f.author == oldFocus.author) {
             console.log(f.value, oldFocus.value);
             if (_.isEqual(f.value, oldFocus.value))
             return;
             }
             */

            if (!f.id)
                f.id = uuid();
            if (!f.focus)
                f.focus = 'change';
            if (!f.createdAt)
                f.createdAt = Date.now();
            if (!f.author)
                f.author = this.id();

            if (f.when == null)
                delete f.when;
            if (f.where == null)
                delete f.where;
            /*if (f.tags)
             if (f.tags.length == 0)
             delete f.tags;*/

            this.set('focus', f);

            if (this.socket) {
                this.pub(f, function(err) {
                    console.log('setFocus: ', err);
                }, function() {
                    //$.pnotify({title: 'Focus noticed.'});
                });
            }

            $N.trigger('change:focus');

        },
        focus: function() {
            return this.get('focus');
        },
        notice: function(x) {

            if (!Array.isArray(x)) {
                return this.notice([x]);
            }

            var attention = this.attention;
            var replies = this.get('replies');

            var that = this;

            function n(y) {
                if (!y)
                    return;

                var y = objExpand(y);

                if (y.removed) {
                    that.deleteObject(y, true);
                    return;
                }

                if (y.replyTo) {
                    var rt = y.replyTo;
                    if (!Array.isArray(rt)) {
                        rt = [ rt ];
                    }
                    for (var n = 0; n < rt.length; n++) {
                        var rtt = rt[n];
                        
                        var p = replies[rtt];
                        if (p) {
                            if (!_.contains(p, y.id))
                                p.push(y.id);
                        }
                        else {
                            replies[rtt] = [y.id];
                        }
                        
                    }
                }

                if (y.id) {
                    attention[y.id] = y;
                }

                function objTagObjectToTag(x) {
                    var p = {};
                    _.each(objValues(x, 'tagValueType'), function(v) {
                        var vv = v.split(':');
                        p[vv[0]] = {name: vv[0], type: vv[1]};
                    });

                    return {
                        uri: x.name,
                        name: x.name,
                        description: objDescription(x),
                        properties: p
                    };
                }

                if (objHasTag(y, 'Tag')) {
                    that.addTags([objTagObjectToTag(y)]);
                }
                if (objHasTag(y, 'Trust')) { //|| Value || etc..
                    that.userRelations = null; //force recalculation of userRelations
                }
            }


            var includesNonFocused = false;
            for (var i = 0; i < x.length; i++) {
                if (!x[i].focus) {
                    n(x[i]);
                    includesNonFocused = true;
                }
            }
            if (includesNonFocused)
                this.trigger('change:attention');
        },
        subscribe: function(channel, f) {
            if (this.socket) {
                this.socket.emit('subscribe', channel);
                this.socket.on('receive-' + channel, f);
            }
        },
        unsubscribe: function(channel) {
            if (this.socket) {
                this.socket.emit('unsubscribe', channel);
            }
        },
        /*publish: function(obj) {
         if (configuration.connection == 'local') {
         $N.notice(obj);
         }
         else {
         self.pub(obj, function(err) {
         $.pnotify({
         title: 'Unable to save ' + obj.id,
         type: 'Error'
         });
         }, function() {
         $.pnotify({
         title: 'Saved (' + obj.id.substring(0, 6) + ')'
         });
         $N.notice(obj);
         });
         }
         },*/
        pub: function(object, onErr, onSuccess) {
            if (configuration.connection == 'local') {
                $N.notice(object);
                if (onSuccess)
                    onSuccess();
            }
            else {
                if (this.socket) {
                    this.socket.emit('pub', objCompact(object), function(err) {
                        if (onErr)
                            onErr(object);
                        $.pnotify({title: 'Error saving:', text: err, type: 'error'});
                    }, function() {
                        $N.notice(object);
                        if (onSuccess)
                            onSuccess();
                    });
                }
                else {
                    if (onErr)
                        onErr('Not connected.');
                    else
                        console.log('Not connected.');
                }
            }
        },
        //THIS NEEDS UPDATED
        getClientInterests: function(f) {
            this.socket.emit('getClientInterests', f);
        },
        getTagCount: function(onlySelf, predicate) {

            var tagCount = {};
            var aa = this.attention;
            var myID = this.id();

            for (var ai in aa) {
                var oi = aa[ai];

                if (predicate)
                    if (!predicate(oi))
                        continue;

                if (onlySelf)
                    if (oi.author != myID)
                        continue;

                //var t = objTags(oi);
                var ts = objTagStrength(oi);
                for (var i in ts) {
                    if (!tagCount[i])
                        tagCount[i] = 0;
                    tagCount[i] = tagCount[i] + ts[i]; //TODO add the normalized tag strength
                }
            }
            return tagCount;
        },
        getServerAttention: function(withResults) {
            $.getJSON('/attention', function(attention) {
                withResults(attention);
            });
        },
        save: function(key, value) {
            $N.set(key, value);
            localStorage[key] = JSON.stringify(value);
        },
        loadAll: function() {
            var loadedSelf = localStorage['self'] || "{ }";
            var loadedAttention = localStorage['obj'] || "{ }";
            if (loadedSelf) {
                _.extend($N.attributes, JSON.parse(loadedSelf));
                $N.attention = JSON.parse(loadedAttention);
            }
            else {
            }

        },
        saveAll: function() {
            if (configuration.connection == 'local') {
                localStorage.self = JSON.stringify($N.attributes);
                localStorage.obj = JSON.stringify($N.attention);
            }
        },
        //TODO rename to 'load initial objects' or something
        getLatestObjects: function(num, onFinished) {
            //$.getJSON('/object/tag/User/json', function(users) {
            if (configuration.connection == 'local') {
                $N.loadAll();
                onFinished();
                return;
            }

            $.getJSON('/object/latest/' + num + '/json', function(objs) {
                $N.notice(objs);
                onFinished();
            });
        },
        getUserObjects: function(onFinished) {
            //$.getJSON('/object/tag/User/json', function(users) {
            if (configuration.connection == 'local') {
                $N.loadAll();
                onFinished();
                return;
            }

            $.getJSON('/object/tag/User/json', function(objs) {
                $N.notice(objs);
                onFinished();
            });
        },
        getAuthorObjects: function(userID, onFinished) {
            if (configuration.connection == 'local') {
                onFinished();
                return;
            }
            $.getJSON('/object/author/' + userID + '/json', function(j) {
                $N.notice(j);
                onFinished();
            });
        },
        startURLRouter: function() {
            Backbone.history.start();            
        }
        

    });

    //exports = the variable from util.js which is also used by node.js require()        		
    var $N = _.extend(new $NClient(), exports);

    $N.clear();

    var cid = getCookie('clientID');
    var keys = getCookie('keys');
    var otherSelves = decodeURIComponent(getCookie('otherSelves')).split(',');
    setClientID($N, cid, keys, otherSelves);

    if (configuration.connection == 'websocket') {
        $N.connect(null, function() {
            f("/ontology/json", $N);
        });
    }
    else {
        window.addEventListener("beforeunload", function(e) {
            $N.saveAll();
            /*var confirmationMessage = "Saved everything";
             
             (e || window.event).returnValue = confirmationMessage;     //Gecko + IE
             return confirmationMessage;                                //Webkit, Safari, Chrome etc.
             */
        });

        f("ontology.static.json", $N);
    }


}


//apparently is faster than $('<div/>');
function newDiv(id) {
    var e = newEle('div');
    if (id)
        e.attr('id', id);
    return e;
}

function newEle(e) {
    return $(document.createElement(e));
}

function newPopup(title, p, isModal) {

    var d = newDiv();
    d.attr('title', title);

    $('body').append(d);
    if (p === true) {
        var clientHeight = $(document).height();
        var clientWidth = $(document).width();
        var margin = 24;
        var leftMargin = 64;
        p = {
            width: clientWidth - leftMargin - margin,
            height: clientHeight - margin * 2,
            position: [leftMargin, margin]
        };
    }

    p = _.extend(p || {}, {
        close: function() {
            d.remove();
        },
        show: 'fade',
        hide: 'fade' //'drop'
    });
    if (isModal)
        p.modal = true;

    d.dialog(p);
    return d;
}

function isAnonymous() {
    return (getCookie('authenticated') === 'anonymous');
}

function getCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ')
            c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0)
            return c.substring(nameEQ.length, c.length);
    }
    return null;
}
function setCookie(key, value) {
    document.cookie = key + '=' + value;
}



/**
 * Converts an HSL color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes h, s, and l are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   Number  h       The hue
 * @param   Number  s       The saturation
 * @param   Number  l       The lightness
 * @return  Array           The RGB representation
 */
function hslToRgb(h, s, l) {
    var r, g, b;

    if (s == 0) {
        r = g = b = l; // achromatic
    } else {
        function hue2rgb(p, q, t) {
            if (t < 0)
                t += 1;
            if (t > 1)
                t -= 1;
            if (t < 1 / 6)
                return p + (q - p) * 6 * t;
            if (t < 1 / 2)
                return q;
            if (t < 2 / 3)
                return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        }

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }

    return [r * 255, g * 255, b * 255];
}
