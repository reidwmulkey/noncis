var request = require('supertest-as-promised');
var noncis = require('../')(6739, 'localhost');
var app1, app2;

describe('noncis', function(){
	before(function(done){
		app1 = require('./express')(3000);
		done();
	});

	it('should return a uuid', function(done){
		request(app1)
		.get("/")
		.expect(200)
		.then(function(res) {
			console.log(res.body);
			done();
		});
	});
});