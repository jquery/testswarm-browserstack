var request = require('request'),
    BrowserStack = require('browserstack'),
    async = require('async'),
    browserMap = require("./testswarm-browserstack.map").map;
var self;

var TestSwarmBrowserStackInteg = {

    options:function (options) {
        if (!options) {
            return self._options;
        }
        self._options = options;
    },

    client:function () {
        if (self._client) {
            return self._client;
        }
        self._client = BrowserStack.createClient({
            username:self.options().user,
            password:self.options().pass
        });
        return self._client;
    },

    /**
     * Get the swarmstate of testswarm (number of active clients and pending runs).
     * @param callback Function
     */
    getSwarmState:function (callback) {
        request.get(self.options().swarmUrl + '/api.php?action=swarmstate', function (error, res, body) {
            var apiData = JSON.parse(body);
            if (apiData) {
                if (apiData.error) {
                    callback(apiData.error);
                    return;
                }
                if (apiData.swarmstate) {
                    callback(null, apiData.swarmstate);
                    return;
                }
            }
            callback({
                code:'unknown',
                info:'Malformed API response'
            });
        });
    },

    /**
     * Get a browserstack worker id based on a browserMap object
     * @param browser Object: Object with property 'name' and 'version' (from browserMap)
     * @param workers Array:
     * @return Number|Boolean: worker id or false
     */
    getWorkerByUaId:function (browser, workers) {
        var i, worker,
            len = workers.length;
        for (i = 0; i < len; i++) {
            worker = workers[i];
            if (worker.browser.name === browser.name && worker.browser.version === browser.version) {
                return worker.id;
            }
        }
        return false;
    },

    startWorker:function (browser, clientTimeout) {
        var client = self.client();
        client.createWorker({
            browser:browser.name,
            version:browser.version,
            url:self.options().swarmRunUrl,
            timeout:clientTimeout
        }, function (err, worker) {
            if (err) {
                console.log('error spawning browser:', browser, err);
            } else {
                console.log('started browser: ', browser, worker);
            }
        });
    },

    /**
     * @param currentWorkers Array: Array of browser objects
     * @param swarmState Object: Info about current state of the testswarm
     */
    updateBrowsers:function (currentWorkers, swarmState) {
        var browserID, stats, worker, killWorker,
            start = [],
            kill = [];

        if (self.options().verbose) {
            console.log('testswarm needs these browsers:\n', swarmState.userAgents);
            console.log('browserstack has these workers:\n', currentWorkers);
        }

        // Figure out what needs started and what needs killed
        for (browserID in browserMap) {
            if (!swarmState.userAgents[browserID]) {
                continue;
            }
            stats = swarmState.userAgents[browserID].stats;
            worker = self.getWorkerByUaId(browserMap[browserID], currentWorkers);
            killWorker = false;
            if (stats.onlineClients === 0 && stats.pendingRuns > 0) {
                start.push(browserMap[browserID]);
                if (worker && self.options().kill) {
                    // There is an active worker but it is not in the swarm. This can
                    // happen if the browser crashed. Kill the old worker.
                    killWorker = true;
                }
            } else if (stats.pendingRuns === 0 && worker && self.options().kill) {
                // Kill workers for browsers that no longer have pending runs
                killWorker = true;
            }

            if (killWorker) {
                kill.push({
                    browser:browserMap[browserID],
                    id:worker
                });
            }
        }

        console.log('workers to kill:', kill);
        kill.forEach(function (worker, i) {
            self.killWorker(worker);
        });

        console.log('browsers to start:', start);
        start.forEach(function (browser, i) {
            self.startWorker(browser, self.options().clientTimeout);
        });
    },

    run:function () {
        var client = self.client();
        async.parallel({
            currentWorkers:function (callback) {
                client.getWorkers(function (err, resp) {
                    if (err) {
                        console.log('Error getting workers', err);
                    }
                    callback(err, resp);
                });
            },
            swarmState:function (callback) {
                self.getSwarmState(function (error, state) {
                    if (state) {
                        callback(null, state);
                    } else {
                        console.log('Getting testswarm state failed:\n', error);
                        // TODO handle err, for now just continue pretending there are no needs
                        // by giving it an empty object.
                        callback(null, {
                            userAgents:{}
                        });
                    }
                });
            }
        }, function (err, results) {
            self.updateBrowsers(results.currentWorkers, results.swarmState);
        });
    },

    killWorker:function (worker) {
        var client = self.client();
        client.terminateWorker(worker.id || worker, function (err) {
            if (err) {
                console.log('could not kill worker', worker);
                return;
            }
            console.log('killed worker', worker);
        });
    },

    killAll:function () {
        var client = self.client();
        client.getWorkers(function (err, workers) {
            if (err) {
                console.log('could not get workers from browserstack');
                return;
            }
            if (!workers || workers.length < 1) {
                console.log('no workers running or queued');
            }
            workers.forEach(function (worker, i) {
                self.killWorker(worker);
            });
        });
    }
};

self = TestSwarmBrowserStackInteg;

module.exports = {
    options:TestSwarmBrowserStackInteg.options,
    getSwarmState:TestSwarmBrowserStackInteg.getSwarmState,
    run:TestSwarmBrowserStackInteg.run,
    killWorker:TestSwarmBrowserStackInteg.killWorker,
    killAll:TestSwarmBrowserStackInteg.killAll
};
