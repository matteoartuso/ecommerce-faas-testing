param([string]$databaseIp = "http://my-couchdb.default:5984")

zip -r add_product.zip *

wsk action update add-product --param hostIP $databaseIp --param DBName "ecommerce" --param provider "./couchdb" --kind nodejs:10 .\add_product.zip -i