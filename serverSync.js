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
var url_module = require("url");

http.createServer(function (request, response) {
    var key = url_module.parse(request.url).query.replace('key=', '');
    switch (request.method) {
    case 'GET':  // Synchronous response generation
        try {
            // If the file exists, read it and return the sorted contents
            var value = fs.readFileSync(config.dataPath + key, 'utf8');
            var sorted = value.split(config.sortSplitString).sort().join('');
            response.writeHead(200, {'Content-Type': 'text/plain'});
            response.end(sorted);
        } catch (err) {
            // Return File Not Found if file hasn't yet been created
            response.writeHead(404, {'Content-Type': 'text/plain'});
            response.end("The file (" + config.dataPath + key + ") does not yet exist.");
        }
        break;
    case 'POST':  // Synchronously append POSTed data to a file
        var postData = '';
        request
            .on('data', function (data) {
                postData += data;
            })
            .on('end', function () {
                try {
                    //  Write or append posted data to a file, return "success" response
                    fs.appendFileSync(config.dataPath + key, postData);
                    response.writeHead(200, {'Content-Type': 'text/plain'});
                    response.end('success');
                }
                catch (err) {
                    //  Return error if unable to create/append to the file
                    response.writeHead(400, {'Content-Type': 'text/plain'});
                    response.end('Error: Unable to write file: ' + err);
                }
            });
        break;
    default:
        response.writeHead(400, {'Content-Type': 'text/plain'});
        response.end("Error: Bad HTTP method: " + request.method);
    }
}).listen(config.serverPort);

console.log('synchronous server is running: PID=', process.pid);
