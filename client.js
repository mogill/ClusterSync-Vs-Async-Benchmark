#!/usr/bin/env node
/*-----------------------------------------------------------------------------+
 |  Cluster/Async I/O Benchmark                                Version 1.0.0   |
 +------------------------------------------------+----------------------------+
 |  Copyright 2014, Synthetic Semantics LLC       |       http://synsem.com/   |
 |  Copyright 2015-2016, Jace A Mogill            |        mogill@synsem.com   |
 |  Released under the Revised BSD License        |          info@synsem.com   |
 +------------------------------------------------+----------------------------*/
'use strict';
var fs = require('fs');
var config = require('./config.json');
var http = require('http');
var cluster = require('cluster');

function Timer() {
    this.stop = function () {
        var hrTime = process.hrtime();
        var now = hrTime[0] * 1000000 + hrTime[1] / 1000;
        this.lastLap = now - this.timeStart;
        this.elapsed += this.lastLap;
        this.timeStart = now;
        if (this.lastLap < this.min)  this.min = this.lastLap;
        if (this.lastLap > this.max)  this.max = this.lastLap;
        this.nCalls++;
    };

    this.start = function () {
        var hrTime = process.hrtime();
        this.timeStart = hrTime[0] * 1000000 + hrTime[1] / 1000;
    };

    this.min = 9999999999;
    this.max = 0;
    this.lastLap = 0;
    this.nCalls = 0;
    this.elapsed = 0;
    this.start();
}


function fileN(iterationN) {
    var nChimes = Math.floor(iterationN / config.nFiles);
    return ("00000"+((iterationN - nChimes) % config.nFiles)).slice(-5);
}


function doPost(iterationN, itersRemaining) {
    writeTimer.start();
    var request = http.request({
        agent: false,
        host: config.serverHostname,
        port: config.serverPort,
        path: '/put?key=' + "file" + fileN(iterationN),
        method: 'POST'
    }, function (res) {
        var responseString = '';
        res.on('data', function (data) {
            responseString += data;
        });

        res.on('end', function (result) {
            if (responseString != 'success') {
                console.log('post was not successful?', result, responseString)
            } else {
                writeTimer.stop();
                // console.log('PUT: iter=', iterationN, '  str=', responseString, '   len=', responseString.length);
                rwLoop(iterationN + 1, itersRemaining - 1);
            }
        });
    });

    request.on('error', function (err) {
        console.log('doPost: http request failed:', err);
        process.exit(1);
    });
    request.write(config.value + "(procN = " + process.env.processN +
        "  fileN = " + fileN(iterationN) + "  iterationN = " + iterationN + ")\n");
    request.end();
}


function doGet(iterationN, itersRemaining) {
    readTimer.start();
    var get = http.get({
        host: config.serverHostname,
        port: config.serverPort,
        path: '/get?key=' + "file" + fileN(iterationN)
    }, function (response) {
        var responseString = '';
        response.on('data', function (data) {
            responseString += data;
        });

        response.on('end', function () {
            readTimer.stop();
            // console.log('GET: iter=', iterationN, '  str=', responseString, '   len=', responseString.length);
            rwLoop(iterationN + 1, itersRemaining - 1);
        });

        response.on('error', function (err) {
            console.log('http get error:', err)
        })
    });

    get.on('error', function (e) {
        console.log("Got error: " + e.message);
    });
    get.end();
}


function rwLoop(iterN, itersRemaining) {
    if (itersRemaining > 0) {
        /*
        if (iterN % 500 === 0) {
            console.log("Process " + process.env.processN + " performed iteration " + iterN);
        }
        */
        if (iterN % (config.readsPerWrite + 1) == 0) {
            doPost(iterN, itersRemaining);
        } else {
            doGet(iterN, itersRemaining);
        }
    } else {
        var writeMean = writeTimer.elapsed / writeTimer.nCalls;
        var readMean = readTimer.elapsed / readTimer.nCalls;
        console.log('Process ' + cluster.worker.id + ' PUT, ' + writeTimer.min + ', ' + writeMean + ', ' + writeMean * 1.01 + ', ' + writeTimer.max +
            '\nProcess ' + cluster.worker.id + ' GET, ' + readTimer.min + ', ' + readMean + ', ' + readMean * 1.01 + ', ' + readTimer.max);
        cluster.worker.disconnect();
    }
}


/*
 *
 */
if (cluster.isMaster) {
    try { fs.mkdirSync(config.dataPath); }
    catch(err) { }
    console.log('PUT/GET, Min, Mean, 101% of Mean, Max');
    for (var i = 0; i < config.nClients; i++)
        cluster.fork({'cluster_bench_task':'client', 'processN':i});
    /*
    cluster.on('exit', function (worker, code, signal) {
        // console.log('worker ' + worker.process.pid + ' exited');
    });
    */
} else {
    var writeTimer = new Timer();
    var readTimer = new Timer();
    var itersPerProc = config.nOperations / config.nClients;
    var startIter = itersPerProc * process.env.processN;
    rwLoop(startIter, itersPerProc);
    //console.log('synchronous client is running: ', cluster.worker.process.pid);
}
