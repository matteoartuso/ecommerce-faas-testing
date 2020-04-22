param([string]$databaseIp = "http://my-couchdb.default:5984")

zip -r add_node.zip *

wsk action update add-node --param hostIP $databaseIp --param provider "./couchdb" --kind nodejs:10 .\add_node.zip -i