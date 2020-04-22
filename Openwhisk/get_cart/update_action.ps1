param([string]$databaseIp = "http://my-couchdb.default:5984")

zip -r get_cart.zip *

wsk action update get-cart --param hostIP $databaseIp --param DBName "ecommerce" --param provider "./couchdb" --kind nodejs:10 .\get_cart.zip -i