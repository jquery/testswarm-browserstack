# [testswarm-browserstack](http://jquery.com/)
This is a light weight integration layer between [TestSwarm](https://github.com/jquery/testswarm) and [BrowserStack](http://www.browserstack.com/). Use it to spawn BrowserStack workers needed by TestSwarm on demand.

This script is currently compatible with:
* [TestSwarm](https://github.com/jquery/testswarm) 1.0.0-alpha or higher
* [BrowserStack API](https://github.com/browserstack/api) v1


## How to use CLI:
--------------------------------------
<pre>
node lib/cli.js --swarmUrl "http://swarm.example.org" --swarmRunUrl "http://swarm.example.org/run/swarmuser/" -u "browserstackUser" -p "browserstackPass" --run --kill
</pre>

This above command will spawn (via `--run`) AND kill (via `--kill`) BrowserStack workers as indicated by the TestSwarm `swarmstate` API. This command should be executed on a regular interval, via cron or other scheduler - for more short term requirements, see [cli-repeat](https://github.com/clarkbox/cli-repeat) (command line utility to repeat a command at regular interval).

In most cases, the `--kill` option should always accompany the `--run` option. This will ensure workers are not running idle (although eventually browserstack will still terminate idle workers after `clientTimeout`).

If you plan to run it from a scheduler and keep log files, you're recommended to use the `run-sample.sh` file as a start. It contains the basic cli invocation as a template. Fill in the argument values and adjust the script and log paths. Also, as a reminder that log files can run out of hand quickly, we've provided a sample file to use in `logrotate` (e.g. on Ubuntu). To learn about logrotate, checkout [Ubuntu manpages](http://manpages.ubuntu.com/manpages/hardy/man8/logrotate.8.html) or the [Slicehost tutorial](http://articles.slicehost.com/2010/6/30/understanding-logrotate-on-ubuntu-part-1) on the subject. To install it, copy the file to `logrotate.conf` within this directory, adjust the path and (if you want to) set different settings. Then move it to `/etc/logrotate.d/testswarm-browserstack.conf`.


## Main scripts:
--------------------------------------

1. [testswarm-browserstack.js](https://github.com/clarkbox/testswarm-browserstack/blob/master/lib/testswarm-browserstack.js) - Abstraction of TestSwarm API, and Scott González's BrowserStack API. Use it to spawn BrowserStack workers to keep your TestSwarm populated from your own JS code.
1. [cli.js](https://github.com/clarkbox/testswarm-browserstack/blob/master/lib/cli.js) - nodejs CLI interface wrapper around it all. Allows for scripted or easier manual invocation of browsers.


## testswarm-browserstack.js
--------------------------------------

### options([options])
Call this first! get/set the options required to run. Passing in an object literal will set the options. calling without arguments will return the current options.

#### Example options:
<pre>
{
    user: 'myUserId',
    pass: 'myPassWurd',
    swarmUrl: 'http://ci.example.org/testswarm',
    swarmRunUrl: 'http://c.example.org/testswarm/run/_SWARM_USERNAME_',
    verbose: false,
    kill: true,
    clientTimeout: 60
}
</pre>

#### Option Definition:
* user - BrowserStack username
* pass - BrowserStack password
* swarmHost - Hostname of TestSwarm server (without protocol or slash)
* swarmPath - Path on the server to TestSwarm (without trailing slash)
* swarmRunUrl - URL to the TestSwarm run page (including client name), for BrowserStack workers to open
* verbose - Output more debug messages (all output via console.log)
* kill - Kill BrowserStack workers if they are no longer needed
* dryRun - Don't actually execute any browserstack worker "terminate" or "start". Only log what it would do. Intended for debugging or getting statistics.
* stackLimit - How many workers can be running simultaneously in BrowserStack
* clientTimeout - Number of *seconds* to keep the worker online. The maximum supported by BrowserStack is 1800 seconds (30 minutes).

### getSwarmState(callback):
* Get statistics about the TestSwarm, keyed by [browser ID](https://github.com/jquery/testswarm/blob/master/config/useragents.ini)
* parameters:
     * function callback(error, swarmState)
          * error (object|null) - Object with 'code' and 'info' property (TestSwarm API error codes)
          * swarmState (object|undefined) - Swarm state object with all browsers and their pending runs, and active clients.

### run():
* Start the needed workers. If `--kill` option is set, will also kill any running workers that are no longer needed. Be sure to set options first via `testswarm-browserstack.options({...my options...})`.

### killWorker(workerId):
Kill a single worker. Calls BrowserStack.terminateWorker()
* parameters:
     * workerId (integer) - BrowserStack Worker ID as returned by startWorker.

### killAll()
Kill all workers running on BrowserStack.


##  cli.js
--------------------------------------

This is a nodejs CLI interface wrapper around testswarm-browserstack.js. Use --help for all you need to know (see above for usage example):

<pre>
  Usage: cli.js [options]

  Options:

    -h, --help               output usage information
    -V, --version            output the version number
    --killAll                Kill all BrowserStack workers
    --killWorker [workerid]  Kill a BrowserStack worker by its worker ID
    --getNeeded              Shows a list of browser IDs that have pending jobs in TestSwarm
    --kill                   Kill BrowserStack workers if they are no longer needed (Only if --run is also specified)
    --run                    Start new workers in BrowserStack based on the swarm state
    --dryRun                 Use this option in combination with --kill, --run and/or --killAll. Will stop any action from taking place and only report what it would do in reality. Intended for debugging or getting statistics.
    -u, --user [username]    BrowserStack username
    -p, --pass [password]    BrowserStack password
    -v, --verbose            Output more debug messages (all output via console.log)
    --swarmUrl [url]         URL of TestSwarm root (without trailing slash)
    --swarmRunUrl [url]      URL to the TestSwarm run page (including client name), for BrowserStack workers to open
    --stackLimit [workers]   How many workers can be running simultaneously in BrowserStack (default: 4 workers)
    --clientTimeout [min]    Number of minutes to run each client (default: 10 minutes)
</pre>
