[![Build Status](https://github.com/jquery/testswarm-browserstack/actions/workflows/CI.yaml/badge.svg?event=push)](https://github.com/jquery/testswarm-browserstack/actions/workflows/CI.yaml)
[![npm](https://img.shields.io/npm/v/testswarm-browserstack.svg?style=flat)](https://www.npmjs.com/package/testswarm-browserstack)
[![Tested with QUnit](https://img.shields.io/badge/tested_with-qunit-9c3493.svg)](https://qunitjs.com/)

# testswarm-browserstack

This is a lightweight integration layer between [TestSwarm](https://github.com/jquery/testswarm) and [BrowserStack](https://www.browserstack.com/). Use it to spawn BrowserStack workers needed by TestSwarm on demand. It uses [node-browserstack](https://github.com/scottgonzalez/node-browserstack) to abstract the BrowserStack API.

This script is currently compatible with:
* [TestSwarm](https://github.com/jquery/testswarm) v1.0.0 or higher
* [BrowserStack API](https://github.com/browserstack/api) v4

## Install

```bash
git clone https://github.com/clarkbox/testswarm-browserstack.git testswarm-browserstack
cd testswarm-browserstack/
npm install
```


## How to use CLI

```bash
node src/cli.js --run
```

This above command will create and terminate BrowserStack workers as needed according to the information the TestSwarm `swarmstate` API provides. This command should be executed on a regular interval, either via a scheduler (such as crontab) or by letting node do a continuous loop (using the `--run-loop` option). Be sure to do start it from a scheduler still in a way that it will only start it if it isn't running anymore (in case of an exception).

If you plan to run it from a scheduler and keep log files, you're recommended to use the `run-sample.sh` file as a start. It contains the basic cli invocation as a template. Fill in the argument values and adjust the script and log paths. Also, as a reminder that log files can run out of hand quickly, we've provided a sample file to use in `logrotate` (e.g. on Ubuntu). To learn about logrotate, checkout [Ubuntu manpages](http://manpages.ubuntu.com/manpages/hardy/man8/logrotate.8.html) or the [Slicehost tutorial](http://articles.slicehost.com/2010/6/30/understanding-logrotate-on-ubuntu-part-1) on the subject. To install it, copy the file to `logrotate.conf` within this directory, adjust the path and (if you want to) set different settings. Then move it to `/etc/logrotate.d/testswarm-browserstack.conf`.


### Main scripts

1. [testswarm-browserstack.js](https://github.com/clarkbox/testswarm-browserstack/blob/master/src/testswarm-browserstack.js) - Abstraction of TestSwarm API, and Scott González's BrowserStack API. Use it to automatically spawn BrowserStack workers based on your swarm's needs.
1. [cli.js](https://github.com/clarkbox/testswarm-browserstack/blob/master/src/cli.js) - nodejs cli wrapper around it all. Allows for scripted or generally easy manual invocation of the script.


### testswarm-browserstack.js

#### Options documentation:
* `browserstack.user`: BrowserStack username
* `browserstack.pass`: BrowserStack password
* `browserstack.project`: Project name for grouping on BrowserStack Automate dashboard
* `browserstack.workerTimeout`: Maximum lifetime of the worker (in seconds). Use `0` for _indefinitely_ (BrowserStack will terminate the worker after the maximum run time, as of writing that maximum is 30 minutes).
* `browserstack.dryRun`: Enable to only simulate spawning and termination of browserstack workers.
* `browserstack.totalLimit`: Maximum number of simultaneous workers allowed under this BrowserStack account.
* `browserstack.eqLimit`: How many simultaneous workers with the same browser are allowed.
* `testswarm.root`: URL to the root of the TestSwarm installation. Relative to here should be `./index.php` and `./api.php`.
* `testswarm.runUrl`: URL to the TestSwarm run page (including client name), for BrowserStack workers to open. If your swarm is protected with a token, this is the place to enter the token.
* `verbose`: Output debug information (through `console.log`).


#### Example `config.json`:
```json
{
  "browserstack": {
    "user": "example",
    "pass": "*******"
  },
  "testswarm": {
    "root": "http://ci.example.org/testswarm",
    "runUrl": "http://c.example.org/testswarm/run/JohnDoe"
  }
}
```

###  cli.js

This is a nodejs cli wrapper around testswarm-browserstack.js. You can use it independent of testswarm. Use --help to get all the information you need to know (see above for example usage):

```
  Usage: cli.js [options]

  Options:

    -h, --help            output usage information
    -V, --version         output the version number
    --config [path]       path to config file with options (defaults to ./config.json)
    --run                 Retrieve TestSwarm state and spawn/terminate BrowserStack workers as needed
    --run-loop <timeout>  Execute --run in a non-overlapping loop with set timeout (in seconds) between iterations
    --worker <id>         Get info abuot a specific BrowserStack worker
    --spawn <uaId>        Spwawn a BrowserStack worker by swarm useragent id (joining the swarm)
    --terminate <id>      Terminate a specific BrowserStack worker
    --terminateAll        Terminate all BrowserStack workers
    -v, --verbose         Output debug information (through console.log)
    --dry, --dry-run      Simulate spawning and termination of browserstack workers
```
