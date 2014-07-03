module.exports = function($N) {
	var mongo;
	var db;

	var options = $N.server;

	try {
		mongo = require("mongojs");
	}
	catch (e) {
		console.error('Module required: mongojs');
		process.exit();
	}

	return {

		start: function() {


			//"mydb"; // "username:password@example.com/mydb"
			var dbURL = options.databaseHost + "/" + options.database; //|| process.env.MongoURL;
			db = mongo.connect(dbURL, ["obj", "sys"]);


			return this;
		},

		get: function(collection, id, callback) {
			db[collection].ensureIndex({id: "hashed"}, function(err, res) {
				db[collection].find({id: id}, callback);
			});
		},

		getAllByFieldValue: function(collection, field, value, callback) {
			var fieldMeta = {};
			fieldMeta[field] = "hashed";

			db[collection].ensureIndex(fieldMeta, function(err, res) {
				if (err) {
					callback(err);
					return;
				}

				var q = { };
				q[field] = value;
				db[collection].find(q, callback);
			});
		},

		getAllByTag: function(collection, tag, callback) {
			db[collection].ensureIndex({tagList: 1}, function(err, res) {
				if (err) {
					callback(err);
					return;
				}

				db[collection].find({tagList: {$in: tag}}, callback);
			});
		},

		getNewest: function(collection, max, callback) {
			db[collection].ensureIndex({modifiedAt: 1}, function(err, eres) {
				if (err) {
					callback(err);
					return;
				}

				//TODO scope >= PUBLIC
				db[collection].find().limit(max).sort({modifiedAt: -1}, callback);
			});
		},

		streamNewest: function(collection, max, perObject) {
			db[collection].ensureIndex({modifiedAt: 1}, function(err, eres) {
				if (err) {
					callback(err);
					return;
				}

				//TODO scope >= PUBLIC
				db[collection].find().limit(max).sort({modifiedAt: -1}).forEach(perObject);
			});
		},


		getAll: function(collection, callback) {
			db[collection].find(callback);
		},

		set: function(collection, id, value, callback) {
			db[collection].update({id: id}, value, {upsert: true}, callback);
		},

		remove: function(collection, query, callback) {
			if (typeof query === "string")
				query = {id: query};

			db[collection].remove(query, callback);
		},

		//remove expired, and other periodic maintenance
		update: function() {
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

		},

		stop: function() {
		}
	};
}
