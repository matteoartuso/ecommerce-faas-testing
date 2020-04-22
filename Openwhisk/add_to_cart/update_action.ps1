param([string]$databaseIp = "http://my-couchdb.default:5984")

zip -r add_to_cart.zip *

wsk action update add-to-cart --param hostIP $databaseIp --param DBName "ecommerce" --param provider "./couchdb" --kind nodejs:10 .\add_to_cart.zip -i