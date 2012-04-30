# This is an example script that could be run by cron on set interval.
node ./testswarm-browserstack.cli.js --swarmUrl "http://swarm.jquery.org" --swarmRunUrl "http://swarm.jquery.org/run/swarmuser/" -u "browserstackUser" -p "browserstackPass" --run --kill --clientTimeout 15 -v > ./testswarm-browserstack.run.log;
