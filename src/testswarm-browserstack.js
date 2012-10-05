var async = require('async'),
	browserstack = require('browserstack'),
	request = require('request'),

	browserMap = require('./map'),
	util = require('./util'),

	config = {
		browserstack: {
			user: undefined,
			pass: undefined,
			// Workers auto-terminate after 15 minutes
			// if we're ready before that we'll terminate them.
			// TODO: This is currently rather long, but we don't want to cut
			// it off too soon if tests take long or if there is a backlog
			// (better to use one worker for 30 minutes then to timeout and start
			// new ones all the time). It'd be nice BrowserStack had a ping-system
			// so we can ping to extend the timeout until it hits the max of 30
			// or until it is terminated by this script when no longer needed.
			workerTimeout: 900,
			dryRun: false,
			totalLimit: 10,
			eqLimit: 2
		},
		testswarm: {
			root: undefined,
			runUrl: undefined
		},
		verbose: false
	},
	self,
	bsClient,
	workerToUaId;

require('colors');


/**
 * Terminology:
 *
 * - worker
 *   A (virtual) machine instance at BrowserStack that runs a certain
 *   os and browser. Identified by a numerical ID. Every new a new VM
 *   is spawned, it gets a new unique ID (usually higer than the
 *   previous one).
 *
 * - browser
 *   Description of a worker. To spawn a worker at BrowserStack, the
 *   BrowserStack client is given a browser descriptor. Based on that
 *   a VM is spawned on-demand.
 *
 * - ua
 *   User-Agent identifier (string) as known to TestSwarm.
 *   Is not specific to an actual computer.
 *   ./map.js contains a map between `ua` and `browser`.
 */

self = {
	/**
	 * Set configuration variables
	 * @param {Object} options Overrides keys in config with given values.
	 */
	extendConfig: function (options) {
		if (options) {
			util.extendObject(config, options, /* deep = */ true);
		}
	},

	/**
	 * Get configuration object (by reference)
	 * @return {Object}
	 */
	getConfig: function () {
		return config;
	},

	/**
	 * Create/get the singleton Client instance for BrowserStack.
	 * return {Client}
	 */
	getBsClient: function () {
		// Lazy init
		if (!bsClient) {
			bsClient = browserstack.createClient({
				version: 1,
				username: config.browserstack.user,
				password: config.browserstack.pass
			});
		}
		return bsClient;
	},

	/**
	 * Get the swarmstate of testswarm (number of active clients and pending runs).
	 * @param {Function} callback
	 */
	getSwarmState: function (callback) {
		request.get(config.testswarm.root + '/api.php?action=swarmstate', function (err, res, body) {
			var apiData;
			if (err) {
				callback({
					code: 'node-request',
					info: err
				});
			}
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
				code: 'testswarm-response',
				info: 'Invalid API response'
			});
		});
	},

	/**
	 * @param {Object} worker From Client.getWorkers.
	 * @return {string|undefined} The uaID or undefined.
	 */
	getUaIdFromWorker: function (worker) {
		var key;
		if (!workerToUaId) {
			// Lazy-init
			workerToUaId = util.generateReverseMap(browserMap);
		}

		key = JSON.stringify(worker.browser);

		return workerToUaId[key];
	},

	/**
	 * Spawn a new BrowserStack worker.
	 * @param {Object} browser
	 */
	spawnWorker: function (browser) {
		if (config.browserstack.dryRun) {
			console.log('[spawnWorker] Dry run:'.cyan, browser);
			return;
		}
		var client = self.getBsClient();
		client.createWorker({
			browser: browser.name,
			version: browser.version,
			url: config.testswarm.runUrl,
			timeout: config.browserstack.workerTimeout
		}, function (err, worker) {
			if (err) {
				console.error('[spawnWorker] Error:'.red + ' Browser', browser, err);
				return;
			}
			console.log('[spawnWorker]'.green, browser, worker);
		});
	},

	/**
	 * Spawn a new BrowserStack worker, by uaId.
	 * @param {string} ua
	 */
	spawnWorkerByUa: function (ua) {
		if (browserMap[ua]) {
			self.spawnWorker(browserMap[ua]);
		} else {
			console.error('[spawnWorkerByUa] Error:'.red + ' Unknown uaId: ' + ua);
		}
	},

	/**
	 * @param {number} worker The worker id.
	 */
	terminateWorker: function (worker) {
		if (config.browserstack.dryRun) {
			console.log('[terminateWorker] Dry run:'.cyan + ' Terminate #' + worker);
			return;
		}
		var client = self.getBsClient();
		client.terminateWorker(worker, function (err) {
			if (err) {
				console.error('[terminateWorker] Error:'.red + ' Worker #' + worker + '\n', err);
				return;
			}
			console.log('[terminateWorker]'.yellow + ' Terminated worker #' + worker);
		});
	},

	/**
	 * Main process of the library. This is where we process the swarmstate
	 * and create and terminate workers accordingly.
	 * @param liveWorkers Array: List of workers
	 * @param liveSwarmState Object: Info about current state of the testswarm
	 */
	updateBrowsers: function (liveWorkers, liveSwarmState) {
		var
			uaId,
			ua,
			workerId,
			worker,
			stats,
			result,

			/**
			 * @var {Object}
			 * Keyed by ID, contains:
			 *  - status (queue, running or terminated)
			 *  - browser
			 */
			percWorkers,

			/**
			 * @var {Object}
			 * Keyed by uaId, contains the numer of matching workers.
			 */
			workersByUa,

			/**
			 * @var {Object}
			 * Keyed by uaId, contains:
			 *  onlineClients, activeRuns, pendingRuns.
			 */
			percSwarmStats;

		// Because the creation and termination is done asynchronous, and we
		// want to save http reqests, we are going to make a copy of the live
		// statuses of browserstack and testswarm. This copy is called the
		// "perception", which we'll update based on what we expect/predict the
		// status will be (e.g. we call spawnWorker and then change the status
		// in percWorkers to 'queued').

		// Task 0: Initialize perception.
		// Also, simplify our data and make it easier to access.
		if (config.verbose) {
			console.log('\n== Task 0 ==\n'.white.bold);
		}

		percSwarmStats = {};
		percWorkers = {};
		workersByUa = {};

		for (ua in liveSwarmState.userAgents) {
			if (browserMap[ua]) {
				percSwarmStats[ua] = util.copy(liveSwarmState.userAgents[ua].stats);
				workersByUa[ua] = 0;
			}
		}

		liveWorkers.forEach(function (worker) {
			percWorkers[worker.id] = {
				status: worker.status,
				browser: worker.browser
			};

			uaId = self.getUaIdFromWorker(worker);
			if (uaId) {
				workersByUa[uaId] += 1;
			}
		});

		console.log('Summary:', (function () {
			var ua, summary = {};
			for (ua in workersByUa) {
				if (workersByUa[ua]) {
					summary[ua] = workersByUa[ua];
				}
			}
			return summary;
		}()));
		console.log('Live workers:\n', percWorkers);
		if (config.verbose) {
			console.log('Live swarm state:\n', percSwarmStats, '\n');

			console.log('\n== Task 1 ==\n'.white.bold);
		}

		// Task 1: Terminate no longer needed workers
		// - Workers for browers that have no pending and no active runs
		//   (a job can have 0 pending runs, which means nothing is
		//   waiting for a cliient, but runs that were already distributed may not be
		//   finished yet. Those currently being ran by cleints are the active runs).
		// - Workers for browsers that have 0 online clients in the swarm.
		//   (These are workers of which the browser likely crashed or had issues
		//   joining the swarm).

		for (workerId in percWorkers) {
			worker = percWorkers[workerId];
			uaId = self.getUaIdFromWorker(worker);
			if (!uaId) {
				if (config.verbose) {
					// This worker was either created by a different script or by a another version
					// of this script with different ua map.
					console.log('Found worker for which there is no match in UA map', worker);
				}
				continue;
			}

			stats = percSwarmStats[uaId];

			if (stats.pendingRuns === 0 && stats.activeRuns === 0) {
				if (config.verbose) {
					console.log('No longer needed worker:', {
						worker: worker,
						stats: stats
					});
				}

				self.terminateWorker(workerId);
				worker.status = 'terminated';

				// Update perception
				if (stats.onlineClients > 0) {
					stats.onlineClients -= 1;
				}
				workersByUa[uaId] -= 1;

			// Don't terminate workers stil in the queue that aren't in the swarm yet
			// TODO: This could terminate a worker that just got started (so status
			// isn't 'queue' anymore) but hasn't loaded the browser yet. In the future
			// with event-based testswarm we'll be able to more closely determine this.
			} else if (worker.status === 'running' && stats.onlineClients === 0) {
				if (config.verbose) {
					console.log('Running worker disconnected from the swarm:', {
						worker: worker,
						stats: stats
					});
				}

				self.terminateWorker(workerId);
				worker.status = 'terminated';

				// Update perception
				workersByUa[uaId] -= 1;

			}
		}

		// Task 2: Start workers for browsers with pending tests but 0 online clients
		// and 0 workers (this last bit is important as we don't want to spawn another
		// worker here if there is one queued but not in the swarm yet).
		// Note: This is the only case where we ignore the total limit to use the 'queue'
		// system of browserstack to start all browsers that are needed without question.
		// It also bypasses priority because it is more important to get at least 1 of
		// each online so that they can work asynchronous. And then, in Task 2, we'll
		// fill in extra workers if possible.
		if (config.verbose) {
			console.log('\n== Task 2 ==\n'.white.bold);
		}

		for (ua in percSwarmStats) {
			stats = percSwarmStats[ua];
			if (stats.pendingRuns > 0 && stats.onlineClients === 0 && workersByUa[ua] === 0) {
				self.spawnWorker(browserMap[ua]);

				// Update perception
				stats.onlineClients += 1;
				workersByUa[ua] += 1;
			}
		}

		// Task 3: Compute the neediness of browsers and spawncr the most
		// needed browser. Keep doing so until the available slots are filled.
		if (config.verbose) {
			console.log('\n== Task 3 ==\n'.white.bold);
		}

		function workerTotal() {
			var ua, total = 0;
			for (ua in workersByUa) {
				total += workersByUa[ua];
			}
			return total;
		}

		function getNeediest() {
			var ua, stats, priority, neediest;

			neediest = {
				priority: 0,
				ua: undefined
			};

			for (ua in percSwarmStats) {
				stats = percSwarmStats[ua];
				if (workersByUa[ua] >= config.browserstack.eqLimit) {
					// We've reached the max for this ua.
					priority = 0;
				} else {
					// This is the priority formula.
					// Principle: The more pending runs and the less online clients, the higher the priority.
					// No pending runs? Priority becomes 0 (0 / anything = 0).
					// Note: Don't filter for where onlineClients is 0 (though task 2 already covers those,
					// and `anything / 0 = NaN`, it only does one, we have eqLimit still).
					// Fixed by doing +1 on onlineClients (see also clarkbox/testswarm-browserstack#31).
					priority = stats.pendingRuns / ( stats.onlineClients + 1);
				}
				if (priority > neediest.priority) {
					neediest = {
						priority: priority,
						ua: ua
					};
				}
			}

			return neediest;
		}


		console.log('Status... (workers: ' + workerTotal() + ' / limit: ' + config.browserstack.totalLimit + ')');
		while (workerTotal() < config.browserstack.totalLimit) {
			result = getNeediest();
			if (result.priority <= 0) {
				console.log('Neediness exhausted, done!');
				break;
			} else {
				if (config.verbose) {
					console.log('Most needed:', result);
				}
				self.spawnWorker(browserMap[result.ua]);

				// Update perception
				percSwarmStats[result.ua].onlineClients += 1;
				workersByUa[result.ua] += 1;
			}
			console.log('Looping... (workers: ' + workerTotal() + ' / limit: ' + config.browserstack.totalLimit + ')');
		}

	},

	run: function () {
		async.parallel({
			currentWorkers: function (callback) {
				self.getBsClient().getWorkers(function (err, resp) {
					if (err) {
						console.error('Failed to get list of workers', err);
					}
					callback(err, resp);
				});
			},
			swarmState: function (callback) {
				self.getSwarmState(function (err, state) {
					if (state) {
						callback(null, state);
					} else {
						console.error('Failed to get testswarm state', err);
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

	terminateAll: function () {
		var client = self.getBsClient();
		client.getWorkers(function (err, workers) {
			if (err) {
				console.error('Could not get workers from browserstack');
				return;
			}
			if (!workers || workers.length < 1) {
				console.log('No workers running or queued');
			}
			workers.forEach(function (worker) {
				self.terminateWorker(worker.id);
			});
		});
	},

	getWorker: function (id) {
		var client = self.getBsClient();
		client.getWorker(id, function (err, worker) {
			if (err) {
				console.error('Could not get worker info from browserstack');
				return;
			}
			if (!worker) {
				console.log('No worker info available');
			}
			console.log('Worker #' + id + ':\n', worker);
		});
	}
};


module.exports = self;
