#!/opt/local/bin/node
var program = require('commander'),
    tsbs = require('./testswarm-browserstack');

program
    .version('0.0.1')
    .option('--killAll', 'Kill all BrowserStack workers')
    .option('--killWorker [workerid]', 'Kill a BrowserStack worker by its worker ID', parseInt)
    .option('--getNeeded', 'Shows a list of browser IDs that have pending jobs in TestSwarm')
    .option('--kill', 'Kill BrowserStack workers if they are no longer needed (Only if --run is also specified)')
    .option('--run', 'Start new workers in BrowserStack based on the swarm state')
    .option('-u, --user [username]', 'BrowserStack username', '')
    .option('-p, --pass [password]', 'BrowserStack password', '')
    .option('-v, --verbose', 'Output more debug messages (all output via console.log)')
    .option('--swarmUrl [url]', 'URL of TestSwarm root (without trailing slash)', '')
    .option('--swarmRunUrl [url]', 'URL to the TestSwarm run page (including client name), for BrowserStack workers to open', '')
    .option('--clientTimeout [min]', 'Number of minutes to run each client (BrowserStack timeout defaults to 10 minutes)', parseInt)
    .parse(process.argv);

if (!process.argv[2]) {
    console.log(program.helpInformation());
    return;
}

tsbs.options(program);

if (program.getNeeded) {
    if (!program.swarmUrl) {
        console.log('please set --swarmUrl. stopping.');
        return;
    }
    tsbs.getSwarmState(function (error, swarmState) {
        var browserID, stats,
            needed = [];
        if (error) {
            console.log('getting swarm state failed:\n', error);
            return;
        }
        for (browserID in swarmState.userAgents) {
            stats = swarmState.userAgents[browserID].stats;
            if (stats.onlineClients === 0 && stats.pendingRuns > 0) {
                needed.push(browserID);
            }
        }
        console.log(needed);
    });
}

if (program.run || program.killWorker || program.killAll) {
    if (!program.pass || !program.user) {
        console.log('please set --user and --pass for browserstack. stopping.');
        return;
    }
}

if (program.killAll) {
    tsbs.killAll(program.killWorker);
}

if (program.killWorker) {
    tsbs.killWorker(program.killWorker);
}

if (program.run) {
    if (!program.swarmUrl || !program.swarmRunUrl) {
        console.log('please set --swarmUrl and --swarmRunUrl. stopping.');
        return;
    }

    // Set default timeout if not set
    program.clientTimeout = program.clientTimeout || 10;
    // Convert timeout to min
    program.clientTimeout = program.clientTimeout * 60;
    tsbs.run();
}
