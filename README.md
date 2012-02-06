# [testswarm-browserstack](http://jquery.com/) - Integration layer between TestSwarm and BrowserStack API
==================================================

### This repo contains two parts:
1. [testswarm-browserstack.js](https://github.com/clarkbox/testswarm-browserstack/blob/master/testswarm-browserstack.js) - abstraction of TestSwarm "getNeeded" endpoint, and Soctt Gonzales' Browserstack API. Used to spawn Browserstack workers required by TestSwarm.
2. [testswarm-browserstack.cli.js](https://github.com/clarkbox/testswarm-browserstack/blob/master/testswarm-browserstack.cli.js) - nodejs CLI interface wrapper around the above JS.

### Dependencies:
* [commander](https://github.com/visionmedia/commander.js)
* [async](https://github.com/caolan/async)
* [node-browserstack](https://github.com/scottgonzalez/node-browserstack)


## testswarm-browserstack.js
--------------------------------------
### getNeeded(callback):
* Returns the TestSwarm ["useragent ID's]"(https://github.com/jquery/testswarm/blob/master/config/useragents.sql)
* parameters:
* * function callback(error, useragnets)
* * * error (object) - null if none
* * * useragnets (interger array) - JSON array of useragendIDs

### killWorker(workerId):
Kill a single worker. Calls BrowserStack.terminateWorker()
* parameters:
* * workerId (integer) - BrowserStack Worker ID as returned by startWorker 

### killAll()
Kill all workers running on BrowserStack. 

### options([options])
<font color="red">Call this first!</font>get/set the options required to run. Passing in an object literal will set the options. calling without arguments will return the current options.
#### Example options:
'
{
    user: 'myUserId',
    pass: 'myPassWurd',
    swarmUrl: 'swarm.jquery.org',
    spawnUrl: 'http://swarm.jquery.org/run',
    verbose: false,
    kill: true,
    clientTimeout: 6000
}
'
#### Option Definition:
* user - BrowserStack username
* pass - BrowserStack password
* swarmUrl - the URL of the TestSwarm instance (where the getneeded endpoint lives)
* spawnUrl - the URL to open when a BrowserStack worker starts
* verbose - output more debug messages (all output via console.log())
* kill - kill workers that are no longer in getNeeded output
* clientTimeout - number of seconds to run a worker


##  testswarm-browserstack.cli.js
--------------------------------------
this is a nodejs CLI interface wrapper around the above code. Use --help for all you need to know:

'
$ ./testswarm-browserstack.cli.js 

  Usage: testswarm-browserstack.cli.js [options]

  Options:

    -h, --help                 output usage information
    -V, --version              output the version number
    --killAll                  kill all workers now
    --killWorker [workerid]    kill worker
    --getNeeded                return the workers required by testswarm
    -k, --kill                 if --run specified, kill workers if they are no longer needed.
    -r, --run                  start up workers required by browserstack
    -u, --user [username]      browserstack username
    -p, --pass [password]      browserstack password
    -s, --swarmUrl [url]       testswarm URL of getneeded call
    -w, --spawnUrl [url]       URL for browserstack workers to run
    -v, --verbose              print more info
    -t, --clientTimeout [min]  number of minuets to run each client (browserstack timeout)
'