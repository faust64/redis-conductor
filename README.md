# Redis-Conductor

Install with `npm install redis-conductor`

Running several instances of the same process:

```
const conductor = require('redis-conductor');
//use redis server at 127.0.0.0:6379, db #0
const neighbors = conductor('my-process-name');

//or pass in redis optional options:
//const neighbors = conductor('my-process-name', { host: redisBackend, port: redisPort, dbId: redisDb, authPass: redisPass );

[...]
    if (neighbors.isElectedMaster() !== false) {
	console.log('we know that process is currently our master');
	console.log('exec some task that should not run twice simultaneously');
    } else {
	console.log('There is no spoon');
    }
```
