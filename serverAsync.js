#!/usr/bin/env node
/*-----------------------------------------------------------------------------+
 |  Cluster/Async I/O Benchmark                                Version 2.0.0   |
 +------------------------------------------------+----------------------------+
 |  Copyright 2014, Synthetic Semantics LLC       |       http://synsem.com/   |
 |  Copyright 2015-2017, Jace A Mogill            |        mogill@synsem.com   |
 |  Released under the Revised BSD License        |          info@synsem.com   |
 +------------------------------------------------+----------------------------*/
var config = require('./config.json');
var fs = require("fs");
var http = require('http');
var async = require('async');
var url_module = require("url");

http.createServer(function (request, response) {
    var key = url_module.parse(request.url).query.replace('key=','');
    switch(request.method) {
        case 'GET':
            var asyncTasks = [];
            for (var i = 0; i < config.nTimes; i++) {
                asyncTasks.push(function (cb) {
                    fs.readFile(config.dataPath + key, 'utf8', function (err, data) {
                        if (err) return cb(err);
                        cb(null, JSON
                            .parse(data)
                            .sort()
                            .reduce(function (previousValue, currentValue) {
                                return previousValue + currentValue;
                            }) + data
                        )
                    })
                })
            }
            async.parallel(asyncTasks, function (err, asyncResults) {
                response.writeHead(200, {'Content-Type': 'text/plain'});
                response.end(JSON.stringify(asyncResults));
            });
            break;
        case 'POST':  // Synchronously append POSTed data to a file
            var postData = '';
            request
                .on('data', function (data) {
                    postData += data;
                })
                .on('end', function () {
                    fs.appendFile(config.dataPath + key, postData, function(err) {
                        if (err) {
                            //  Return error if unable to create/append to the file
                            response.writeHead(400, {'Content-Type': 'text/plain'});
                            response.end('Error: Unable to write file: ' + err);
                        } else {
                            //  Write or append posted data to a file, return "success" response
                            response.writeHead(200, {'Content-Type': 'text/plain'});
                            response.end('success');
                        }
                    });
                });
            break;
        default:
            response.writeHead(400, {'Content-Type': 'text/plain'});
            response.end("Error: Bad HTTP method: " + request.method);
    }
}).listen(config.serverPort);

console.log('Asynchronous server is running. PID=', process.pid);
