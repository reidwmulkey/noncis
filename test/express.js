var express = require('express');
var http = require('http');
var noncis = require('../');

module.exports = function(port){
	var app = express();

	app.get('/', function(req, res, next) {
		noncis.setNonce(req, res)
		.then(function(){
			res.send(res.locals.nonce);
		})
		.catch(function(err){
			res.status(500).send(err);
		});
	});

	app.set('port', port);

	var server = http.createServer(app);

	server.listen(port);
	console.log('server listening on port ' + port + '.');

	return server;
}