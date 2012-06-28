# This is an example script that could be run by cron on set interval.
#
node /path/to/testswarm-browserstack/lib/cli.js\
 --swarmUrl "http://swarm.example.org"\
 --swarmRunUrl "http://swarm.example.org/run/swarmuser/"\
 -u "browserstackUser"\
 -p "browserstackPass"\
 --run\
 --kill\
 --verbose\
 >> /srv/swarm.example.org/log/testswarm-browserstack/run.log 2>&1;
