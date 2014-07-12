var telehash = require("telehash");
telehash.connect({id:"abc" }, function(reply){
  console.log(reply);
});