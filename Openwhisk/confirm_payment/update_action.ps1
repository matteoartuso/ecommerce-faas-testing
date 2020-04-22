param([string]$databaseIp = "http://my-couchdb.default:5984")

zip -r confirm_payment.zip *

wsk action update confirm-payment --param hostIP $databaseIp --param DBName "ecommerce" --param provider "./couchdb" --kind nodejs:10 .\confirm_payment.zip -i