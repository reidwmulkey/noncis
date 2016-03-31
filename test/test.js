var redis = require('redis');
var request = require('supertest-as-promised');
var assert = require('assert');
var app1, app2;
var nonce1, nonce2;

describe('noncis', function(){
	before(function(done){
		var client = redis.createClient(6379, 'localhost');
		client.del("::ffff:127.0.0.1", "1.1.1.1", function(err){
			if(err) done(err);
			else{
				app1 = require('./express')(3000);
				app2 = require('./express')(3001);
				done();
			}
		});
	});

	it('should set a nonce on the first request', function(done){
		request(app1)
		.get("/")
		.expect(200)
		.then(function(res) {
			nonce1 = res.text;
			assert.ok(!(res.locals && res.locals.nonce));
			done();
		});
	});

	it('should get the same nonce within keepAlive time', function(done){
		request(app1)
		.get("/")
		.expect(200)
		.then(function(res) {
			assert.equal(nonce1, res.text);
			assert.ok(!(res.locals && res.locals.nonce));
			done();
		});
	});

	it('should get the same nonce on app2', function(done){
		request(app2)
		.get("/")
		.expect(200)
		.then(function(res) {
			assert.equal(nonce1, res.text);
			assert.ok(!(res.locals && res.locals.nonce));
			done();
		});
	});

	it('should set a nonce for an IP accessing behind a proxy', function(done){
		request(app2)
		.get("/")
		.set('x-forwarded-for', "1.1.1.1")
		.expect(200)
		.then(function(res) {
			nonce2 = res.text;
			assert.ok(nonce1 !== nonce2);
			assert.ok(!(res.locals && res.locals.nonce));
			done();
		});
	});

	it('should get the same nonce within keepAlive time behind a proxy', function(done){
		request(app2)
		.get("/")
		.set('x-forwarded-for', "1.1.1.1")
		.expect(200)
		.then(function(res) {
			assert.equal(nonce2, res.text);
			assert.ok(nonce1 !== nonce2);
			assert.ok(!(res.locals && res.locals.nonce));
			done();
		});
	});

	it('should get the same nonce on app1 behind a proxy', function(done){
		request(app1)
		.get("/")
		.set('x-forwarded-for', "1.1.1.1")
		.expect(200)
		.then(function(res) {
			assert.equal(nonce2, res.text);
			assert.ok(nonce1 !== nonce2);
			assert.ok(!(res.locals && res.locals.nonce));
			done();
		});
	});

	it('should get the same nonce for localhost despite the proxy connect', function(done){
		request(app1)
		.get("/")
		.expect(200)
		.then(function(res) {
			assert.equal(nonce1, res.text);
			assert.ok(nonce1 !== nonce2);
			assert.ok(!(res.locals && res.locals.nonce));
			done();
		});
	});

	it('should reset the keepAlive timer if the value is access', function(done){
		this.timeout(3000);
		setTimeout(function(){
			request(app1)
			.get("/")
			.expect(200)
			.then(function(res) {
				assert.equal(nonce1, res.text);
				assert.ok(nonce1 !== nonce2);
				assert.ok(!(res.locals && res.locals.nonce));
				setTimeout(function(){
					request(app1)
					.get("/")
					.expect(200)
					.then(function(res) {
						assert.equal(nonce1, res.text);
						assert.ok(nonce1 !== nonce2);
						assert.ok(!(res.locals && res.locals.nonce));
						done();
					});
				}, 700);
			});
		}, 1500);
	});

	it('should set a new nonce past the keepAlive time', function(done){
		this.timeout(3000);
		setTimeout(function(){
			request(app1)
			.get("/")
			.expect(200)
			.then(function(res) {
				assert.ok(nonce1 !== res.text);
				assert.ok(res.text !== nonce2);
				assert.ok(!(res.locals && res.locals.nonce));
				done();
			});
		},2100);
	});

	it('should set a new nonce past the keepAlive time when behind a proxy', function(done){
		request(app1)
		.get("/")
		.set('x-forwarded-for', "1.1.1.1")
		.expect(200)
		.then(function(res) {
			assert.ok(nonce1 !== res.text);
			assert.ok(res.text !== nonce2);
			assert.ok(!(res.locals && res.locals.nonce));
			done();
		});
	});
});