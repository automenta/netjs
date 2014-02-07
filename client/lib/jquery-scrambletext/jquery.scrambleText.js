(function($) {
  // callback function for matched regular expressions
  var replaceWord = function(match) {
    // skip words with less than four letters
    if (match.length < 4) {
      return match;
    }
    // keep first and last letter, shuffle letters in between
    return match.charAt(0) +
      shuffle(match.slice(1, -1)) + 
      match.charAt(match.length - 1);
  }

  // shuffle the letters of a given string
  var shuffle = function(str) {
    var a = str.split(''),
    n = a.length;
    for(var i = n - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i];
      a[i] = a[j];
      a[j] = tmp;
    }
    return a.join('');
  };

  // main plug-in function
  $.fn.scrambleText = function(options) {   
    options =
      $.extend({}, $.fn.scrambleText.defaults, options); 

    return $(this).each(function() {
      text = $(this).text();
      text = text.replace(options.regex, replaceWord);
      $(this).text(text);
    });
  };

  // default options
  $.fn.scrambleText.defaults = {
    regex: /[A-Za-z]+/g
  };
})(jQuery);
