/*
describe('Array', function(){
  describe('#indexOf()', function(){
    it('should return -1 when the value is not present', function(){
      [1,2,3].indexOf(5).should.equal(-1);
      [1,2,3].indexOf(0).should.equal(-1);
    })
  })
})
*/
var assert = require("assert");

var Netention = require('../../server/web.js');

describe('web.js', function(){
  describe('start', function(){
    it('creates an instance', function(){

		var $N = Netention();
		assert($N);
		assert($N.emit);

    });

  });
});
