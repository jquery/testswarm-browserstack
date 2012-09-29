# This is an example script that could be run by cron on a regular interval.
# Be sure to not start it if it is running already (or use --run instead of --run-loop).
# Example:
# */5 * * * * ciuser ( ps aux | grep "testswarm-browserstack/src/cli.js" | grep -v grep || ( /path/to/testswarm-browserstack/run.sh 1>/var/log/testswarm-browserstack/run.log 2>&1 & ) ) > /dev/null
#
node /path/to/testswarm-browserstack/src/cli.js\
 --config "/path/to/testswarm-browserstack/config.json"\
 --run-loop 50\
 >> /var/log/testswarm-browserstack/cli.log 2>&1;
