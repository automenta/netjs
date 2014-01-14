/*
https://npmjs.org/package/get-telehash

http://news.ycombinator.com/item?id=2068817
*/
var telehash = require("telehash");

telehash.seed(function(err){
  telehash.listen({id:"abc"}, function(telex){
    console.log(telex);
  })
});
