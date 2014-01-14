function cortexitSetFrame(ee, n) {
    //console.dir(e[0].id);
    //console.dir(e + ' p');
	var e = ee[0];
	var pp = $('#' + e.id + ' p');
	var num = pp.length;
	var p = pp[n];
	$('#' + e.id + ' .cortexitContent').html(p.innerHTML);
	
	ee.data('frame', n);
	ee.data('numFrames', num);
	
	$('#' + e.id + ' .cortexitMenu .cortexitMenuButton').html((n+1) + '/' + (num));
}

function cortexitSetNextFrame(e, deltaFrames) {
	var currentFrame = e.data('frame');
	var numFrames = e.data('numFrames');
	
	var nextFrame = currentFrame + deltaFrames;
	if (nextFrame < 0) nextFrame = 0;
	if (nextFrame > numFrames-1) nextFrame = numFrames-1;
	
	if (currentFrame!=nextFrame) {
		cortexitSetFrame(e, nextFrame);
	}
}

function updateFont(c, deltaFontSize) {
	var minFontSize = 6;
	
    if (c == null)
        return;
    
    var oldSize = c.style.fontSize;
    //assumes that fontSize is already specified
    if (oldSize == undefined) {
    	oldSize = '12px';
    }
    oldSize = oldSize.substring(0, oldSize.length-2);
    oldSize = parseFloat(oldSize);
    var fontSize = parseFloat(oldSize) + deltaFontSize;
    if (fontSize < minFontSize) fontSize = minFontSize;
    
    c.style.fontSize = fontSize + "px"; 
    
    //TODO iterate and apply to child elements
    
//    var e = c.getElementsByTagName("a");
//    for (var i = 0; i < e.length; i++) {
//        e[i].style.fontSize = c.style.fontSize;
//    }        
        
}

function onScroll(element, s) {
	element.bind('mousewheel DOMMouseScroll', function(e, delta) {
		delta = delta || event.detail || event.wheelDelta;
		s(delta);		
	});
}

function cortexit(elementID, params) {
	var defaultFontSize = 32;
	var fontSizeDelta = 4;
	
	var e = $('#' + elementID);
	e.addClass('cortexitWrap');
	e.attr('tabindex', 1);
	
	var internalP = $('#' + elementID + ' p');
	internalP.addClass('pHidden');
	
	var fontLarger = function() {
		updateFont(content[0], +fontSizeDelta);		
	};
	var fontSmaller = function() {
		updateFont(content[0], -fontSizeDelta);		
	};
	var goNext = function() {
		cortexitSetNextFrame(e, +1);
	};
	var goPrev = function() {
		cortexitSetNextFrame(e, -1);
	};
	var onClose = function() {	}
	
	if (params!=undefined) {
		if (params.onClose)
			onClose = params.onClose;
	}
	
	var content = $('<div class="cortexitContent" style="font-size: ' + defaultFontSize + 'px"></div>');
	
	document.getElementById(elementID).onkeydown = function(e){
	    var keycode;
	    if (e == null) { // ie
	        keycode = event.keyCode;
	    } else { // mozilla
	        keycode = e.which;
	    }
	        
	    //if (!widgets['Edit']) {
	            
	        if (keycode == 37)		            //left
	            goPrev();
	        else if (keycode == 38)	            //up
	            fontLarger();
	        else if (keycode == 39)	            //right
	            goNext();
	        else if (keycode == 40)	            //down
	            fontSmaller();
	        else if (keycode == 27) //escape
	        	onClose();
	    //}
	};

	content.appendTo(e);
	
	var m = $('<div class="cortexitMenu"></div>');
	
	var fontSizer = $('<span class="cortexitFontSizer">-/+</span>');
	onScroll(fontSizer, function(delta) {
		if (delta < 0)
			fontSmaller();
		else if (delta > 0)
			fontLarger();					
	});	
	fontSizer.appendTo(m);
	
	//$('<span class="prevFrame">&lt;-</span>').appendTo(m);
	
	var button = $('<a href="#" class="cortexitMenuButton">*/*</a>');
	onScroll(button, function(delta) {
		if (delta < 0)
			goPrev();
		else if (delta > 0)
			goNext();							
	});
	button.appendTo(m);
	
	var submenu = $('<div class="cortexitSubMenu" style="display:none"></div>');
	{
		$('<span>translate</span>').appendTo(submenu);
		$('<span>edit</span>').appendTo(submenu);
		$('<span>images</span>').appendTo(submenu);
		$('<span>speak</span>').appendTo(submenu);
		$('<span>theme</span>').appendTo(submenu);
		$('<span>strobe</span>').appendTo(submenu);
		$('<span>share</span>').appendTo(submenu);
		$('<span>remember</span>').appendTo(submenu);
	}
	submenu.appendTo(m);
	
	button.click(function() {
		submenu.toggle('fast');
	});
	

	
	//$('<span class="prevFrame">-&gt;</span>').appendTo(m);
	
	m.appendTo(e);
	
	/*
	e.each(function () {
	    var s = $(this);
	    cortexitSetFrame(s, 0);
	});*/
	cortexitSetFrame(e, 0);
}

