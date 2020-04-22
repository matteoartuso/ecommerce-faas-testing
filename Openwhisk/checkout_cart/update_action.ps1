param([string]$databaseIp = "http://my-couchdb.default:5984")

zip -r checkout_cart.zip *

wsk action update checkout-cart --param hostIP $databaseIp --param DBName "ecommerce" --param provider "./couchdb" --kind nodejs:10 .\checkout_cart.zip -i