(function ($s, $slate, $) {
    $slate.fn._signalr = function () {
        var _self = this, proxy, _subscribers = []
            , options, onSubscribersChanged = [], _collabDiv, _parentDimen, _userName
            , _userProfileImage, _userIP, _chatBubbles = [], _invoker, pc;

        _self.subscribers = _subscribers;

        _self.init = function (_options) {
            var options = {
                key: ''
                , un: ''
                , up: ''
                , ip: ''
                , throttle: 250
                , url: ''
            };

            $s.extend(options, _options);

            _userName = options.un;
            _userProfileImage = options.up;
            _userIP = options.ip;
            pc = _self._.options.collaboration;
            if (!$s.localRecipients) $s.localRecipients = [];

            if (!pc.localizedOnly) {
                connection = $.hubConnection(options.url);
                proxy = connection.createProxy(_self._.options.id);
            }

            wire();

            if (_self._.options.collaboration.callbacks.onCollaborationWired) {
                pc.callbacks.onCollaborationWired.apply(this, [_invoker, function () {
                    start(options);
                } ]);
            } else {
                start(options);
            }
        };

        function start(options) {
            var copt = {};
            if (pc.useLongPolling) {
                copt = { transport: 'longPolling' }
            }
            if (pc.useJsonp) {
                copt = { jsonp: true };
            }

            var pkg = { type: "onRollCall", data: { name: options.un, profileImage: options.up, ip: options.ip} };
            if (pc.localizedOnly) {
                $s.localRecipients.push(_self);
                send(pkg);
            } else {
                connection.start(copt).done(function () {
                    $s.localRecipients.push(_self);
                    send(pkg);
                });
            }
        };

        _self.invoke = function (pkg) {
            _invoker[pkg.type](pkg);
        };

        function fireBroadcast(pkg) {
            if (proxy && pkg.id !== proxy.connection.id) {
                _invoker[pkg.type](pkg);
            } else if ($s.localRecipients.length > 1) {
                var _time = 0;
                for (var s in $s.localRecipients) {
                    _time += 100;
                    (function (rec, t) {
                        setTimeout(function () { rec["_"]["signalr"]["invoke"](pkg); }, t);
                    })($s.localRecipients[s], _time);
                }
                //_.invoke($s.localRecipients, '_.signalr.invoke', pkg);
            }
        };

        function wire() {

            if (!pc.localizedOnly) {
                proxy.on("broadcast", function (pkg) {
                    fireBroadcast(pkg);
                });
            }

            _invoker = {

                onRollCall: function (pkg) {
                    updateSubscribers(pkg);
                    var pkg = { type: "onRollCallResponse", data: { name: _userName, profileImage: _userProfileImage, ip: _userIP} };
                    send(pkg);
                    refreshCollaboratorList();
                    notify(_subscribers);
                },

                onRollCallResponse: function (pkg) {
                    updateSubscribers(pkg);
                    refreshCollaboratorList();

                    //notify listening modules that a response was given
                    notify(_subscribers);
                },

                onChat: function (pkg) {
                    chat(pkg);
                },

                onZoom: function (pkg) {
                    var zoomPercent = (_self._.options.viewPort.originalWidth / pkg.data.zoomLevel) * 100;
                    _self._.canvas.zoom({
                        dur: pkg.data.duration || 500
                        , zoomPercent: zoomPercent
                        , callbacks: {
                            during: function (percentComplete, easing) {
                                //additional calcs
                            }
                            , after: function (zoomVal) {
                                //additional
                                chat(pkg, 'That was me\n zooming the canvas!');
                            }
                        }
                    });
                },

                onNodePositioned: function (pkg) {
                    var cn = _self._.nodes.one(pkg.data.id);
                    cn.position(pkg.data.location, function () { }, pkg.data.easing, pkg.data.duration || 500);
                    chat(pkg, 'That was me\n positioning the node!');
                },

                onNodeLinkRemoved: function (pkg) {
                    cn = _self._.nodes.one(pkg.data.id);
                    cn.links && cn.links.unset();
                    chat(pkg, 'That was me\n removing the link!');
                },

                onNodeLinkAdded: function (pkg) {
                    cn = _self._.nodes.one(pkg.data.id);
                    cn.links && cn.links.set(pkg.data.linkType, pkg.data.linkData);
                    chat(pkg, 'That was me\n adding the resource link!');
                },

                onNodeUnlocked: function (pkg) {
                    cn = _self._.nodes.one(pkg.data.id);
                    cn.options.allowDrag = true;
                    _self._.birdseye && _self._.birdseye.nodeChanged(pkg);
                    chat(pkg, 'That was me\n unlocking the node!');
                },

                onNodeLocked: function (pkg) {
                    cn = _self._.nodes.one(pkg.data.id);
                    cn.options.allowDrag = false;
                    _self._.birdseye && _self._.birdseye.nodeChanged(pkg);
                    chat(pkg, 'That was me\n locking the node!');
                },

                onNodeToBack: function (pkg) {
                    cn = _self._.nodes.one(pkg.data.id);
                    cn.vect.toBack();
                    _self._.birdseye && _self._.birdseye.nodeChanged(pkg);
                    chat(pkg, 'That was me\n send to back!');
                },

                onNodeToFront: function (pkg) {
                    cn = _self._.nodes.one(pkg.data.id);
                    cn.vect.toFront();
                    _self._.birdseye && _self._.birdseye.nodeChanged(pkg);
                    chat(pkg, 'That was me\n bringing to front!');
                },

                onNodeShapeChanged: function (pkg) {
                    cn = _self._.nodes.one(pkg.data.id);
                    cn.shapes.set(pkg.data);
                    _self._.birdseye && _self._.birdseye.nodeChanged(pkg);
                    chat(pkg, 'That was me\n changing the shape!');
                },

                onNodeAdded: function (pkg) {
                    var blnPreserve = (pkg.preserve !== undefined) ? pkg.preserve : true;
                    _self._.loadJSON(pkg.data, blnPreserve);
                    _self._.birdseye && _self._.birdseye.refresh();
                    chat(pkg, 'That was me\n adding the node!');
                },

                onNodeImageChanged: function (pkg) {
                    cn = _self._.nodes.one(pkg.data.id);
                    cn.images.set(pkg.data.img, pkg.data.w, pkg.data.w);
                    _self._.birdseye && _self._.birdseye.nodeChanged(pkg);
                    chat(pkg, 'That was me\n changing the image!');
                },

                onNodeAttached: function (pkg) {
                    cn = _self._.nodes.one(pkg.data.id);
                    cn.relationships.attach();
                    _self._.birdseye && _self._.birdseye.nodeChanged(pkg);
                    chat(pkg, 'That was me\n re-attaching the node!');
                },

                onNodeDetatched: function (pkg) {
                    var cn = _self._.nodes.one(pkg.data.id);
                    cn.relationships.detatch();
                    _self._.birdseye && _self._.birdseye.nodeDetatched(pkg);
                    chat(pkg, 'That was me\n detatching the node!');
                },

                onNodeDeleted: function (pkg) {
                    cn = _self._.nodes.one(pkg.data.id);
                    cn.del()
                    _self._.birdseye && _self._.birdseye.nodeDeleted(pkg);
                    chat(pkg, 'That was me\n deleting the node!');
                },

                onNodeResized: function (pkg) {
                    cn = _self._.nodes.one(pkg.data.id);
                    cn.resize.set(pkg.data.width, pkg.data.height, 500);
                    _self._.birdseye && _self._.birdseye.nodeChanged(pkg);
                    chat(pkg, 'That was me\n changing the size!');
                },

                onNodeColorChanged: function (pkg) {
                    cn = _self._.nodes.one(pkg.data.id);
                    cn.colorpicker.set(pkg.data);
                    _self._.birdseye && _self._.birdseye.nodeChanged(pkg);
                    chat(pkg, 'That was me\n changing the color!');
                },

                onNodeTextChanged: function (pkg) {
                    cn = _self._.nodes.one(pkg.data.id);
                    cn.editor.set(pkg.data.text, pkg.data.fontSize, pkg.data.fontColor);
                    _self._.birdseye && _self._.birdseye.nodeChanged(pkg);
                    chat(pkg, 'That was me\n changing the text!');
                },

                addRelationship: function (pkg) {
                    _self._.nodes.addRelationship(pkg.data);
                    _self._.birdseye && _self._.birdseye.relationshipsChanged(pkg);
                    chat(pkg, 'That was me\n adding the relationship!');
                },

                removeRelationship: function (pkg) {
                    _self._.nodes.removeRelationship(pkg.data);
                    _self._.birdseye && _self._.birdseye.relationshipsChanged(pkg);
                    chat(pkg, 'That was me\n removing the relationship!');
                },

                onNodeMove: function (pkg) {
                    cn = _self._.nodes.one(pkg.data.id);
                    cn.move(pkg);
                    chat(pkg, 'That was me\n moving the node!');
                },

                onCanvasMove: function (pkg) {
                    var opts = {
                        x: pkg.data.left
                        , y: pkg.data.top
                        , dur: pkg.data.duration || 500
                        , callback: {
                            after: function () {
                                _self._.birdseye && _self._.birdseye.refresh(true);
                            }
                        }
                        , isAbsolute: true
                    };
                    _self._.canvas.move(opts);
                    chat(pkg, 'That was me\n moving the canvas!');
                }
            };
        }

        _self.send = function (pkg) {
            send(pkg);
        };

        _self.hide = function () {
            _collabDiv.style.display = 'none';
        };

        _self.show = function () {
            if (_self._.options.collaboration.showPanel) {
                _collabDiv.style.display = 'block';
            }
        };

        _self.disconnect = function (cb) {
            cb.apply(this);
        };

        _self.attach = function (onChange) {
            var _id = $s.guid();
            var _eve = { id: _id, eve: onChange };
            onSubscribersChanged.push(_eve);
            return _id;
        }

        _self.detatch = function (id) {
            onSubscribersChanged = _.filter(onSubscribersChanged, function (s) { return s.id !== id; });
        };

        $s.addEvent(window, "resize", function (e) {
            if (_collabDiv) {
                _parentDimen = $s.windowSize();
                setCollab();
            }
        });

        function notify(subs) {
            $s.each(onSubscribersChanged, function () {
                this.eve.apply(_self, [subs]);
            });
        };

        function getIndex(pkg) {
            //localhost counter helps only for debugging purposes on one box...
            var _localhost = 0;
            for (i = 0; i < _subscribers.length; i++) {
                if (_subscribers[i].ip === '127.0.0.1') _localhost++;
                if (_subscribers[i].ip === pkg.ip && pkg.ip !== "" && _localhost < 2) {
                    return i;
                }
            }
            return -1;
        };

        function chat(pkg, msg) {
            var ix = getIndex(pkg);
            if (ix > -1) {
                var _id = _subscribers[ix].id;

                if (msg) pkg.msg = msg;

                if ($s.isFunction(pc.callbacks.onCollaboration))
                    pc.callbacks.onCollaboration.apply(this, [_subscribers[ix].name, msg, pkg]);

                var cbi = -1;
                $s.each(_chatBubbles, function () {
                    cbi++;
                    if (this.id === _id) {
                        _chatBubbles[cbi].showing = true;
                        _chatBubbles[cbi].messages.push(pkg.msg);
                        setChatBubble(_chatBubbles[cbi]);
                        return;
                    }
                });
            }
        };

        function updateSubscribers(pkg) {
            var inx = getIndex(pkg);
            if (inx === -1) {
                _subscribers.push(pkg.data);
            } else {
                $s.extend(_subscribers[inx], { ip: pkg.data.ip, name: pkg.data.name, profileImage: pkg.data.profileImage });
            }
        };

        function refreshCollaboratorList() {
            if (_self._.options.collaboration.showPanel) {
                if (_subscribers.length <= 0) {
                    if (_collabDiv) document.body.removeChild(_collabDiv);
                    _collabDiv = null;
                    return;
                }

                _parentDimen = $s.windowSize();

                if (!_collabDiv) {
                    _collabDiv = document.createElement('div');
                    _collabDiv.setAttribute("id", "slateCollaborators_" + _self._.options.id);
                    _collabDiv.style.position = "absolute";

                    _collabDiv.style.height = "222px";
                    _collabDiv.style.width = "180px";
                    _collabDiv.style.border = "1px solid #333";
                    _collabDiv.style.backgroundColor = "#fff";
                    _collabDiv.style.display = "block";

                    if (_self._.options.collaboration.panelContainer) {
                        var ele = $s.ensureEle(_self._.options.collaboration.panelContainer);
                        ele.appendChild(_collabDiv);
                    } else {
                        document.body.appendChild(_collabDiv);
                    }

                    setCollab();
                } else {
                    _collabDiv.innerHTML = "";
                }

                _chatBubbles = [];
                $s.each($s.select("div.chatBubble"), function () {
                    document.body.removeChild(this);
                });

                var _all = '';
                var _tmp = "<div id='chatBubble_{id}' style='border-bottom:1px solid #000;clear:both;height:80px;padding:3px;background-color:{color}'><div style='float:left;' class='slate_collaborator' rel='{id}'><img src='{image}' style='width:80px;'/></div><div style='float:right;'>{name}</div></div>";
                var _cur = 0, _max = 2, _waiting = 0, _waitingList = '';
                $s.each(_subscribers, function () {
                    _cur++;
                    if (_cur <= _max) {
                        var src = this.profileImage || _self._.options.imageFolder + "user.png";
                        var _clr = "#fff";
                        if (this.ip === _userIP) {
                            _clr = "#ffff99";
                            if (this.name.indexOf("YOU") == -1)
                                this.name = this.name + "<br/>(YOU)";
                        }
                        _all += _tmp.replace(/{id}/gi, this.id).replace(/{name}/gi, this.name).replace(/{image}/gi, src).replace(/{color}/g, _clr);

                        _chatBubbles.push({ id: this.id, owner: 'chatBubble_' + this.id, bubble: createBubble(), showing: false, messages: [], clr: _clr });
                    } else {
                        _waitingList += this.name + " ";
                        _waiting++;
                    }
                });

                _all += "<div style='clear:both;'>" + _waiting + " user(s) waiting</div>";
                _all += "<div style='clear:both;'>" +
                            "<input type='text' id='txtChat_" + _self._.options.id + "' maxlength='26' style='height:17px;color:#333;width:174px;font-size:10pt;' value='type to chat and hit enter'/>" +
                        "</div>";
                _collabDiv.innerHTML = _all;

                setTimeout(function () {
                    var _chatText = $s.el("txtChat_" + _self._.options.id);
                    _chatText.onblur = function (e) {
                        if (_chatText.value === "") {
                            _chatText.value = "type to chat and hit enter";
                            _chatText.style.color = "#333";
                        } else {
                            _chatText.style.color = "#000";
                        }
                    };

                    _chatText.onfocus = function (e) {
                        if (_chatText.value === "type to chat and hit enter") {
                            _chatText.value = "";
                            _chatText.style.color = "#000";
                        }
                    };

                    _chatText.onkeypress = function (e) {
                        var txt = _chatText.value;
                        if ($s.getKey(e) === 13 && txt !== "") {
                            e.preventDefault();
                            var pkg = { type: "onChat", msg: txt };
                            _chatText.value = "";
                            send(pkg); //sent to collaborators
                            chat(pkg); //displays locally for the user to see..
                        }
                    };
                }, 100);
            }
        };

        function send(pkg) {
            if (_self._.options.collaboration.allow) {

                _self._.setChanged(true);
                if ($s.isFunction(_self._.options.onSlateChanged)) {
                    _self._.options.onSlateChanged.apply(this, [_subscribers.length]);
                }

                pkg.ip = _userIP;
                pkg.slateId = _self._.options.id;

                if (pc.localizedOnly) {
                    fireBroadcast(pkg);
                } else {
                    pkg.id = proxy.connection.id;
                    proxy.invoke("broadcast", pkg);
                }
            }
        };

        function setCollab() {
            if (_self._.options.collaboration.panelContainer) {
                var ele = $s.ensureEle(_self._.options.collaboration.panelContainer);
                var dimen = $s.getDimensions(ele);
                switch (_self._.options.collaboration.panelLocation) {
                    case "upperright":
                        _collabDiv.style.left = (dimen.width - 185) + "px";
                        _collabDiv.style.top = "0px";
                        break;
                    default:
                        _collabDiv.style.left = (dimen.width - 185) + "px";
                        _collabDiv.style.top = (dimen.height - 227) + "px";
                        break;
                }
            } else {
                _collabDiv.style.left = (_parentDimen.width - 185) + "px";
                _collabDiv.style.top = (_parentDimen.height - 227) + "px";
            }
        };

        function createBubble() {
            var _chatBubble = document.createElement('div');
            _chatBubble.setAttribute("class", "chatBubble");
            _chatBubble.style.position = "absolute";
            _chatBubble.style.display = "none";
            document.body.appendChild(_chatBubble);
            return _chatBubble;
        };

        function setChatBubble(bub) {
            if (bub.showing) {
                var off = $s.positionedOffset($s.el(bub.owner));

                bub.bubble.style.left = off.left - 150 + "px";
                bub.bubble.style.top = off.top - 40 + "px";
                bub.bubble.style.display = "block";
                if (!bub.r)
                    bub.r = new Raphael(bub.bubble, 180, 130);

                //bub.rsb && bub.rsb.remove();
                var clr = bub.clr || "#fff";
                bub.rsb = bubble(bub.r, 70, 30, bub.messages[bub.messages.length - 1], clr);

                if (bub.chatWire !== null)
                    window.clearTimeout(bub.chatWire);

                bub.chatWire = window.setTimeout(function () {
                    bub.bubble.style.display = "none";
                    bub.showing = false;
                    bub.rsb && bub.rsb.remove();
                    window.clearTimeout(bub.chatWire);
                    bub.chatWire = null;
                }, 5000);
            }
        };

        function setChatBubbles() {
            $s.each(_chatBubbles, function () {
                setChatBubble(this);
            });
        };

        function bubble(r, x, y, txt, clr) {
            var _sb = r.speechbubble(x, y, txt);
            if (clr !== undefined) {
                _sb[0].attr({ fill: clr });
            }
            return _sb;
        };

        return _self;
    }
})(Slatebox, Slatebox.fn.slate, jQuery);