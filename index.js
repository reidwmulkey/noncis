var redis = require('redis');
var uuid = require('node-uuid');
var q = require('q');

module.exports = function(port, host){
  var client = redis.createClient(port, host);
  var module = {};

  module.setNonce = function(req, res){
    var deferred = q.defer();
    var ip = req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'] : req.connection.remoteAddress;

    client.get(ip, function(err, nonce){
      if(err) deferred.reject(err);
      else{
        res.locals.nonce = nonce;
        if(nonce) 
          deferred.resolve(nonce);
        else{
          nonce = uuid.v1();
          client.set(ip, nonce, function(err){
            if(err) deferred.reject(err);
            else deferred.resolve(nonce);
          });
        }
      }
    });
    return deferred.promise;
  }  

  return module;
}
/*
module.exports.attach = function (broker) {
  var brokerOptions = broker.options.brokerOptions;
  var instanceId = broker.instanceId;
  
  var subClient = redis.createClient(brokerOptions.port, brokerOptions.host, brokerOptions);
  var pubClient = redis.createClient(brokerOptions.port, brokerOptions.host, brokerOptions);
  
  broker.on('subscribe', subClient.subscribe.bind(subClient));
  broker.on('unsubscribe', subClient.unsubscribe.bind(subClient));
  broker.on('publish', function (channel, data) {
    if (data instanceof Object) {
      try {
        data = '/o:' + JSON.stringify(data);
      } catch (e) {
        data = '/s:' + data;
      }
    } else {
      data = '/s:' + data;
    }
    
    if (instanceId != null) {
      data = instanceId + data;
    }
    
    pubClient.publish(channel, data);
  });
  
  var instanceIdRegex = /^[^\/]*\//;
  
  subClient.on('message', function (channel, message) {
    var sender = null;
    message = message.replace(instanceIdRegex, function (match) {
      sender = match.slice(0, -1);
      return '';
    });
    
    // Do not publish if this message was published by 
    // the current SC instance since it has already been
    // handled internally
    if (sender == null || sender != instanceId) {
      var type = message.charAt(0);
      var data;
      if (type == 'o') {
        try {
          data = JSON.parse(message.slice(2));
        } catch (e) {
          data = message.slice(2);
        }
      } else {
        data = message.slice(2);
      }
      broker.publish(channel, data);
    }
  });
};*/