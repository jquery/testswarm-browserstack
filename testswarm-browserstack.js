var http = require("http"),
    BrowserStack = require("browserstack"),
    async = require("async");
var TestSwarmBrowserStackInteg = {
    //we need to map browser definitions between testswarm and browserstack
    //testswarm useragent id : browserstack definition
    browserMap: {
        1: {name:'chrome', version:'15.0'},
        2: {name:'firefox', version:'3.5'},
        3: {name:'firefox', version:'3.6'},
        4: {name:'firefox', version:'4.0'},
        5: {name:'firefox', version:'5.0'},
        6: {name:'firefox', version:'6.0'},
        7: {name:'firefox', version:'7.0'},
        8: {name:'ie', version:'6.0'},
        9: {name:'ie', version:'7.0'},
        10: {name:'ie', version:'8.0'},
        11: {name:'ie', version:'9.0'},
        12: {name:'ie', version:'10.0'},
        13: {name:'opera', version:'11.1'},
        14: {name:'opera', version:'11.5'},
        15: {name:'safari', version:'4.0'},
        16: {name:'safari', version:'5.0'},
        17: {name:'safari', version:'5.1'},
        35: {name:'firefox', version:'10.0'}
    },
    options: function(options){
        if(!options){
            return self._options;
        }
        self._options = options;
    },
    client: function(){
        if(self._client){
            return self._client;
        }
        self._client = BrowserStack.createClient({
            username: self.options().user,
            password: self.options().pass
        });
        return self._client;
    },
    //retrivies the browsers (testwarm calles these useragent id's) required by testswarm
    getNeeded: function (callback){
        var req = http.request({
            host: self.options().swarmUrl,
            path: '/index.php?state=getneeded',
            method: 'GET'
        }, function(res){
            var resp = "";
            res.setEncoding('utf8');
            res.on('data', function(chunk){
                resp += chunk;
            });
            res.on('end', function(){
                var neededUseragents = JSON.parse(resp);
                callback(null, neededUseragents);
            });
            //TODO handle res.clientError event
        });
        req.end();
    },
    isWorkerStarted: function(browser, workers){
        for(var i=0,len=workers.length;i<len;i++){
            var worker = workers[i];
            if(worker.browser.name === browser.name && worker.browser.version === browser.version){
                return worker.id;
            }
        }
        return false;
    },
    startWorker: function(browser, clientTimeout){
        var client = self.client();
        client.createWorker({
            browser: browser.name,
            version: browser.version,
            url: self.options().spawnUrl,
            timeout: clientTimeout
        }, function(err,worker){
            if(err){
                console.log('error spawning browser:', browser, err);
            }else{
                console.log('started browser: ', browser, worker);
            }
        });
    },
    updateBrowsers: function(currentWorkers, neededWorkers){
        var start = [],
        kill = [];
        if(self.options().verbose){
            console.log('testswarm needs these useragent ids:\n', JSON.stringify(neededWorkers));
            console.log('current browserstack workers:\n', JSON.stringify(currentWorkers));
        }
        //figure out what needs started and what needs killed
        for(i in self.browserMap){
            var isStarted = self.isWorkerStarted(self.browserMap[i], currentWorkers);
            var isNeeded = neededWorkers.indexOf(parseInt(i)) > -1 ? true : false;
            if(isNeeded && isStarted === false){
                start.push(self.browserMap[i]);
            }else if(isStarted && !isNeeded && self.options().kill){
                kill.push({
                    browser: self.browserMap[i],
                    id: isStarted
                });
            }
        }
        console.log('workers to start:', JSON.stringify(start));
        start.forEach(function(browser,i){        
            self.startWorker(browser, self.options().clientTimeout);
        });
        console.log('workers to kill:', JSON.stringify(kill));
        kill.forEach(function(worker,i){
            self.killWorker(worker);
        });
    },
    run: function(){
        var client = self.client();
        async.parallel({
            current: function(callback){
                client.getWorkers(function(err, resp){
                    if(err){
                        console.log('Error getting workers', err);
                    }
                    callback(err, resp);
                });
            },
            needed: function(callback){
                self.getNeeded(function(err, resp){
                    //TODO handle err
                    callback(err, resp);
                });
            }
        },
        function(err, results) {
            //TODO handle err
            self.updateBrowsers(results.current, results.needed);
        });
    },
    killWorker: function(worker){
        var client = self.client();
        client.terminateWorker(worker.id || worker, function(err){
            if(err){
                console.log('could not kill worker', worker);
                return;
            }                
            console.log('killed worker', worker);
        });
    },
    killAll: function(){
        var client = self.client();
        client.getWorkers(function(err, workers){
            if(err){
                console.log('could not get workers from browserstack');
                return;
            }
            if(!workers || workers.length<1){
                console.log('no workers running or queued');
            }
            workers.forEach(function(worker,i){
                self.killWorker(worker);
            });
        });
    }
};
var self = TestSwarmBrowserStackInteg;
module.exports = {
    getNeeded: TestSwarmBrowserStackInteg.getNeeded,
    run: TestSwarmBrowserStackInteg.run,
    killWorker: TestSwarmBrowserStackInteg.killWorker,
    killAll: TestSwarmBrowserStackInteg.killAll,
    options: TestSwarmBrowserStackInteg.options
};
