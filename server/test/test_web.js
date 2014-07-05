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
var Q = require('q');

describe('web.js', function () {
	describe('start', function () {
		var $N = Netention();

		it('creates an instance', function () {

			assert($N);
			assert($N.emit);

		});

		it('get and set object', function (done) {

			$N.once('ready', function () {
				$N.add(new $N.nobject("x"), function (err, result) {
					if (err) {
						console.error(err);
					}

					assert(err == null);

					$N.get("x", function (err, x) {
						if (err) {
							assert(false, err);
						} else
							done();
					});

				});
			});


		});

		it('publish with filter', function (done) {
			var exampleFilter = function (input) {
				return Q.Promise(function (resolve, reject, notify) {
					resolve(input + input);
				});
			}

			/*
			function syncFilter(f) {
				return function (input) {
					return Q.Promise(function (resolve, reject, notify) {
						resolve(f(input));
					});
				};
			}

			$N.addFilter('pub', syncFilter(function (f) {
				f.name = f.name + f.name;
				return f;
			}));*/
			$N.addFilterSync('pub', function (f) {
				f.name = f.name + f.name;
				return f;
			});

			var y = new $N.nobject("y");
			y.setName('y');
			$N.pub(y, function() {

				$N.get("y", function (err, y) {
					if (err) {
						assert(false, err);
					} else {
						assert(y.name === 'yy');
					}
					done();
				});

			});


		});

	});
});
