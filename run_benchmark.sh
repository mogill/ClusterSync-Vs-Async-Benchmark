#!/bin/bash
# +-----------------------------------------------------------------------------+
# |  Cluster/Async I/O Benchmark                                Version 1.1.0   |
# +------------------------------------------------+----------------------------+
# |  Copyright 2014, Synthetic Semantics LLC       |       http://synsem.com/   |
# |  Copyright 2015-2016, Jace A Mogill            |        mogill@synsem.com   |
# |  Released under the Revised BSD License        |          info@synsem.com   |
# +------------------------------------------------+----------------------------+

configFilename="config.json"
dataPath="/tmp/Data/"
readsPerWrite=30
value="This is text that is appended to the file"
sortSplitString="This is text that is"
nFiles=30
nOperations=200000
serverHostname="localhost"
serverPort=8100


function init_experiment() { 
    killall node
    mkdir -p ${dataPath}
    rm -f ${configFilename} ${dataPath}/*
    cat > ${configFilename} <<EOF
{
  "dataPath" : "${dataPath}",
  "readsPerWrite" : ${readsPerWrite},
  "value" : "${value}",
  "sortSplitString" : "${sortSplitString}",
  "nFiles"  : ${nFiles},
  "nOperations": ${nOperations},
  "nServers" : ${nServers},
  "nClients" : ${nClients},
  "serverHostname" : "${serverHostname}",
  "serverPort" : ${serverPort}
}
EOF
}


#################################################
#   Loop Through Experiments
#
#  Order of experiments is chosen to reduce risk of running out of sockets.
#  

rm -f runlog.*

for nClients in 32 1 8 16 4 2 ; do
    # Synchronous Server
    for nServers in 24 1 2 16 4 8 ; do
        init_experiment
        node serverSync.js ${nServers} &
        (time node client) 2>&1 | tee runlog.sync.nServers.${nServers}.nClients.${nClients}
    done

    # Aynchronous Server
    nServers=1
    init_experiment
    node serverAsync.js &
    (time node client) 2>&1 | tee runlog.async.nServers.${nServers}.nClients.${nClients}
done
