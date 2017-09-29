var LocalStrategy = require('passport-local').Strategy;
var plazigramClient = require('platzigram-client');
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