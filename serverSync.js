/*-----------------------------------------------------------------------------+
 |  Cluster/Async I/O Benchmark                                Version 0.1.0   |
 +------------------------------------------------+----------------------------+
 |  Copyright 2014, Synthetic Semantics LLC       |       http://synsem.com/   |
 |  Released under the Revised BSD License        |          info@synsem.com   |
 +------------------------------------------------+----------------------------*/
var config = require('./config.json');
var fs = require("fs");
var http = require('http');
var url_module = require("url");
var cluster = require('cluster');


if (cluster.isMaster) {
    for (var i = 0; i < config.nServers; i++)
        cluster.fork();
} else {
    http.createServer(function (request, response) {
        var key = url_module.parse(request.url).query.replace('key=', '');
        switch (request.method) {
            case 'GET':
                var sum = 0;
                var allFiles = "";
                for (var i = 0; i < config.nTimes; i++) {
                    var file = fs.readFileSync(config.dataPath + key, 'utf8');
                    allFiles += file;
                    sum += JSON
                        .parse(file)
                        .sort()
                        .reduce(function (previousValue, currentValue) {
                            return previousValue + currentValue;
                        });
                }
                response.writeHead(200, {'Content-Type': 'text/plain'});
                response.end(sum.toString() + JSON.stringify(allFiles));
                break;
            case 'POST':
                var postData = '';
                request
                    .on('data', function (data) {
                        postData += data;
                    })
                    .on('end', function () {
                        try {
                            fs.writeFileSync(config.dataPath + key, postData);
                        }
                        catch (err) {
                            response.writeHead(400, {'Content-Type': 'text/plain'});
                            response.end('Error: Unable to write file?' + err);
                        }
                        response.writeHead(200, {'Content-Type': 'text/plain'});
                        response.end('post was ok');
                    });
                break;
            default:
                response.writeHead(400, {'Content-Type': 'text/plain'});
                response.end("Error: Bad HTTP method: " + request.method);
        }
    }).listen(config.serverPort);

    console.log('synchronous server is running: PID=', cluster.worker.process.pid);
}