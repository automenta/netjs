var webrtc;

var channelsOpen = { };

function newChannelPopup(channel) {

	if (channelsOpen[channel]) {
		var w = channelsOpen[channel];
		w.dialog('close');
		delete channelsOpen[channel];
		return;
	}

	var o = $N.instance[channel];
	if (!o) return;

    var s = newPopupObjectView(o, {title: channel, width: '50%'}, {
        showMetadataLine: false,
        showName: false,
        showActionPopupButton: false,
        showSelectionCheck: false,
        transparent: true
    });
    /*if (configuration.webrtc) {
        s.append(newWebRTCRoster());
    }*/

	channelsOpen[channel] = s;

    s.bind('dialogclose', function() {
		delete channelsOpen[channel];
	});

    return s;
}

function newChatWidget(onSend, options) {
    var c = newDiv();

    options = options || {
        localEcho: true
    };

    var history = [];
    var log = newDiv().addClass('ChatLog').appendTo(c);

    var input = newDiv().addClass('ChatInput').appendTo(c);

    var textInput = $('<input type="text"/>').appendTo(input);
    textInput.keydown(function(e) {
       if (e.keyCode === 13) {
           var m = $(this).val();
           onSend(m);
           if (options.localEcho)
              c.receive({a: $N.id(), m: m}); //local echo
           $(this).val('');
       }
    });

    function chatlineclick() {
        var line = $(this).parent();
        var n = new $N.nobject();
        n.setName(line.find('span').html());

        newPopupObjectEdit(n);
    }

    var scrollbottom = function() {
        log.scrollTop(log.prop('scrollHeight'));
    };

    function newChatLine(l) {
        var d = newDiv();

        if (l.a) {
            var A = $N.instance[l.a];
            if (A) {
                d.append(newEle('a').html(newAvatarImage(A)).click(chatlineclick));
            }
            else {
                d.append(newEle('a').html(l.a + ': '));
            }
        }

        d.append(newEle('span').html(l.m));

        //TODO scroll to bottom

        return d;
    }

    function updateLog() {
        log.empty();
        for (var i = 0; i < history.length; i++) {
            var h = history[i];
            log.append(newChatLine(h));
        }
        scrollbottom();
    }
    updateLog();

    function appendLog(m) {
        history.push(m);
        log.append(newChatLine(m));
        scrollbottom();
    }

    c.receive = function(m) {
       appendLog(m);

       if (m.a !== $N.id()) {
           var aname = $N.label(m.a);
           notify({title: aname, text: m.m });
       }
    };
    c.disable = function() {
        textInput.val('Disconnected');
        textInput.attr('disabled', 'disabled');
    };

    return c;
}

function initWebRTC(w) {
    if (webrtc) {
        webrtc.destroy();
    }

    webrtc = new Peer({host: window.location.hostname, port: window.location.port, path: '/peer'});
    webrtc.connects = {};

    // stun.stunprotocol.org (UDP and TCP ports 3478).
    /* https://gist.github.com/yetithefoot/7592580
     *  {url:'stun:stun01.sipphone.com'},
        {url:'stun:stun.ekiga.net'},
        {url:'stun:stun.fwdnet.net'},
        {url:'stun:stun.ideasip.com'},
        {url:'stun:stun.iptel.org'},
        {url:'stun:stun.rixtelecom.se'},
        {url:'stun:stun.schlund.de'},
        {url:'stun:stun.l.google.com:19302'},
        {url:'stun:stun1.l.google.com:19302'},
        {url:'stun:stun2.l.google.com:19302'},
        {url:'stun:stun3.l.google.com:19302'},
        {url:'stun:stun4.l.google.com:19302'},
        {url:'stun:stunserver.org'},
        {url:'stun:stun.softjoys.com'},
        {url:'stun:stun.voiparound.com'},
        {url:'stun:stun.voipbuster.com'},
        {url:'stun:stun.voipstunt.com'},
        {url:'stun:stun.voxgratia.org'},
        {url:'stun:stun.xten.com'},
     *
     */
	var currentID;
    webrtc.on('open', function(id) {
        $N.setWebRTC(id, true);
        currentID = id;
    });


    webrtc.on('connection', function(conn) {
        //TODO get remote peer's user's name
        var remotePeer = conn.peer;
        var remoteUser = getWebRTCUser(remotePeer);
        var remoteUserName = $N.label(remoteUser, remotePeer);

        notify({title: 'Connecting', text: remoteUserName });
        var callWidget = newWebRTCCall(remotePeer, conn);
        webrtc.connects[remotePeer] = callWidget;

    });
    webrtc.on('call', function(call) {
        if (webrtc.connects[call.peer]) {
            webrtc.connects[call.peer].onCallIncoming(call);
        }
    });


    webrtc.on('error', function(e) {
        console.error('WebRTC', e);
    });
    webrtc.on('close', function() {
        $N.setWebRTC(currentID, false);
        //console.log('WebRTC off')
    });

}

function newWebRTCRoster() {
    if (!webrtc) return;

    var r = newDiv().addClass('WebRTCRoster');
    var peers = newRosterWidget(true).appendTo(r);

    return r;
}

//find which user in the roster has this id and get the right name
function getWebRTCUser(w) {
    var r = $N.get('roster');

    for (var k in r) {
        var v = r[k];
        if (Array.isArray(v)) {
            if (v.indexOf(w) != -1) return k;
        }
    }

    return w;
}

function newWebRTCCall(webrtcid, incoming) {
    var targetUser = getWebRTCUser(webrtcid);

    var currentCall, currentStream, currentData;

    function hangup() {
        if (currentData) {
            if (webrtc.connects[webrtcid] === p)
                webrtc.connects[webrtcid] = null;

            chat.disable();
            if (currentStream)
                currentStream.stop();
            if (currentCall)
                currentCall.close();

            if (currentData)
                currentData.close();

            callButton.hide();
            currentCall = null;
            currentData = null;
            currentStream = null;
        }
    }

    var p = newPopup('Call: ' + $N.label(targetUser, webrtcid));
    p.bind('dialogclose', hangup);

    var chat = newChatWidget(function(m) {
        if (currentData) {
            currentData.send(m);
        }
    });
    chat.appendTo(p).hide();

    var callButton = newEle('button').html('Start Video').appendTo(p);
    var answerButton = newEle('button').html('Answer Call').appendTo(p).hide();
    var myVideo = newEle('video').css('width', '48%').appendTo(p).hide();
    var theirVideo = newEle('video').css('width', '48%').appendTo(p).hide();
    var muteVideoButton = newEle('button').html('Mute Video').appendTo(p).hide();
    var stopVideoButton = newEle('button').html('Stop Video').appendTo(p).hide();

    function disableVideo() {
        myVideo.remove();
        theirVideo.remove();
        callButton.hide();
        answerButton.hide();
        muteVideoButton.hide();
        stopVideoButton.hide();
        p.append('Video not available');
    }

    function endPreviousCall() {
        if (currentCall) {
            currentCall.close();
            currentCall = null;
        }
        if (currentStream) {
            currentStream.stop();
            currentStream = null;
        }
    }

    function newCall(call, stream) {
        endPreviousCall();
        currentCall = call;
        currentStream = stream;
    }

    function playRemoteVideo(stream) {
        myVideo.show();
        theirVideo.show();
        theirVideo.attr('src', URL.createObjectURL(stream));
        theirVideo[0].play();
        callButton.hide();
        answerButton.hide();

        muteVideoButton.off().click(function() {
            if (currentStream) {
                if (currentStream.getVideoTracks().length > 0)
                    currentStream.getVideoTracks()[0].enabled =
                        !(currentStream.getVideoTracks()[0].enabled);
                if (currentStream.getAudioTracks().length > 0)
                    currentStream.getAudioTracks()[0].enabled =
                        !(currentStream.getAudioTracks()[0].enabled);
            }
        }).show();

        function endcall() {
            endPreviousCall();
            theirVideo.hide();
            myVideo.hide();
            stopVideoButton.hide();
            muteVideoButton.hide();
            callButton.html('Start Video').attr('disabled', null);
            callButton.show();
        }

        stopVideoButton.off().click(endcall).show();

        if (currentCall)
            currentCall.on('close', endcall);
    }

    function onDataIncoming(m) {
        chat.receive({a: targetUser, m: m});
    }

    if (incoming) {
        currentData = incoming;
    }
    else {
        currentData = webrtc.connect(webrtcid);
    }

    currentData.on('open', function() {
        chat.show();
        webrtc.connects[webrtcid] = p;
        currentData.on('data', onDataIncoming);
    });
    currentData.on('close', hangup);
    currentData.on('error', hangup);


    callButton.off().click(function() {
        callButton.html('Waiting for answer..');
        callButton.attr('disabled', 'disabled');
        answerButton.hide();
        webRTCVideo(webrtcid, myVideo, function(stream, call) {
            if (stream) {
                newCall(call, stream);
                call.on('stream', playRemoteVideo);
            }
            else
                disableVideo();
        });
    });



    p.onCallIncoming = function(call) {
        callButton.hide();
        answerButton.show().off().click(function() {
            webRTCVideo(null, myVideo, function(stream) {
                callButton.hide();
                newCall(call, stream);
                if (stream) {
                    call.answer(stream);
                    call.on('stream', playRemoteVideo);
                }
                else
                    disableVideo();
            });
        });
    };
    p.onClose = hangup;

    return p;

}

function webRTCVideo(callPeer, target, callback) {
    navigator.getUserMedia = (navigator.getUserMedia ||
                           navigator.webkitGetUserMedia ||
                           navigator.mozGetUserMedia ||
                           navigator.msGetUserMedia);

    if (navigator.getUserMedia) {
        navigator.getUserMedia(

            // constraints
            { video: true, audio: true },

            // successCallback
            function(localMediaStream) {
               target.attr('src', window.URL.createObjectURL(localMediaStream));
               target[0].play();

               var call = null;
               if (callPeer) {
                   call = webrtc.call(callPeer, localMediaStream);
               }

               if (callback)
                   callback(localMediaStream, call);
            },

            // errorCallback
            function(err) {
               if (callback)
                   callback(null);
            }
        );
    } else {
        console.log('getUserMedia not supported');
        callback(null);
    }

}

//http://simplewebrtc.com/
//https://github.com/HenrikJoreteg/getScreenMedia
//https://github.com/peers/peerjs/blob/master/examples/videochat/index.html
//http://www.html5rocks.com/en/tutorials/webrtc/datachannels/ file transfers
/*
 * <html>
<head>
  <title>PeerJS - Video chat example</title>
  <link rel="stylesheet" href="style.css">
  <script type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/jquery/1.8/jquery.min.js"></script>
  <script type="text/javascript" src="/dist/peer.js"></script>
  <script>

    // Compatibility shim
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

    // PeerJS object
    var peer = new Peer({ key: 'lwjd5qra8257b9', debug: 3});

    peer.on('open', function(){
      $('#my-id').text(peer.id);
    });

    // Receiving a call
    peer.on('call', function(call){
      // Answer the call automatically (instead of prompting user) for demo purposes
      call.answer(window.localStream);
      step3(call);
    });
    peer.on('error', function(err){
      alert(err.message);
      // Return to step 2 if error occurs
      step2();
    });

    // Click handlers setup
    $(function(){
      $('#make-call').click(function(){
        // Initiate a call!
        var call = peer.call($('#callto-id').val(), window.localStream);

        step3(call);
      });

      $('#end-call').click(function(){
        window.existingCall.close();
        step2();
      });

      // Retry if getUserMedia fails
      $('#step1-retry').click(function(){
        $('#step1-error').hide();
        step1();
      });

      // Get things started
      step1();
    });

    function step1 () {
      // Get audio/video stream
      navigator.getUserMedia({audio: true, video: true}, function(stream){
        // Set your video displays
        $('#my-video').prop('src', URL.createObjectURL(stream));

        window.localStream = stream;
        step2();
      }, function(){ $('#step1-error').show(); });
    }

    function step2 () {
      $('#step1, #step3').hide();
      $('#step2').show();
    }

    function step3 (call) {
      // Hang up on an existing call if present
      if (window.existingCall) {
        window.existingCall.close();
      }

      // Wait for stream on the call, then set peer video display
      call.on('stream', function(stream){
        $('#their-video').prop('src', URL.createObjectURL(stream));
      });

      // UI stuff
      window.existingCall = call;
      $('#their-id').text(call.peer);
      call.on('close', step2);
      $('#step1, #step2').hide();
      $('#step3').show();
    }

  </script>


</head>

<body>

  <div class="pure-g">

      <!-- Video area -->
      <div class="pure-u-2-3" id="video-container">
        <video id="their-video" autoplay></video>
        <video id="my-video" muted="true" autoplay></video>
      </div>

      <!-- Steps -->
      <div class="pure-u-1-3">
        <h2>PeerJS Video Chat</h2>

        <!-- Get local audio/video stream -->
        <div id="step1">
          <p>Please click `allow` on the top of the screen so we can access your webcam and microphone for calls.</p>
          <div id="step1-error">
            <p>Failed to access the webcam and microphone. Make sure to run this demo on an http server and click allow when asked for permission by the browser.</p>
            <a href="#" class="pure-button pure-button-error" id="step1-retry">Try again</a>
          </div>
        </div>

        <!-- Make calls to others -->
        <div id="step2">
          <p>Your id: <span id="my-id">...</span></p>
          <p>Share this id with others so they can call you.</p>
          <h3>Make a call</h3>
          <div class="pure-form">
            <input type="text" placeholder="Call user id..." id="callto-id">
            <a href="#" class="pure-button pure-button-success" id="make-call">Call</a>
          </div>
        </div>

        <!-- Call in progress -->
        <div id="step3">
          <p>Currently in call with <span id="their-id">...</span></p>
          <p><a href="#" class="pure-button pure-button-error" id="end-call">End call</a></p>
        </div>
      </div>
  </div>


</body>
</html>
 */
