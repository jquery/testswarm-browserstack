#!/opt/local/bin/node
var program = require('commander'),
    tsbs = require('./testswarm-browserstack');

program
    .version('0.0.1')
    .option('--killAll', 'kill all workers now')
    .option('--killWorker [workerid]', 'kill worker', parseInt)
    .option('--getNeeded', 'return the workers required by testswarm')
    .option('-k, --kill', 'if --run specified, kill workers if they are no longer needed.')
    .option('-r, --run', 'start up workers required by browserstack')
    .option('-u, --user [username]', 'browserstack username', '')
    .option('-p, --pass [password]', 'browserstack password', '')
    .option('-s, --swarmUrl [url]', 'testswarm URL of getneeded call', '')
    .option('-w, --spawnUrl [url]', 'URL for browserstack workers to run', '')
    .option('-v, --verbose', 'print more info')
    .option('-t, --clientTimeout [min]', 'number of minuets to run each client (browserstack timeout)', parseInt)
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
    tsbs.getNeeded(function (needed) {
        console.log(needed);
    });
}

if (program.run || program.killWorker || program.killAll) {
    if (!program.pass || !program.user) {
        console.log('please set --user and --pass. stopping.');
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
    if (!program.swarmUrl || !program.spawnUrl) {
        console.log('please set --swarmUrl and --spawnUrl. stopping.');
        return;
    }

    // Set default timeout if not set
    program.clientTimeout = program.clientTimeout || 10;
    // Convert timeout to min
    program.clientTimeout = program.clientTimeout * 60;
    tsbs.run();
}
