/*-----------------------------------------------------------------------------+
 |  Cluster/Async I/O Benchmark                                Version 0.1.0   |
 +------------------------------------------------+----------------------------+
 |  Copyright 2014, Synthetic Semantics LLC       |       http://synsem.com/   |
 |  Released under the Revised BSD License        |          info@synsem.com   |
 +------------------------------------------------+----------------------------*/

//=====================================================================
//  Timer object that keeps track of min/max/avg/elapsed/total
//
var microtime = require('microtime');
function timer() {
    var self = this;
    this.min   = 9999999999;
    this.max   = 0;
    this.lastLap  = 0;
    this.total = 0;
    this.nCalls       = 0;
    this.elapsed = 0;

    this.timeStart = microtime.now();
    this.timeInitial = this.timeStart;

    this.stop = function () {
        var now = microtime.now();
        this.lastLap = now - this.timeStart;
        this.elapsed += this.lastLap;
        this.total = now - this.timeInitial;
        this.timeStart = now;
        if (this.lastLap < this.min)  this.min = this.lastLap;
        if (this.lastLap > this.max)  this.max = this.lastLap;
        this.nCalls++;
    };

    this.start = function () {
        this.timeStart = microtime.now();
    }
}


function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}




//=====================================================================
//  Random String Generator
//
function generateRandomKey(len) {
    var key = '';
    for(i = 0;  i < len;  i++) {
        key = key.concat(String.fromCharCode(Math.floor(Math.random()*26) + 'a'.charCodeAt()));
    }
    return key;
}


function generateAllKeys(config) {
    var data = [];
    var slug = [];
    var iter;
    for (iter = 0; iter < config.valueLen; iter++)  slug.push(iter);
    for (iter = 0; iter < (config.nKeys / config.nClients); iter++) {
        var tmp = {
            key: generateRandomKey(config.keyLen),
            value: JSON.stringify(slug)
        };
        data.push(tmp);
    }
    return data;
}



//===========================================================================
//  M O D U L E   E X P O R T
//
module.exports = {
    'generateAllKeys' : generateAllKeys,
    'timer' : timer,
    'fmtNumber' : numberWithCommas
};




