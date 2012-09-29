# This is an example script that could be run by cron on a regular interval.
#
node /path/to/testswarm-browserstack/src/cli.js\
 --config "/path/to/testswarm-browserstack/config.json"\
 --run-loop\
 >> /var/log/testswarm-browserstack/run.log 2>&1;
