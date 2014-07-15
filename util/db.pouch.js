var server;
var DB;
if (typeof window != 'undefined') {
	exports = {}; //functions used by both client and server
	module = {};
	server = false;
} else {
	_ = require('lodash');
	graphlib = require("graphlib");

	try {
		PouchDB = require('pouchdb');
	}
	catch (e) {
		console.error('PouchDB Database Interface requires modules: pouchdb [express-pouchdb corser]');
		process.exit(1);
	}

	server = true;
}


module.exports = DB = function (collection, dbOptions) {

	var revisions = false;

	if (dbOptions === undefined) dbOptions = {};

	var db = new PouchDB(collection, dbOptions);

	//db.viewCleanup();
	db.compact({});

	var idb = {

		db: db,

		start: function ($N) {
			if (collection == 'objects') {
				if (dbOptions.web) {
					$N.once('ready', function() {
						require('./db.pouch.web.js').start(dbOptions.web);
					});
				}

				idb.tagView = newView('tag', function (doc) {
					if (doc.value) {
						var v = doc.value;
						for (var i = 0; i < v.length; i++) {
							if (v[i].id)
								emit(v[i].id);
						}
					}
				});
				idb.modifiedAtView = newView('modifiedAt', function (doc) {
					if (doc.modifiedAt)
						emit(doc.modifiedAt);
					else if (doc.createdAt)
						emit(doc.createdAt);
				});
				idb.authorView = newView('author', function (doc) {
					if (doc.author)
						emit(doc.author);
				});

			}
			return this;
		},

		get: function (id, callback) {
			return db.get(id).then(function (x) {
				if (x)
					callback(null, x);
			}).catch(callback);
		},


		setAll: function(values, done) {
			if (revisions) {
				console.error('with revisions=true, setAll() may not work');
			}
			
			db.bulkDocs(values, done);
		},

		set: function (id, value, done, compareFilter) {
			var opts = { };
			value._id = id;

			function insert() {
				//opts.doc = [value];
				//db.bulkDocs(opts, done);				
				
				
				db.put(value, function(err, result) {
					//console.log('put', err, result, value, opts);
					done(err, result);
				});
				
				/*
					.then(function (response) {
						
						if (done)
							done(null, value);
					})
					.catch(function (err) {
						console.log('not inserted', err, value, opts);
						
						if (done)
							done(err, null);
					});
				*/
			}			
			
			/*if (!revisions) {
				//if not revisions, no need to check existing document
				opts.new_edits = false;
				insert();
				return;
			}			
			else
			*/
			
			{
				db.get(id).then(function (existing) {
					if (existing) {
						if (compareFilter) {
							value = compareFilter(existing, value);
							if (value == null) {
								return done(null, existing);
							}
						}
						value._rev = existing._rev;
					}
					
					insert();
				}).catch(function (err) {		
					db.put(value, function(err, result) {
						done(err, result);
					});
					
					//insert();
				});
			}
		},

		getAllByFieldValue: function (field, value, callback) {
			var map;
			if (field === 'author') {
				map = 'author';
			}
			else {
				//TODO is this more efficient as a precompiled string?
				map = {
					map: function (doc, emit) {
						emit(doc[field]);
					}
				};			
			}
			
			db.query(map, { include_docs: true, key: value }, function (err, result) {
				if (err) {
					callback(err);
				} else {
					callback(null, result.rows.map(function (row) {
						return row.doc;
					}));
				}
			});
		},

		getAllByTag: function (tag, callback) {
			if (typeof tag === "string")
				tag = [tag];

			db.query('tag', { keys: tag, include_docs: true },
			function (err, result) {
				if (err) {
					callback(err);
				} else {
					callback(null, result.rows.map(function (row) {
						return row.doc;
					}));
				}
			});
		},


		getNewest: function (max, callback) {
			db.query("modifiedAt",
					 {	limit: max, descending: true, include_docs: true }, 
			function (err, result) {
				if (err) {
					callback(err);
				} else {
					callback(null, result.rows.map(function (row) {
						return row.doc;
					}));
				}
			});
		},

		streamNewest: function (max, perObject) {
			db.query("modifiedAt",
					 {	limit: max, descending: true, include_docs: true }, 
			function (err, result) {
				if (!err) {
					result.rows.forEach(function (r) {
						perObject(null, r.doc);
					});
					perObject(null);
				} else {
					perObject(err);
				}
			});
		},


		getAll: function (callback) {
			db.allDocs({
					include_docs: true
				},
				function (err, response) {
					if (err) {
						callback(err, null);
					} else {
						callback(null, response.rows.map(function (row) {
							return row.doc;
						}));
					}
				}
			);
		},



		remove: function (query, callback) {
			db.get(query).then(function (doc) {
				db.remove(doc).then(function () {
					callback(null, doc);
				}).catch(callback);
			}).catch(callback);
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


	//http://pouchdb.com/2014/05/01/secondary-indexes-have-landed-in-pouchdb.html
	function newView(name, mapFunction) {
		var ddoc = {
			views: {}
		};
		ddoc.views[name] = {
			map: mapFunction.toString()
		};

		var id = '_design/' + name;
		idb.set(id, ddoc, function(err, c) {
			if (err)
				console.error('newView', err);
		}, function compare(existingView, newView) {
			if (_.isEqual(existingView.views, newView.views)) {
				return null;
			}
		});

		return ddoc;
	}

	return idb;
}

