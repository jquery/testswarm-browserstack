#!/usr/bin/env node
var fs = require('fs'),
	path = require('path'),
	program = require('commander'),
	spawn = require('child_process').spawn,
	tsbs = require('./testswarm-browserstack'),
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
		console.log(
			'\t' + String(data).replace(/\n/g, '\n\t')
		);
	});
	child.stderr.on('data', function (data) {
		console.error(
			'\t' + String(data).replace(/\n/g, '\n\t')
		);
	});
	child.on('exit', function () {
		console.log('Next iteration in ' + program.runLoop + ' seconds...');
		setTimeout(runLoop, program.runLoop * 1000);
	});
}

program
	.version('0.2.0')
	.option('--config [path]', 'path to config file with options (defaults to ./config.json)', './config.json')
	.option('--run', 'Retrieve TestSwarm state and spawn/terminate BrowserStack workers as needed')
	.option('--run-loop <timeout>', 'Execute --run in a non-overlapping loop with set timeout (in seconds) between iterations', Number)
	.option('--worker <id>', 'Get info abuot a specific BrowserStack worker', Number)
	.option('--spawn <uaId>', 'Spwawn a BrowserStack worker by swarm useragent id (joining the swarm)')
	.option('--terminate <id>', 'Terminate a specific BrowserStack worker', Number)
	.option('--terminateAll', 'Terminate all BrowserStack workers')
	.option('-v, --verbose', 'Output debug information (through console.log)')
	.option('--dry, --dry-run', 'Simulate spawning and termination of browserstack workers')
	.parse(process.argv);

if (!program.run && !program.runLoop && !program.worker && !program.spawn && !program.terminate && !program.terminateAll) {
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

if (program.worker) {
	tsbs.getWorker(program.worker);
}

if (program.terminateAll) {
	tsbs.terminateAll();
} else if (program.terminate) {
	tsbs.terminateWorker(program.terminate);
}

if (program.spawn) {
	tsbs.spawnWorkerByUa(program.spawn);
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
