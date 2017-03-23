var async = require('async'),
	browserstack = require('browserstack'),
	request = require('request'),
	_ = require('underscore'),
	mapHelper = require('./mapHelper'),
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
	mapCache;

require('colors');


/**
 * I don't like the way the worker objects come from the
 * API. Split it up so that we have a browser property
 * that matches the one from /browsers for spawn.
 */
function fixWorker(worker) {
	return worker.browser && worker.browser.os && worker || {
		id: worker.id,
		status: worker.status,
		browser: _.defaults(
			_.pick(
				worker,
				'os',
				'os_version',
				// Optional. Mobile has .device, desktop has .browser/.browser_version
				'browser',
				'browser_version',
				'device'
			),
			// FIXME: browserstack-api/v3 has a bug where /browsers has null values
			// but /workers does not, so our hash keys don't match..
			{ browser: null, browser_version: null, device: null }
		)
	};
}

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
	 * Get configuration object (by reference)
	 * @return {Object}
	 */
	getConfig: function () {
		return config;
	},

	browserstack: {

		/**
		 * Create/get the singleton Client instance for BrowserStack.
		 * return {Client}
		 */
		getClient: function () {
			// Lazy init
			if (!bsClient) {
				bsClient = browserstack.createClient({
					version: 4,
					username: config.browserstack.user,
					password: config.browserstack.pass
				});
			}
			return bsClient;
		},

		/**
		 * Get a list of all workers
		 * @param {Function} callback
		 */
		getWorkers: function (callback) {
			self.browserstack.getClient().getWorkers(callback);
		},

		/**
		 * @param {number} worker The worker id.
		 * @param {Function} callback
		 */
		getWorker: function (id, callback) {
			self.browserstack.getClient().getWorker(id, callback);
		},

		/**
		 * @param {Object} worker The worker object.
		 */
		terminateWorker: function (worker) {
			worker = fixWorker(worker);
			if (config.browserstack.dryRun) {
				util.log({
					action: 'terminate',
					browser: worker.browser,
					worker: _.omit(worker, 'browser'),
					dryRun: true
				});
				return;
			}
			var client = self.browserstack.getClient();
			client.terminateWorker(worker.id, function (err) {
				util.log({
					action: 'terminate',
					browser: worker.browser,
					worker: _.omit(worker, 'browser')
				});
				if (err) {
					util.log.warning('Terminating worker failed', { worker: worker, err: err });
				}
			});
		},

		terminateAll: function (callback) {
			var client = self.browserstack.getClient();
			client.getWorkers(function (err, workers) {
				if (err) {
					callback(err);
					return;
				}
				callback(null, workers);
				workers.forEach(function (worker) {
					self.browserstack.terminateWorker(worker);
				});
			});
		},

		/**
		 * Spawn a new BrowserStack worker.
		 * @param {Object} browser
		 */
		spawnWorker: function (browser) {
			if (config.browserstack.dryRun) {
				util.log({
					action: 'spawn',
					browser: browser,
					dryRun: true
				});
				return;
			}
			var client = self.browserstack.getClient(),
				browserSettings = _.extend({
					url: config.testswarm.runUrl,
					timeout: config.browserstack.workerTimeout
				}, browser);

			client.createWorker(browserSettings, function (err, worker) {
				if (err) {
					util.log.warning('Spawn error for browser', { browser: browser, err: err });
					return;
				}
				util.log({
					action: 'spawn',
					browser: browser,
					worker: worker
				});
			});
		}
	},

	testswarm: {
		/**
		 * Get the swarmstate of testswarm (number of active clients and pending runs).
		 * @param {Function} callback
		 */
		getState: function (callback) {
			request.get(config.testswarm.root + '/api.php?action=swarmstate',
				function (err, res, body) {
					var apiData;
					if (err) {
						callback({
							code: 'node-request',
							info: err
						});
						return;
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
				}
			);
		}
	},

	/**
	 * Get map of TestSwarm uaData to BrowserStack worker templates
	 * and vice versa.
	 * @param {Function} callback(err, map): map is always defined and
	 * at least contains a template, so errors can be ignored.
	 */
	getMap: function (callback) {
		var map = {
			uaID2Browser: {},
			browser2UaID: {}
		};
		async.parallel({
			swarmstate: self.testswarm.getState,
			browsers: function (callback) {
				self.browserstack.getClient().getBrowsers(callback);
			}
		}, function (err, results) {
			var userAgents,
				ptsMap,
				foundPrecision, found, uaID, tsUaSpec,
				key;

			/**
			 * @param {Object} bswDesc BrowserStack worker descriptor
			 * @param {string} bswDesc.browser
			 * @param {string} bswDesc.browser_version
			 * @param {string} bswDesc.os
			 * @param {string} bswDesc.os_version
			 * @param {string} bswDesc.device
			 * @param {Object} tsUaSpec TestSwarm User agent requirement
			 * @param {string} tsUaSpec.browserFamily
			 * @param {string} tsUaSpec.browserMajor
			 * @param {string} tsUaSpec.browserMinor
			 * @param {string} tsUaSpec.osFamily
			 * @param {string} tsUaSpec.osMajor
			 * @param {string} tsUaSpec.osMinor
			 * @param {string} tsUaSpec.deviceFamily
			 * @return number
			 */
			function compare(bswDesc, tsUaSpec) {
				var valid, precision, bswUaSpec, parts;

				valid = true;
				precision = 0;

				// Convert bswDesc into a tsUaSpec-like object to aid comparison
				bswUaSpec = {
					browserFamily: bswDesc.browser,
					osFamily: bswDesc.os,
					deviceFamily: bswDesc.device
				};

				// Some os_version fields in BrowserStack API v3 are numbers but not all,
				// e.g. it has an OS entry "opera" which is divided by screen resolution
				// rather than OS version.
				if (/^([0-9]+\.)*[0-9]+$/.test(bswDesc.os_version)) {
					parts = bswDesc.os_version.split('.');
					bswUaSpec.osMajor = parts[0];
					bswUaSpec.osMinor = parts[1];
					bswUaSpec.osPatch = parts[2];
				}
				// Some browserstack workers don't define browser_version.
				if (bswDesc.browser_version) {
					parts = bswDesc.browser_version.split('.');
					bswUaSpec.browserMajor = parts[0];
					bswUaSpec.browserMinor = parts[1];
					bswUaSpec.browserPatch = parts[2];
				}

				_.each(tsUaSpec, function (value, key) {
					var ptsKey, pts;

					// The tsUaSpec also contains empty placeholders, don't compare those.
					// Also skip TestSwarm meta-data like 'displayInfo' (objects, not strings).
					if (!value || typeof value !== 'string') {
						return;
					}

					// If a property from the TestSwarm requirement doesn't exist in the BrowserStack
					// worker description, assume it doesn't match.
					// E.g. If tsUaSpec requires a major+minor version (e.g. "21.1"), but BrowserStack
					// only specifies the major version.
					if (!bswUaSpec[key]) {
						valid = false;
						return;
					}

					// Process wildcards
					// This requires the wildcard to be the last specified segment.
					// "major: 4, minor: 1*" is fine.
					// "major: 4, minor: 1*, patch: 2" is unsupported.
					if (/(Major|Minor|Patch)$/.test(key) && value.substr(-1) === '*') {
						value = value.slice(0, -1);
						bswUaSpec[key] = bswUaSpec[key].substr(0, value.length);
					}

					if (mapHelper[key] && mapHelper[key][value]) {
						value = mapHelper[key][value];
					}

					// Value can either be a string or regular expression (from mapHelper)
					// If it doesn't match here, it is a worker for a different browser.
					if (typeof value === 'string') {
						if (value.toLowerCase() !== bswUaSpec[key].toLowerCase()) {
							valid = false;
							return;
						}
					} else if (typeof value.test === 'function') {
						if (!value.test(bswUaSpec[key])) {
							valid = false;
							return;
						}
					} else {
						valid = false;
						return;
					}

					// Add points for this key
					ptsKey = /^([a-z]+)[A-Z]/.exec(key) || [];
					pts = ptsMap[ptsKey[1]] || 0;

					precision += pts;
				});

				return valid === true ? precision : 0;
			}

			function handleBrowser(bswDesc) {
				var precision = compare(bswDesc, tsUaSpec);

				if (precision) {
					// The map from browser to uaID needs to be done from here instead
					// of afterwards (like for map.uaID2Browser).
					// There can be more than 1 browser template that satisfy a uaID.
					// We only need 1 match to spawn, but we need them all for termination and calculation
					// of neediness ("iOS 5.1" can be an iPhone, iPad etc. "Safari 5.1" can be Win or Mac).
					// Without this, Math.random will decide whether we recognize our own children next run.
					map.browser2UaID[util.getHash(bswDesc)] = uaID;
				}

				if (precision > foundPrecision) {
					found = bswDesc;
					foundPrecision = precision;
				}
			}

			if (err) {
				callback(err, map);
				return;
			}

			userAgents = results.swarmstate.userAgents;

			// browser data: 100 pt
			// os data: 10 pt
			// device data: 1pt
			// asumption: each data set has no more than 9 keys
			ptsMap = {
				browser: 100,
				os: 10,
				device: 1
			};

			for (key in userAgents) {
				foundPrecision = 0;
				found = false;
				uaID = key;
				tsUaSpec = userAgents[uaID].data;
				results.browsers.forEach(handleBrowser);
				map.uaID2Browser[uaID] = found;
			}

			callback(null, map);
		});
	},

	/**
	 * @param {string} uaID: Key in swarmstate useragents.
	 * @return {string|undefined} The browser object or undefined.
	 */
	getBrowserFromUaID: function (uaID) {
		return mapCache.uaID2Browser[uaID];
	},

	/**
	 * @param {Object} worker From Client.getWorkers.
	 * @return {string|undefined} The uaID or undefined.
	 */
	getUaIdFromWorker: function (worker) {
		var key = util.getHash(worker.browser);
		return mapCache.browser2UaID[key];
	},

	/**
	 * Spawn a new BrowserStack worker, by uaId.
	 * @param {string} ua
	 * @param {Function} callback
	 */
	spawnWorkerByUa: function (ua, callback) {
		var tpl = self.getBrowserFromUaID(ua);
		if (tpl) {
			self.browserstack.spawnWorker(tpl);
			callback();
		} else {
			callback('Unknown uaId');
		}
	},

	/**
	 * Main process of the library. This is where we process the swarmstate
	 * and create and terminate workers accordingly.
	 * @param liveWorkers Array: List of workers
	 * @param liveSwarmState Object: Info about current state of the testswarm
	 */
	runInternal: function (liveWorkers, liveSwarmState) {
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
			if (self.getBrowserFromUaID(ua)) {
				percSwarmStats[ua] = util.copy(liveSwarmState.userAgents[ua].stats);
				workersByUa[ua] = 0;
			}
		}

		liveWorkers.forEach(function (worker) {
			percWorkers[worker.id] = fixWorker(worker);

			uaId = self.getUaIdFromWorker(percWorkers[worker.id]);
			if (uaId) {
				workersByUa[uaId] += 1;
			}
		});

		util.log({
			action: 'summary',
			data: (function () {
				var ua, summary = {};
				for (ua in workersByUa) {
					if (workersByUa[ua]) {
						summary[ua] = workersByUa[ua];
					}
				}
				return summary;
			})()
		});
		if (config.verbose) {
			console.log('Live workers:\n', percWorkers, '\n');
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
					util.log.warning('Found worker for which there is no match in UA map', worker);
				}
				continue;
			}

			stats = percSwarmStats[uaId];

			if (stats.pendingRuns === 0 && stats.activeRuns === 0) {
				if (config.verbose) {
					util.log('No longer needed worker:', {
						worker: worker,
						stats: stats
					});
				}

				self.browserstack.terminateWorker(worker);
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
				util.log.warning('Running worker disconnected from the swarm', worker);

				self.browserstack.terminateWorker(worker);
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
		// each online so that they can work asynchronous. And then, in Task 3, we'll
		// fill in extra workers if possible.
		if (config.verbose) {
			console.log('\n== Task 2 ==\n'.white.bold);
		}

		for (ua in percSwarmStats) {
			stats = percSwarmStats[ua];
			if (stats.pendingRuns > 0 && stats.onlineClients === 0 && workersByUa[ua] === 0) {
				self.browserstack.spawnWorker(self.getBrowserFromUaID(ua));

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
					priority = stats.pendingRuns / (stats.onlineClients + 1);
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

		util.log({
			action: 'stats',
			workers: workerTotal(),
			limit: config.browserstack.totalLimit
		});
		while (workerTotal() < config.browserstack.totalLimit) {
			result = getNeediest();
			if (result.priority <= 0) {
				util.log({
					action: 'info',
					message: 'Neediness exhausted, done!'
				});
				break;
			} else {
				if (config.verbose) {
					util.log({
						action: 'info',
						message: 'Most needed:',
						info: result
					});
				}
				self.browserstack.spawnWorker(self.getBrowserFromUaID(result.ua));

				// Update perception
				percSwarmStats[result.ua].onlineClients += 1;
				workersByUa[result.ua] += 1;
			}
			util.log({
				action: 'stats',
				workers: workerTotal(),
				limit: config.browserstack.totalLimit
			});
		}

	},

	run: function () {
		async.parallel({
			currentWorkers: function (callback) {
				self.browserstack.getClient().getWorkers(function (err, resp) {
					if (err) {
						util.log.warning('Failed to get list of workers', err);
					}
					callback(err, resp);
				});
			},
			swarmState: function (callback) {
				self.testswarm.getState(function (err, state) {
					if (err) {
						util.log.warning('Failed to get testswarm state', err);
						// TODO handle err, for now just continue pretending there are no needs
						// by giving it an empty object.
						callback(null, {
							userAgents: {}
						});
					} else {
						callback(null, state);
					}
				});
			}
		}, function (err, results) {
			self.runInternal(results.currentWorkers, results.swarmState);
		});
	}
};

module.exports = {
	/**
	 * Set configuration variables
	 * @param {Object} options Overrides keys in config with given values.
	 */
	extendConfig: function (options) {
		if (options) {
			util.extendObject(config, options, /* deep = */ true);
		}
	},

	init: function (callback) {
		async.parallel({
			map: function (callback) {
				self.getMap(callback);
			}
		}, function (err, results) {
			if (err) {
				throw err;
			}
			mapCache = results.map;
			callback(self);
		});
	}
};
