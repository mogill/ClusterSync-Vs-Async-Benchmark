/*-----------------------------------------------------------------------------+
 |  Cluster/Async I/O Benchmark                                Version 0.1.0   |
 +------------------------------------------------+----------------------------+
 |  Copyright 2014, Synthetic Semantics LLC       |       http://synsem.com/   |
 |  Released under the Revised BSD License        |          info@synsem.com   |
 +------------------------------------------------+----------------------------*/
var config = require('./config.json');
var http = require('http');
var cluster = require('cluster');
var util = require('./util');

function rwLoop(iter) {
    var chimeLen = config.readsPerWrite + 1;
    var chimeN = Math.floor(iter / chimeLen);
    if (chimeN < kvPairs.length) {
        var chimeIter = (iter % chimeLen) - 1;
        // console.log('chimeN', chimeN, 'chimeIter', chimeIter, 'iter', iter);
        if (chimeIter < 0) {
            var kv = kvPairs[chimeN];
            var options = {
                agent: false,
                host: config.serverHostname,
                port: config.serverPort,
                path: '/put?key=' + kv.key,
                method: 'POST'
/*                headers: {
                    'Content-Type': 'text/html',
                    'Content-Length': kv.value.length
                }
                */
            };

            writeTimer.start();
            var req = http.request(options, function (res) {
                var responseString = '';
                res.on('data', function (data) {
                    responseString += data;
                });

                res.on('end', function (reres) {
                    if (responseString != 'post was ok') {
                        console.log('post was not successful?', reres, responseString)
                    } else {
                        writeTimer.stop();
                        rwLoop(iter + 1);
                    }
                });
            });

            req.on('error', function (e) {
                console.log('serverEMSwrite: http request failed');
                process.exit(1);
            });
            req.write(kv.value);
            req.end();
        } else {
            readTimer.start();
            var get = http.get({
//                agent: false,
                host: config.serverHostname,
                port: config.serverPort,
                path: "/get?key=" + kvPairs[chimeN].key
            }, function (res) {
                var responseString = '';
                res.on('data', function (data) {
                    responseString += data;
                });
                res.on('end', function () {
                    readTimer.stop();
                    //console.log('len=', responseString.length);
                    //console.log('iter=', iter, '  key=', kvPairs[chimeN].key, '   len=', responseString.length);
                    rwLoop(iter + 1);
                });
                res.on('error', function (err) {
                    console.log('http get error:', err)
                })
            });
            get.on('error', function (e) {
                console.log("Got error: " + e.message);
            });
            get.end();
        }
    } else {
        //console.log('Write: ', JSON.stringify(writeTimer), '\nRead:  ', JSON.stringify(readTimer));
        var writeMean = writeTimer.elapsed / writeTimer.nCalls;
        var readMean  = readTimer.elapsed / readTimer.nCalls;
        console.log('PUT, ' + writeTimer.min + ', ' + writeMean + ', ' + writeMean*1.01  + ', ' +  writeTimer.max +
                    '\nGET, ' + readTimer.min  + ', ' + readMean + ', ' + readMean*1.01    + ', ' +  readTimer.max );
        cluster.worker.disconnect();
    }
}



if (cluster.isMaster) {
    for (var i = 0; i < config.nClients; i++)   cluster.fork();

    cluster.on('exit', function (worker, code, signal) {
       // console.log('worker ' + worker.process.pid + ' exited');
    });

    console.log('PUT/GET, Min, Mean, 101% of Mean, Max')
} else {
    var genDataTimer = new util.timer();
    var kvPairs = util.generateAllKeys(config, cluster);
    genDataTimer.stop();
    //console.log(genDataTimer);
    //console.log(kvPairs.length, 'keys generated in', util.fmtNumber(genDataTimer.total));

    writeTimer = new util.timer();
    readTimer = new util.timer();
    rwLoop(0);

    //console.log('synchronous client is running: ', cluster.worker.process.pid);
}
