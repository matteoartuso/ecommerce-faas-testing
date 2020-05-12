helm repo add couchdb https://apache.github.io/couchdb-helm

helm install my-couchdb couchdb/couchdb --set allowAdminParty=true --set couchdbConfig.couchdb.uuid="0c66bcffc545495abe2f0a4ce6f4a7a4"

#kubectl exec --namespace default my-couchdb-couchdb-0 -c couchdb -- curl -s http://127.0.0.1:5984/_cluster_setup -X POST -H "Content-Type: application/json" -d '{"action": "finish_cluster"}'