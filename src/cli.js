#!/usr/bin/env node
var fs = require('fs'),
	path = require('path'),
	program = require('commander'),
	spawn = require('child_process').spawn,
	tsbs = require('./testswarm-browserstack'),
	util = require('./util'),
	cliConfig,
	config,
	child;

function loadAndParseConfigFile(filePath) {
	return (filePath && fs.existsSync(filePath)) ?
		JSON.parse(fs.readFileSync(path.resolve(filePath), 'utf-8')) :
		false;
}

function confContains(conf, props, prefix) {
	for (var i = 0, len = props.length; i < len; i += 1) {
		if (!conf || conf[props[i]] === undefined) {
			console.log('Configuration file invalid or missing required parameter:', (prefix || '') + props[i]);
			return false;
		}
	}
	return true;
}

function runLoop() {
	if (config.verbose) {
		console.log('Starting run loop...');
	}
	child = spawn('node', [
		__filename,
		'--run',
		'--config', program.config,
		program.verbose ? '--verbose' : '',
		program.dryRun ? '--dry-run' : ''
	]);
	child.stdout.on('data', function (data) {
		process.stdout.write(String(data));
	});
	child.stderr.on('data', function (data) {
		util.log.fatal(String(data).trim());
	});
	child.on('exit', function () {
		if (config.verbose) {
			console.log('Next iteration in ' + program.runLoop + ' seconds...');
		}
		setTimeout(runLoop, program.runLoop * 1000);
	});
}

program
	.version('0.2.0')
	.option('--config [path]', 'path to config file with options (defaults to ./config.json)', './config.json')
	.option('--run', 'Retrieve TestSwarm state and spawn/terminate BrowserStack workers as needed')
	.option('--run-loop <timeout>', 'Execute --run in a non-overlapping loop with set timeout (in seconds) between iterations', Number)
	.option('--ua2bs <id>', 'Get BrowserStack worker template from TestSwarm useragent id ("*" to show all)')
	.option('--worker <id>', 'Get info abuot a specific BrowserStack worker', Number)
	.option('--terminate <id>', 'Terminate a specific BrowserStack worker', Number)
	.option('--terminateAll', 'Terminate all BrowserStack workers')
	.option('--spawn <uaId>', 'Spwawn a BrowserStack worker by swarm useragent id (joining the swarm)')
	.option('-v, --verbose', 'Output debug information (through console.log)')
	.option('--dry, --dry-run', 'Simulate spawning and termination of browserstack workers')
	.parse(process.argv);

if (!program.run && !program.runLoop && !program.ua2bs && !program.worker && !program.terminate && !program.terminateAll && !program.spawn) {
	console.log(program.helpInformation());
	return;
}

// Process configuration

cliConfig = loadAndParseConfigFile(program.config);
if (!cliConfig) {
	console.error('Configuration file missing or invalid.\nSpecify the file path in the --config parameter (defaults to ./config.json, use config-sample.json as template).');
	process.exit(1);
}

tsbs.extendConfig(cliConfig);
tsbs.init(function (tsbs) {

	config = tsbs.getConfig();

	if (program.verbose) {
		config.verbose = true;
	}

	if (program.dryRun) {
		config.browserstack.dryRun = true;
	}


	if (!confContains(config.browserstack, ['user', 'pass'], 'browserstack.')) {
		process.exit(1);
	}


	// Execute actions

	if (program.ua2bs === '*') {
		tsbs.getMap(function (err, map) {
			console.log('[getMap]', err || map);
		});
	} else if (program.ua2bs) {
		tsbs.getBrowserFromUaID(program.ua2bs, function (err, browser) {
			console.log('[getBrowserFromUaID] ' + program.ua2bs, err || browser);
		});
	}

	if (program.worker) {
		tsbs.browserstack.getWorker(program.worker, function (err, worker) {
			if (err) {
				console.error('Could not get worker info from browserstack', err);
				return;
			}
			if (!worker) {
				console.log('No worker info available');
			} else {
				console.log('Worker #' + program.worker + ':\n', worker);
			}
		});
	}

	if (program.terminateAll) {
		tsbs.browserstack.terminateAll(function (err, workers) {
			if (err) {
				console.error('Could not get workers from browserstack');
			}
			if (!workers || workers.length < 1) {
				console.log('No workers running or queued');
			}
		});
	} else if (program.terminate) {
		tsbs.browserstack.terminateWorker({ id: program.terminate });
	}

	if (program.spawn) {
		tsbs.spawnWorkerByUa(program.spawn, function (err) {
			if (err) {
				console.error(err);
			}
		});
	}

	if (program.run || program.runLoop) {
		if (!confContains(config.testswarm, ['root', 'runUrl'], 'testswarm.')) {
			process.exit(1);
		}

		if (program.runLoop) {
			runLoop();
		} else {
			tsbs.run();
		}
	}
});
