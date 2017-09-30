var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var plazigramClient = require('platzigram-client');
var jwt = require('jsonwebtoken');
var config = require('../config');

var client = plazigramClient.createClient(config.client);

exports.localStrategy = new LocalStrategy((username, password, done) => {
	client.auth(username, password)
		.then(token => {
			client.getUser(username)
				.then(user => {
					user.token = token;
					return done(null, user);
				})
				.catch((err) => {
					return done(null, false, { message: `an error ocurred: ${err.message}` });
				});
		})
		.catch(() => {
			return done(null, false, { message: 'userbame and password not found' });
		});
});

exports.facebookStrategy = new FacebookStrategy({
	clientID: config.auth.facebook.clientID,
	clientSecret: config.auth.facebook.clientSecret,
	callbackURL: config.auth.facebook.callbackURL,
	profileFields: ['id', 'displayName', 'email']
}, function (accestoken, refreshToken, profile, done) {
	var userProfile = {
		username: profile._json.id,
		name: profile._json.name,
		email: profile._json.email,
		facebook: true
	};

	findOrCreate(userProfile, (err, user) => {
		if (err) return done(err);
		jwt.sign({ userId: user.username }, config.secret, {}, (e, token) => {
			if (e) return done(e);
			user.token = token;
			return done(null, user);
		});
	});

	function findOrCreate(user, callback) {
		client.getUser(user.username)
			.then(usr => {
				return callback(null, usr);
			})
			.catch(() => {
				client.saveUser(user)
					.then((u) => {
						return callback(null, u);
					})
					.catch(err => {
						return callback(err);
					});
			});
	}
});

exports.serializeUser = (user, done) => {
	return done(null, {
		username: user.username,
		token: user.token
	});
};

exports.deserializeUser = (user, done) => {
	client.getUser(user.username)
		.then(usr => {
			usr.token = user.token;
			return done(null, usr);
		})
		.catch(err => {
			return done(err);
		});
};

