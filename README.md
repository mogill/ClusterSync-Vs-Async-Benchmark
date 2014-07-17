# Benchmark of Node.js Cluster Execution versus Asynchronous Execution

Asynchronous event-driven programming is at the heart of Node.js, however
it is also the root cause of
[Callback Hell](http://callbackhell.com/)
The purpose of asynchronous execution is to overlap computation with communication and I/O,
which can be achieved in other ways.
 

## Description of Benchmark

A rudimentary web server is implemented twice, 
once using cluster with synchronous I/O, and again with the
standard asynchronous only approach. 
A client program generates key-value pairs that are first `PUT` on the server
and then a `GET` is performed to read the results back.

The `PUT` command writes a new file using the key as a filename
at path defined by `config.dataPath`. 
Keys are random lower case strings and the file contents are the value 
of the key-value pair.
The `GET` commands read the file back, 
sort and reduce the data, then return the file.

The benchmark allows the user to specify the number `GETs` per `PUT`, 
the number and length of records to store, 
and the number of times the server should read data from a file 
and do computational work before returning a results to a `GET` request. 
This design is meant capture how web servers access multiple 
services or data sources asynchronously, and then perform some work 
combining that data before returning the results.


### Configuration Parameters

Configuration parameters for both servers and the client are in `config.json`:

```javascript
{
    "dataPath" : "/tmp/Data/",          // Directory the server writes to
    "readsPerWrite" : 3,                // # times to read before writing again
    "valueLen" : 2000,                  // Length of array of values
    "keyLen"   : 10,                    // Length of key's random string
    "nKeys"  : 1000,                    // Number of K-V pairs to generate
    "nServers"   : 2,                   // # Cluster server processes
    "nClients" : 8,                     // # client processes
    "nTimes"   : 30,                    // # times read+work is performed for each request
    "serverHostname" : "192.168.0.197", // Address of server
    "serverPort" : 8100                 // Port to be used/shared
}
```

### Output
Upon completion the client outputs CSV file that can be imported
into a spreadsheet and rendered as a Candlestick Chart.
The timings are in microseconds.

```
PUT/GET, Min, Mean, 101% of Mean, Max
PUT, 69073, 181707.07692307694, 183524.1476923077, 281225
GET, 122383, 202376.12820512822, 204399.8894871795, 295500
PUT, 59430, 185643.23076923078, 187499.66307692308, 282418
GET, 101810, 203075.28205128206, 205106.0348717949, 272983
PUT, 101387, 188798.23076923078, 190686.2130769231, 234446
GET, 111785, 204963.1794871795, 207012.8112820513, 330102
PUT, 50711, 179683.92307692306, 181480.7623076923, 247945
GET, 101580, 206920.66666666666, 208989.87333333332, 300569
PUT, 68411, 167523, 169198.23, 274930
GET, 100823, 210480.76923076922, 212585.5769230769, 313219
PUT, 110468, 202638.46153846153, 204664.84615384616, 341598
GET, 83200, 200546.84615384616, 202552.31461538462, 313419
PUT, 101208, 196143.15384615384, 198104.58538461538, 327109
GET, 90774, 203309.58974358975, 205342.68564102566, 345158
PUT, 94198, 188954.46153846153, 190844.00615384616, 312341
GET, 82319, 207232.23076923078, 209304.5530769231, 291446
```


### Example Results
![ClusterVsAsyncLatency](http://synsem.com/ClusterVsAsyncLatency.png)

Latency of 8 clients concurrently accessing 1 server running on 2 cores. Error bars show the minimum and maximum measured time for an individual operation, the marker indicates the average time to complete an operation.

The cluster server has lower latency than the async server in the average case, and the average case is closer to the minimum latency. Variability of the average operation time is lower for the cluster server. 



## License
This program is published under the revised BSD license.  Other commercial licenses
may be arranged with the author.
