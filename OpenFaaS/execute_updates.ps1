param([string]$clusterIp)

faas-cli up -f .\add-product.yml --gateway $clusterIp

faas-cli up -f .\add-to-cart.yml --gateway $clusterIp

faas-cli up -f .\add-node.yml --gateway $clusterIp

faas-cli up -f .\checkout-cart.yml --gateway $clusterIp

faas-cli up -f .\get-cart.yml --gateway $clusterIp

faas-cli up -f .\list-products.yml --gateway $clusterIp

faas-cli up -f .\confirm-payment.yml --gateway $clusterIp