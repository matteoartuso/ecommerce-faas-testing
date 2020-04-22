param([string]$clusterIp, [string]$databaseIp = "http://my-couchdb.default:5984")

wsk property set --apihost $clusterIp

Set-Location .\add_product

.\update_action.ps1 -databaseIp $databaseIp

Set-Location ..\add_to_cart

.\update_action.ps1 -databaseIp $databaseIp

Set-Location ..\checkout_cart

.\update_action.ps1 -databaseIp $databaseIp

Set-Location ..\get_cart

.\update_action.ps1 -databaseIp $databaseIp

Set-Location ..\list_products

.\update_action.ps1 -databaseIp $databaseIp

Set-Location ../confirm_payment

./update_action.ps1 -databaseIp $databaseIp

Set-Location ..\add_node

./update_action.ps1 -databaseIp $databaseIp

Set-Location ..