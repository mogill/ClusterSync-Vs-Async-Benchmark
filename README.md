# Benchmark Comparing Asynchronous Execution to Serial Execution in a Parallel Context 

Asynchronous event-driven programming is at the heart of Node.js, however
it is also the root cause of
[Callback Hell](http://callbackhell.com/)
The purpose of asynchronous execution is to overlap computation with communication and I/O,
which can be achieved in other ways.


## Description of Benchmark

A rudimentary web server is implemented twice:
once in the conventional async callback style, and again
with synchronous file I/O, using Node's built-in cluster module to provide
non-blocking concurrency.  A `GET` request to the server returns the contents of the
requested file, `POST`ed data is write-appended to the requested file
at path defined by `config.dataPath`. 

There is one client program that is used to benchmark both server programs.
The client generates `config.readsPerWrite` many `GET` requests for each 
`POST` request, receiving a response for each request before proceeding to the next.
The `config.nFiles` are read or appended to in round-robin order.
The time of each operation is measured and the minimum, maximum,
total execution time, and number of operations are logged.

A `GET` request first reads the file, 
using the string `config.sortSplitString` splits the file's contents into a list, 
sorts that list, concatenates the list into a string, and then returns the sorted results.
Choosing a `config.sortSplitString` not found in the file minimizes the amount
of compute work per request, using a null string (`''`) maximizes the amount of
compute work per request.  


## Running the benchmark

The `config.json` is shared by both sync and async servers and all the client
processes, it specifies all the parameters of the experiment to be performed.

```javascript
{
  "dataPath" : "/tmp/Data/",   // Path to data files
  "readsPerWrite" : 10,        // Number of reads performed for each write operations
  "value" : "This is text that is appended to the file",
  "sortSplitString" : "This is text that is",  // Governs number of elements to be sorted
  "nFiles"  : 30,              // Number of different files
  "nOperations": 10000,        // Total number of read and write operations 
  "nServers" : 5,              // Sync only: number of processes to fork
  "nClients" : 5,              // Number of concurrent client processes making requests
  "serverHostname" : "localhost",
  "serverPort" : 8100
}
```

The server and client are started separately, for example:
```bash
node serverSync.js &   # Start the synchronous server in the background
node client            # Run the experiment
```

### Output
Upon completion the client outputs a CSV file that can be imported
into a spreadsheet and rendered as a Candlestick Chart showing the
range of performance (min and max time for any single request),
as well as the average of all the operations.
The timings are in microseconds.

```
PUT/GET, Min, Mean, 101% of Mean, Max
PUT process 4, 1346.1969604492188, 2441.530764401614, 2465.94607204563, 7250.4439697265625
GET process 4, 1063.0139770507812, 2313.1135800805423, 2336.244715881348, 54835.06396484375
PUT process 2, 1634.1809692382812, 2434.181318010603, 2458.5231311907087, 6623.343017578125
GET process 2, 1221.9420166015625, 2321.444990135, 2344.65944003635, 54996.54602050781
PUT process 1, 1464.7319946289062, 2501.2274880880836, 2526.2397629689644, 23142.98602294922
GET process 1, 1039.89599609375, 2317.8814424991083, 2341.0602569240996, 55010.34503173828
PUT process 3, 1378.7010498046875, 2403.0054156963643, 2427.035469853328, 5370.8470458984375
GET process 3, 1087.3759765625, 2334.550022272125, 2357.895522494846, 54824.252014160156
PUT process 5, 1311.260986328125, 2435.731684087397, 2460.0890009282707, 10563.859985351562
GET process 5, 932.0089721679688, 2321.715999993554, 2344.9331599934894, 54723.63000488281
```

__NOTE__: The _"101% of Mean"_ gives a non-zero width to the mean.
In a Candlestick Chart, the mean is a range, this causes the range (width)
of the mean to be 1% of the total range, making it visible. 


### Example Results
**__Coming Soon__**


## License
This program is published under the revised BSD license.  Other commercial licenses
may be arranged with the author (info@synsem.com).
