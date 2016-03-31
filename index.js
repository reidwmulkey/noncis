var redis = require('redis');
var uuid = require('node-uuid');
var q = require('q');

module.exports = function(port, host, keepAlive){
  var client = redis.createClient(port, host);
  var module = {};

  if(!keepAlive) keepAlive = 30000;

  module.setNonce = function(req, res){
    var deferred = q.defer();
    var ip = req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'] : req.connection.remoteAddress;

    client.get(ip, function(err, nonce){
      if(err) deferred.reject(err);
      else if(nonce){
        client.pexpire(ip, keepAlive);
        res.locals.nonce = nonce;
        deferred.resolve(nonce);
      }
      else{
        nonce = uuid.v1();
        client.set(ip, nonce, function(err){
          if(err) deferred.reject(err);
          else {
            res.locals.nonce = nonce;
            client.pexpire(ip, keepAlive);
            deferred.resolve(nonce);
          }
        });
      }
    });
    return deferred.promise;
  }  

  return module;
}