var DB;
var server = false;
try {
	process.title;	server = true;
}
catch(e) { }

if ((!server) && (typeof window != 'undefined')) {
    exports = {}; //functions used by both client and server
	server = false;
} else {
	_ = require('lodash');

	try {
		levelup = require('levelup');
		levelQuery = require('level-queryengine');
		jsonqueryEngine = require('jsonquery-engine');
	}
	catch (e) {
		console.error('LevelUp Database Interface requires modules: levelup, level-queryengine, jsonquery-engine');
		process.exit(1);
	}


	server = true;
}


module.exports = DB = function (collection, dbOptions) {

	if (dbOptions === undefined) dbOptions = {};

	if (dbOptions.backend)
		dbOptions.db = require(dbOptions.backend);

	dbOptions.valueEncoding = 'json';

	var rawDB = (dbOptions.backend === 'memdown') ?
		levelup(dbOptions)
		: levelup(collection,dbOptions);



	var db = levelQuery(rawDB);
	db.query.use(jsonqueryEngine());

	function prefilter(value) {
		if (!value.modifiedAt)
			value.modifiedAt = value.createdAt;

		//store modifiedAt descending because it is supposed to be faster to iterate forward than reverse in LevelUp
		if (value.modifiedAt) {
			value._modifiedAtDesc = -value.modifiedAt;
		}
		return value;
	}

	function postfilter(value) {
		delete value._modifiedAtDesc;
		delete value._id;
		delete value.tagList;

		var inoutcount = 0;
		if (value.inout) {
			for (var x in value.inout) {
				for (var y in value.inout[x])
					inoutcount++;					
			}
			if (inoutcount === 0)
				delete value.inoutcount;
		}
		
		return value;		
	}
	function postfilterAll(values) {
		return values.map(postfilter);
	}
	
	var idb = {

		db: db,

		start: function ($N) {
			if (collection === 'objects') {
				db.ensureIndex('_modifiedAtDesc');
				/*
				db.ensureIndex('modifiedAtDesc', function (key, value, emit) {
					//console.log('kv', key, value);
					if (value.modifiedAt !== undefined) emit(-(value.modifiedAt));
				}, function() {
					console.log('modified index done');
				});
				*/

				db.ensureIndex('author');
				db.ensureIndex('tagList');

//
//				if (dbOptions.web) {
//					$N.once('ready', function() {
//						dbOptions.web.https = dbOptions.web.port;
//						console.log('starting levelweb');
//						require('levelweb/lib')(dbOptions.web);
//						/*({
//							host: argv.host,
//							https: argv.https,
//							protocol: argv.protocol,
//							client: argv.client,
//							server: argv.server,
//							location: argv._[0],
//							encoding: argv.encoding,
//							valueEncoding: argv.valueEncoding || argv.encoding,
//							keyEncoding:argv.keyEncoding
//						})*/
//					});
//				}
			}
			else if (collection === 'users') {
				db.ensureIndex('name');
				db.ensureIndex('email');
			}


			return this;
		},

		get: function (id, callback) {
			db.get(id, function(err, x) {
				if (!err && x)
					x = postfilter(x);
				callback(err, x);
			});
		},


		set: function (id, value, done, compareFilter) {
			value = prefilter(value);

			db.put(id, value, function(err) {
				if (err)
					return done(err);
				return done(null, value);
			});
		},

		getAllByFieldValue: function (field, value, callback) {
			var query = { };
			query[field] = value;


			var results =  [];
 		    db.query(query)
				.on('data', function(d) {
					results.push(postfilter(d));
				})
				.on('end', function () {
					callback(null, results);
				});
		},

		getAllByTag: function (tag, callback) {
			if (typeof tag === "string")
				tag = [tag];

			var results =  [];

			var query = { tagList: { $in: tag } };
 		    db.query(query)
				.on('data', function(d) {
					results.push(postfilter(d));
				})
				.on('end', function () {
					callback(null, results);
				});
		},


		getNewest: function (max, callback) {
			var results =  [];

			var stream = this.streamNewest(max, function(err, x) {
				if (err) {
					stream.end();
					stream = null;
					return callback(err);
				}
				else if (x)
					results.push(postfilter(x));
				else
					return callback(null, results);
			});
		},

		streamNewest: function (max, perObject) {
			var query = { _modifiedAtDesc: { $lt: 0 } } ;

			/*
			 db.indexes['tags'].createIndexStream({
				start: ['tag1', null],
				end: ['tag1', undefined]
			  }).on('data', console.log);
			  */


			var count = 0;
 		    return db.query(query)
				.on('data', function(x) {
					if (!x.id) return;

					x = postfilter(x);
					
					perObject(null, x);
					count++;
					if (count == max)
						this.end();
				})
				.on('end', function () {
					perObject(null, null);
				});

		},


		getAll: function (callback) {
			var result = [];

			rawDB.createValueStream()
			  .on('data', function (data) {
				  result.push(postfilter(data));
			  })
			  .on('error', function (err) {
				  callback(err, null);
			  })
			  .on('close', function () {
				//console.log('Stream closed')
			  })
			  .on('end', function () {
				callback(null, result);
			  });
		},



		remove: function(id, callback) {
			db.del(id, callback);
		},

		//remove expired, and other periodic maintenance
		update: function () {
			/*
			function getExpiredObjects(withObjects) {
				db.obj.ensureIndex({modifiedAt: 1}, function(err, eres) {
					if (err) {
						withError('ENSURE INDEX modifiedAt ' + err);
						return;
					}

					var now = Date.now();

					db.obj.find({expiresAt: {$lte: now}}, function(err, objs) {
						if (!err)
							withObjects(objs);
					});
				});
			}
			function removeExpired() {
				getExpiredObjects(function(objs) {
					if (objs.length == 0)
						return;
					var ids = _.map(objs, function(o) {
						return o.id;
					});

					$N.deleteObjects(ids); //TODO dont refer to $N, use local DB-specific function
				});
			}

			removeExpired();
			*/
		},

		stop: function () {}
	};

	return idb;
};

