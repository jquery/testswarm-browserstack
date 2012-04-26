var request = require('request'),
	BrowserStack = require('browserstack'),
	async = require('async');
var self;

var TestSwarmBrowserStackInteg = {

	/**
	 * We need to map the useragent IDs that TestSwarm uses to browser definitions in BrowserStack.
	 * TestSwarm useragents.ini: https://github.com/jquery/testswarm/blob/master/config/useragents.ini
	 * BrowserStack API: https://github.com/browserstack/api , http://api.browserstack.com/1/browsers
	 */
	browserMap: {
		'Chrome': {
			name: 'chrome',
			version: '18.0'
		},
		'Firefox|3|5': {
			name: 'firefox',
			version: '3.5'
		},
		'Firefox|3|6': {
			name: 'firefox',
			version: '3.6'
		},
		'Firefox|4': {
			name: 'firefox',
			version: '4.0'
		},
		'Firefox|5': {
			name: 'firefox',
			version: '5.0'
		},
		'Firefox|6': {
			name: 'firefox',
			version: '6.0'
		},
		'Firefox|7': {
			name: 'firefox',
			version: '7.0'
		},
		'Firefox|8': {
			name: 'firefox',
			version: '8.0'
		},
		'Firefox|9': {
			name: 'firefox',
			version: '9.0'
		},
		'Firefox|10': {
			name: 'firefox',
			version: '10.0'
		},
		'Firefox|11': {
			name: 'firefox',
			version: '11.0'
		},
		'IE|6': {
			name: 'ie',
			version: '6.0'
		},
		'IE|7': {
			name: 'ie',
			version: '7.0'
		},
		'IE|8': {
			name: 'ie',
			version: '8.0'
		},
		'IE|9': {
			name: 'ie',
			version: '9.0'
		},
		'IE|10': {
			name: 'ie',
			version: '10.0'
		},
		'Opera|11|10': {
			name: 'opera',
			version: '11.1'
		},
		'Safari|4': {
			name: 'safari',
			version: '4.0'
		},
		'Safari|5': {
			name: 'safari',
			version: '5.1'
		}
		// TODO: BrowserStack API doesn't support different platforms yet,
		// their API is a little behind on the GUI.
		// 'Android|1|5': {},
		// 'Android|1|6': {},
		// 'Android|2|1': {},
		// 'Android|2|2': {},
		// 'Android|2|3': {},
		// 'Fennec|4': {},
		// 'iPhone|3|2': {},
		// 'iPhone|4|3': {},
		// 'iPhone|5': {},
		// 'iPad|3|2': {},
		// 'iPad|4|3': {},
		// 'iPad|5': {},
		// 'Opera Mobile': {},
		// 'Opera Mini|2': {},
		// 'Palm Web|1': {},
		// 'Palm Web|2': {},
		// 'IEMobile|7': {},
	},

	options: function (options) {
		if (!options) {
			return self._options;
		}
		self._options = options;
	},

	client: function () {
		if (self._client) {
			return self._client;
		}
		self._client = BrowserStack.createClient({
			username: self.options().user,
			password: self.options().pass
		});
		return self._client;
	},

	/**
	 * Get the swarmstate of testswarm (number of active clients and pending runs).
	 * @param callback Function
	 */
	getSwarmState: function (callback) {
		request.get(self.options().swarmUrl + '/api.php?action=swarmstate', function (error, res, body) {
			var uaId, uaStats,
				apiData = JSON.parse(body);
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
				code: 'unknown',
				info: 'Malformed API response'
			});
		});
	},

	/**
	 * Get a browserstack worker id based on a browserMap object
	 * @param browser Object: Object with property 'name' and 'version' (from browserMap)
	 * @param workers Array:
	 * @return Number|Boolean: worker id or false
	 */
	getWorkerByUaId: function (browser, workers) {
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

	startWorker: function (browser, clientTimeout) {
		var client = self.client();
		client.createWorker({
			browser: browser.name,
			version: browser.version,
			url: self.options().swarmRunUrl,
			timeout: clientTimeout
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
	updateBrowsers: function (currentWorkers, swarmState) {
		var browserID, stats, worker, killWorker,
			start = [],
			kill = [];

		if (self.options().verbose) {
			console.log('testswarm needs these browsers:\n', swarmState.userAgents);
			console.log('browserstack has these workers:\n', currentWorkers);
		}

		// Figure out what needs started and what needs killed
		for (browserID in self.browserMap) {
			if (!swarmState.userAgents[browserID]) {
				continue;
			}
			stats = swarmState.userAgents[browserID].stats;
			worker = self.getWorkerByUaId(self.browserMap[browserID], currentWorkers);
			killWorker = false;
			if (stats.onlineClients === 0 && stats.pendingRuns > 0) {
				start.push(self.browserMap[browserID]);
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
					browser: self.browserMap[browserID],
					id: worker
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

	run: function () {
		var client = self.client();
		async.parallel({
			currentWorkers: function (callback) {
				client.getWorkers(function (err, resp) {
					if (err) {
						console.log('Error getting workers', err);
					}
					callback(err, resp);
				});
			},
			swarmState: function (callback) {
				self.getSwarmState(function (error, state) {
					if (state) {
						callback(null, state);
					} else {
						console.log('Getting testswarm state failed:\n', error);
						// TODO handle err, for now just continue pretending there are no needs
						// by giving it an empty object.
						callback(null, {
							userAgents: {}
						});
					}
				});
			}
		}, function (err, results) {
			self.updateBrowsers(results.currentWorkers, results.swarmState);
		});
	},

	killWorker: function (worker) {
		var client = self.client();
		client.terminateWorker(worker.id || worker, function (err) {
			if (err) {
				console.log('could not kill worker', worker);
				return;
			}
			console.log('killed worker', worker);
		});
	},

	killAll: function () {
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
	options: TestSwarmBrowserStackInteg.options,
	getSwarmState: TestSwarmBrowserStackInteg.getSwarmState,
	run: TestSwarmBrowserStackInteg.run,
	killWorker: TestSwarmBrowserStackInteg.killWorker,
	killAll: TestSwarmBrowserStackInteg.killAll
};
