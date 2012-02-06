# [testswarm-browserstack](http://jquery.com/)
This is a light weight integration layer between [TestSwarm](https://github.com/jquery/testswarm) and [BrowserStack](http://www.browserstack.com/). Use it to spawn BrowserStack workers needed by TestSwarm on demand.


## Howto use CLI:
<pre>
testswarm-browserstack.cli.js --swarmUrl "swarm.jquery.org" --spawnUrl "http://swarm.jquery.org/run/"  --user "browserstackUserName" --pass "myPass@#$" --clientTimeout 15 --run --kill
</pre>

This above command will spawn (via --run) AND kill (via `--kill`) BrowSack workers as indicated by the TestSwarm `getNeeded` endpoint. This command should be executed on a regular interval, via CRON or other scheduler - for more short term requirements, see [node-cli-repeater](https://github.com/clarkbox/node-repeater))


In most cases, the `--kill` option should always accompany the `--run` option. This will ensure workers are not running idle, and depend on `--clientTimeout` option for works to die and allow other queued workers to start.

## This repo contains two parts:

1. [testswarm-browserstack.js](https://github.com/clarkbox/testswarm-browserstack/blob/master/testswarm-browserstack.js) - abstraction of TestSwarm "getNeeded" endpoint, and Scott Gonz�lez's BrowserStack API. Use it to spawn BrowserStack workers required by TestSwarm.
2. [testswarm-browserstack.cli.js](https://github.com/clarkbox/testswarm-browserstack/blob/master/testswarm-browserstack.cli.js) - nodejs CLI interface wrapper around it all. Allows for scripted or easier manual invokation of browsers.

### Dependencies:
* [commander](https://github.com/visionmedia/commander.js)
* [async](https://github.com/caolan/async)
* [node-browserstack](https://github.com/scottgonzalez/node-browserstack)


## testswarm-browserstack.js
--------------------------------------
### run():
* Start the needed workers. If `--kill` option is set, will kill any running workers not needed. be sure to set options first via `testswarm-browserstack.options({...my options...})`.

### getNeeded(callback):
* Returns the TestSwarm [useragent ID's](https://github.com/jquery/testswarm/blob/master/config/useragents.sql)
* parameters:
     * function callback(error, useragnets)
          * error (object) - null if none
          * useragnets (interger array) - JSON array of useragendIDs

### killWorker(workerId):
Kill a single worker. Calls BrowserStack.terminateWorker()
* parameters:
     * workerId (integer) - BrowserStack Worker ID as returned by startWorker 

### killAll()
Kill all workers running on BrowserStack.

### options([options])
Call this first! get/set the options required to run. Passing in an object literal will set the options. calling without arguments will return the current options.
#### Example options:
<pre>
{
    user: 'myUserId',
    pass: 'myPassWurd',
    swarmUrl: 'swarm.jquery.org',
    spawnUrl: 'http://swarm.jquery.org/run',
    verbose: false,
    kill: true,
    clientTimeout: 6000
}
</pre>
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
this is a nodejs CLI interface wrapper around testswarm-browserstack.js. Use --help for all you need to know (see above for usage example):

<pre>
  Usage: testswarm-browserstack.cli.js [options]

  Options:

    -h, --help                 output usage information
    -V, --version              output the version number
    --killAll                  kill all workers now
    --killWorker [workerid]    kill worker
    --getNeeded                return the workers required by TestSwarm
    -k, --kill                 if --run specified, kill workers if they are no longer needed.
    -r, --run                  start up workers required by BrowserStack
    -u, --user [username]      BrowserStack username
    -p, --pass [password]      BrowserStack password
    -s, --swarmUrl [url]       TestSwarm URL of getneeded call
    -w, --spawnUrl [url]       URL that BrowserStack workers will open
    -v, --verbose              print more info
    -t, --clientTimeout [min]  number of minuets to run each client (BrowserStack timeout) DEFAULTS 10min.
</pre>