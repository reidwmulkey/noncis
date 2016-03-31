# Noncis

This is a Redis adapter for syncronizing nonces across nodeJS instances based on user IP.

Install
-----------------
```
	npm install noncis
```

Purpose
---------

Let's say you have a terribly-insecure script(that you trust), and you want to run it on your nodeJS application.

```
	<script>
		eval('console.log("Evals are incredibly unsafe!");');
	</script>
```

Rather than allowing a blanket opening for attacks in your Content Security Policy, you want to use script nonces. If you are running behind a reverse proxy (e.g. NGINX) pointing to multiple instances of your nodeJS app, then you cannot simply set a new nonce for each request. For example, lets say we have a simple view file that the user is trying to load.

```
	index.jade

	script(nonce='#{locals["nonce"]}') eval('console.log("Evals are incredibly unsafe!");'
	script(nonce='#{locals["nonce"]}') eval('console.log("There doesn\'t need to be 2 unsafe scripts for the purpose of this example, but whatever.")');
```

Now, let's set our nonce using some express middleware and use the helmet package to generate our CSP:
```
	app.use(function(req,res,next){
	 	res.locals.nonce = uuid.v1();
	 	next();
	});

	app.use(helmet.csp({
		directives: {
			scriptSrc: [
				"'self'",
				function (req, res) {
					return "'nonce-" + res.locals.nonce + "'"  
				}
			]
		}
	});
			
```

After NGINX load balances each request, we can end up with the following scenario:

```
	index.jade //(loaded from appServer0 with CSP of 'nonce-eb3f2bb0-f6d9-11e5-b0cc-19d0476997f5')

	//(loaded from appServer1 with CSP of 'nonce-100d5590-f6d9-11e5-b0cc-19d0476997f5')
	script(nonce='#{locals["nonce"]}') eval('console.log("Evals are incredibly unsafe!");'


	//(loaded from appServer2 with CSP of 'nonce-eb4482e0-f6d9-11e5-b0cc-19d0476997f5')
	script(nonce='#{locals["nonce"]}') eval('console.log("There doesn\'t need to be 2 unsafe scripts for the purpose of this example, but whatever.")');
```
Both of these scripts will fail, due to the mismatching nonces. This package syncronizes the nonces across all nodeJS instances to avoid the above scenario. This package does not interfere with web socket adapters, so if you already have a web socket sync server, you can also use it to synchronize nonces.

Usage
-------

First, start by initializing noncis:

```
	var noncis = require('noncis')(6379, 'localhost', 2000);
	//port of your Redis DB
	//host of your Redis DB
	//Number of milliseconds to keep each nonce alive (default 30000)
		//the PEXPIRE time is updated with each GET to avoid a nonce desynchronization
```

`noncis.setNonce(req, res)` sets the nonce for the res object, and returns a promise that resolves the nonce. I recommend using an `app.use()` at the top of your nodeJS app, e.g.:
```
	app.use(function(req, res, next){
		noncis.setNonce(req, res)
		.then(function(){
			next();
		})
		.catch(next);
	})
```
You will now be able to use the same `res.locals.nonce` across all of your instances.

Test
-----
The test depends on a local redisDB and will modify the redis keys "::ffff:127.0.0.1" and "1.1.1.1". In order to run the tests, type:
```
	npm install --dev
	npm test
```

License
--------
(The MIT License)

Copyright (c) 2016 reidwmulkey

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.