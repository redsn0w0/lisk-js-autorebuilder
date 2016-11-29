var tail = require('tail').Tail;
var exec = require('child_process');
var request = require ('request');
var config = require('./config.json');

var log;
var forkString = 'Fork';
var rebuildString = 'Finished sync';
var delegateMonitor = config.delegate;
var alerted = {};
var nodeToUse = '';
var t = new tail("../lisk-test/logs/lisk.log");

var postOptions = {
    uri: 'http://'+ config.node +'/api/delegates/forging/enable',
    method: 'POST',
    json: {
        "secret": ""+ config.secret +""
    }
};

var chooseNode = function() {
    return new Promise(function (resolve, reject) {
        request('http://' + config.node + '/api/peers?state=2&orderBy=height:desc', function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var data = JSON.parse(body);
                nodeToUse = data.peers[0].ip;
                resolve(nodeToUse + ':7000');
            } else {
                reject(error);
            }
        });
    });
};

var enableForging = function() {
    return new Promise(function (resolve, reject) {
        request(postOptions, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                resolve('Forging enabled');
            } else {
                reject(error);
            }
        });
    });
};

// write on a specific log file fork lines and forging enabling
t.watch()
t.on("line", data => {
    log = data;
    if(log.indexOf(forkString) !== -1) {
        console.log("[" + new Date().toString() + "] | Fork line finded in lisk.log\n");
        console.log(data);
    }
    if(log.indexOf(rebuildString) !== -1) {
        console.log("[" + new Date().toString() + "] | Sync finished, enabling forging");
        enableForging().then(function(res) {
            console.log("[" + new Date().toString() + "] | " + res + "\n");
        }, function (err) {
            console.log(err)
        }
    )};
});

// check if I'm delegateMonitor delegate is forging
var checkBlocks = function() {
    // blocks scheduler for alerts
    chooseNode().then(function(res) {
        request('http://' + res + '/api/delegates/?limit=101&offset=0&orderBy=rate:asc', function (error, response, body) {
            // getting all delegates
            if (!error && response.statusCode == 200) {
                delegateList = [];
                var res = JSON.parse(body);
                for (var i = 0; i < res.delegates.length; i++) {
                    // check if the delegate is in monitoring mode
                    if (res.delegates[i].username.indexOf(delegateMonitor)!== -1) {
                        // if is in monitoring add to delegateList var
                        delegateList.push(res.delegates[i]);
                    }
                }
                // checking blocks
                request('http://' + config.node + '/api/blocks?limit=100&orderBy=height:desc', function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        var data = JSON.parse(body);
                        // checking blocks shifting by 100
                        request('http://' + config.node + '/api/blocks?limit=100&offset=100&orderBy=height:desc', function (error, response, body) {
                            if (!error && response.statusCode == 200) {
                                var data2 = JSON.parse(body);
                                data.blocks = data.blocks.concat(data2.blocks);
                                alive = {};
                                for (var i = 0; i < data.blocks.length; i++) {
                                    alive [data.blocks[i].generatorId] = true;
                                }
                                for (var i = 0; i < delegateList.length; i++) {
                                    if (! (delegateList[i].address in alive)) {
                                        alive [delegateList[i].address] = false;
                                        if (! (delegateList[i].address in alerted))
                                        alerted [delegateList[i].address] = 1;
                                        else
                                        alerted [delegateList[i].address] += 1;

                                        if (alerted [delegateList[i].address] == 1 || alerted [delegateList[i].address] % 180 == 0) {
                                            if (delegateList[i].username.indexOf(delegateMonitor)!== -1) {
                                                // if is red rebuild and wait 30 min before rebuilding again
                                                console.log("[" + new Date().toString() + "] | Autorebuild started");
                                                exec.exec('bash ../lisk-test/lisk.sh rebuild -u https://testnet-snapshot.lisknode.io',function (error, stdout, stderr) {
                                                    console.log(stdout);
                                                    if (error !== null) {
                                                        console.log('exec error: ' + error);
                                                    }
                                                });
                                            }
                                        }
                                    } else {
                                        delete alerted [delegateList[i].address];
                                    }
                                }
                            } else {
                                console.log("Something wrong with get blocks API, second step");
                            }
                        });
                    } else {
                        console.log("Something wrong with get blocks API, first step");
                    }
                });
            } else {
                console.log("Something wrong with get delegates");
            }
        });
    }, function (err) {
        console.log(err)
    }
};

// run
checkBlocks ();
setInterval (checkBlocks, 10000);
