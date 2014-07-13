//CODE ORIGINALLY FROM "MEATSPACES": http://meatspac.es
//https://github.com/meatspaces/meatspace-chat/blob/master/public/javascripts/main.js
//https://github.com/meatspaces/meatspace-chat/blob/master/public/javascripts/base/videoShooter.js

/*
 Copyright (c) 2012, 2013, 2014 See https://github.com/meatspaces/meatspace-chat/graphs/contributors
 All rights reserved.
 */

function newWebcamWindow(onFinished) {
    var x = newPopup('Webcam', {
        modal: true
    });
    x.dialog({
        beforeClose: function(event, ui) {
            webcamStop();
        }
    });

    var recordButton = $('<button>Record</button>').appendTo(x);
    recordButton.click(function() {
        webcamRecord(5, 0.3, function(path) {
            x.dialog('close');
            onFinished(path);
        });
    });
    recordButton.hide();

    var statusArea = $('<div id="WebcamStatus"></div>').appendTo(x);

    var previewArea = $('<div/>').appendTo(x);

    webcamStart(previewArea, 135, 101, function() {
        recordButton.show();
    });
}

function webcamAvailable() {
    return (navigator.getMedia);
}

var videoShooter;
function webcamStart(previewTarget, gifWidth, gifHeight, ready) {

    navigator.getMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

    if (navigator.getMedia) {

        var startStreaming = function() {
            GumHelper.startVideoStreaming(function(err, stream, videoElement, videoWidth, videoHeight) {
                /*if (err) {
                 disableVideoMode();
                 return;
                 }*/

                var cropDimens =
                        VideoShooter.getCropDimensions(videoWidth, videoHeight, gifWidth, gifHeight);

                videoElement.width = gifWidth + cropDimens.width;
                videoElement.height = gifHeight + cropDimens.height;

                $(videoElement).css({
                    //position: 'absolute',
                    width: gifWidth + cropDimens.width + 'px',
                    height: gifHeight + cropDimens.height + 'px'
                    //left: -Math.floor(cropDimens.width / 2) + 'px',
                    //top: -Math.floor(cropDimens.height / 2) + 'px'
                });

                previewTarget.append(videoElement);
                // Firefox doesn't seem to obey autoplay if the element is not in the DOM when the content
                // is loaded, so we must manually trigger play after adding it, or the video will be frozen
                videoElement.play();
                videoShooter = new VideoShooter(videoElement, gifWidth, gifHeight, videoWidth, videoHeight,
                        cropDimens);
                //composer.form.click();

                $('#WebcamStatus').html('Watching...');
                ready();
            });
        };

        $('#WebcamStatus').html('Activating Webcam...');
        //startStreaming();

        /*
         <script src="lib/gumhelper/gumhelper.js"></script>
         <script src="lib/animated_gif/Animated_GIF.min.js"></script> */
        $LAB
                .script('lib/gumhelper/gumhelper.js')
                .script('lib/animated_gif/Animated_GIF.min.js')
                .wait(startStreaming);

        /*$(window).on('orientationchange', function() {
         gumHelper.stopVideoStreaming();
         composer.videoHolder.empty();
         startStreaming();
         });*/
    } else {
        $('#WebcamStatus').html('No video');
        //disableVideoMode();
    }
}

function webcamStop() {
    if (window.GumHelper)
        GumHelper.stopVideoStreaming();
    $('#WebcamStatus').html('');
    $('#WebcamImage').html('');
}

var getScreenshot = function(callback, numFrames, interval, progressCallback) {
    if (videoShooter) {
        videoShooter.getShot(callback, numFrames, interval, progressCallback);
    } else {
        //debug('Failed to install videoShooter');
        callback('');
    }
};

function webcamRecord(numFrames, frameInterval, whenUploaded) {

    getScreenshot(function(picture) {
        /*var submission = composer.inputs.reduce(function(data, input) {
         return (data[input.name] = input.value, data);
         }, { picture: picture });*/
        $('#WebcamStatus').html('Picture size:' + picture.length + ', Uploading...');

        var submission = {
            image: picture,
            format: 'gif'
        };


        var f = $('<form action="/uploadgif" method="post" enctype="multipart/form-data"><input type="submit" value="Upload" /></div></form>');
        f.ajaxSubmit({
            data: submission,
            success: function(data) {
                $('#WebcamStatus').html('Finished.');
                whenUploaded(data);
            }
        });

    }, numFrames, frameInterval, function(captureProgress) {
        $('#WebcamStatus').html('Capturing: ' + captureProgress);
        //progressCircleTo(captureProgress);
    });

}

function VideoShooter(videoElement, gifWidth, gifHeight, videoWidth, videoHeight, crop) {
    this.getShot = function(callback, numFrames, interval, progressCallback) {
        numFrames = numFrames !== undefined ? numFrames : 3;
        interval = interval !== undefined ? interval : 0.1; // In seconds

        var canvas = document.createElement('canvas');
        canvas.width = gifWidth;
        canvas.height = gifHeight;
        var context = canvas.getContext('2d');

        var pendingFrames = numFrames;
        var ag = new Animated_GIF({
            workerPath: 'lib/animated_gif/Animated_GIF.worker.min.js'
        });
        ag.setSize(gifWidth, gifHeight);
        ag.setDelay(parseInt(interval * 1000.0));

        var sourceX = Math.floor(crop.scaledWidth / 2);
        var sourceWidth = videoWidth - crop.scaledWidth;
        var sourceY = Math.floor(crop.scaledHeight / 2);
        var sourceHeight = videoHeight - crop.scaledHeight;

        var captureFrame = function() {
            context.drawImage(videoElement,
                    sourceX, sourceY, sourceWidth, sourceHeight,
                    0, 0, gifWidth, gifHeight);

            ag.addFrameImageData(context.getImageData(0, 0, gifWidth, gifHeight));
            pendingFrames--;

            // Call back with an r value indicating how far along we are in capture
            progressCallback((numFrames - pendingFrames) / numFrames);

            if (pendingFrames > 0) {
                setTimeout(captureFrame, parseInt(interval * 1000.0)); // timeouts are in milliseconds
            } else {
                ag.getBase64GIF(function(image) {
                    // Ensure workers are freed-so we avoid bug #103
                    // https://github.com/meatspaces/meatspace-chat/issues/103
                    ag.destroy();
                    callback(image);
                });
            }
        };

        captureFrame();
    };
}

VideoShooter.getCropDimensions = function(width, height, gifWidth, gifHeight) {
    var result = {width: 0, height: 0, scaledWidth: 0, scaledHeight: 0};
    if (width > height) {
        result.width = Math.round(width * (gifHeight / height)) - gifWidth;
        result.scaledWidth = Math.round(result.width * (height / gifHeight));
    } else {
        result.height = Math.round(height * (gifWidth / width)) - gifHeight;
        result.scaledHeight = Math.round(result.height * (width / gifWidth));
    }

    return result;
};


