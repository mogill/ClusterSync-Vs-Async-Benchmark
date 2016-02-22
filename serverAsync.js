#!/usr/bin/env node
/*-----------------------------------------------------------------------------+
 |  Cluster/Async I/O Benchmark                                Version 1.0.0   |
 +------------------------------------------------+----------------------------+
 |  Copyright 2014, Synthetic Semantics LLC       |       http://synsem.com/   |
 |  Copyright 2015-2016, Jace A Mogill            |        mogill@synsem.com   |
 |  Released under the Revised BSD License        |          info@synsem.com   |
 +------------------------------------------------+----------------------------*/
var config = require('./config.json');
var fs = require("fs");
var http = require('http');
var url_module = require("url");

http.createServer(function (request, response) {
    var key = url_module.parse(request.url).query.replace('key=', '');
    switch (request.method) {
        case 'GET':  // Asynchronous Response Generation
            fs.readFile(config.dataPath + key, 'utf8', function(err, value) {
                if (err) {
                    // Return File Not Found if file hasn't yet been created
                    response.writeHead(404, {'Content-Type': 'text/plain'});
                    response.end("The file (" + config.dataPath + key + ") does not yet exist.");
                } else {
                    // If the file exists, read it and return the sorted contents
                    var sorted = value.split(config.sortSplitString).sort().join('');
                    response.writeHead(200, {'Content-Type': 'text/plain'});
                    response.end(sorted);
                }
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

console.log('synchronous server is running: ', config.serverPort);
