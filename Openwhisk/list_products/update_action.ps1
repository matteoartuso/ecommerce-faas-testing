param([string]$databaseIp = "http://my-couchdb.default:5984")

zip -r list_products.zip *

wsk action update list-products --param hostIP $databaseIp --param DBName "ecommerce" --param provider "./couchdb" --kind nodejs:10 .\list_products.zip -i