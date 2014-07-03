module.exports = function($N, collection) {
	var PouchDB = require('pouchdb');
	var GQL = require('gql');
	PouchDB.plugin({ gql: GQL });

	var db = new PouchDB(collection);


	var options = $N.server;


	return {

		start: function() {
			return this;
		},

		get: function(id, callback) {
			db.get(id).then(function(x) {
				callback(null, x);
			}).catch(callback);
		},

		set: function(id, value, done) {
			 db.get(id).then(function(existing) {
				db.put(value, id, existing._rev)
					.then(function(response) {
						done(null, response);
					})
					.catch(function(err) {
						done(err, null);
					});
			 }).catch(function(err) {
				 db.put(value, id, done);
			 });
		},

		getAllByFieldValue: function(field, value, callback) {
			/*var fieldMeta = {};
			fieldMeta[field] = "hashed";

			db[collection].ensureIndex(fieldMeta, function(err, res) {
				if (err) {
					callback(err);
					return;
				}

				var q = { };
				q[field] = value;
				db[collection].find(q, callback);
			});*/
			callback(null, []);
		},

		getAllByTag: function(tag, callback) {
			/*db[collection].ensureIndex({tagList: 1}, function(err, res) {
				if (err) {
					callback(err);
					return;
				}

				db[collection].find({tagList: {$in: tag}}, callback);
			});*/
			callback(null, []);
		},

		getNewest: function(max, callback) {
			db.query({
				map: function(doc, emit) {
					emit([doc.modifiedAt||doc.createdAt, doc]);
				},
				limit: max,
				descending: true
		 	}, function(err, result) {
				callback(null, result.map(function(row) {
					return row.key[1];
				}));
			});
		},

		streamNewest: function(max, perObject) {
			db.query({
				map: function(doc, emit) {
					emit([doc.modifiedAt||doc.createdAt, doc]);
				},
				limit: max,
				descending: true,
		 	}, function(err, result) {
				if (!err) {
					result.rows.forEach(function(r) {
						perObject(null, r.key[1]);
					});
					perObject(null);
				}
				else {
					perObject(err);
				}
			});
		},


		getAll: function(callback) {
			db.allDocs({include_docs: true},
			    function(err, response) {
					if (err) {
						callback(err, null);
					}
					else {
						callback(null, response.map(function(row) {
							return row.doc;
						}));
					}
		    	}
 		    );
		},



		remove: function(query, callback) {
			/*
			if (typeof query === "string")
				query = {id: query};

			db[collection].remove(query, callback);
			*/
			var that = this;
			this.db.get(name).then(function(doc) {
				that.db.remove(doc).then(function() {
					callback(null, doc);
				}).catch(callback);
			}).catch(callback);

		},

		//remove expired, and other periodic maintenance
		update: function() {
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

		stop: function() {
		}
	};
}
