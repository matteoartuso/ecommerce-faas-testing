# OpenFaas
## Installation
Here i report the step i followed to install OpenFaas.

I use a single-node cluster with minikube v 1.9.0 and helm v3.1.2

```
choco install minikube
choco install kubernetes-helm
```

The `-p` param associate the cluster to a profile name. In case of parallel work with other clusters it will be easier to differentiate them. I assign 4GB of memory as suggested in the Openwhisk docs

```
minikube start -p of 
```
After this step you can easily follow the instructions at [this link](https://docs.openfaas.com/deployment/kubernetes/#b-deploy-with-helm-for-production-most-configurable).

## Notes
I am aware that there is plenty of space for improvement in every aspect, from the documentation to the programming style, so please feel free to contact me for any question or proposal to improve the work. I would be happy to make some useful changes.

For any additional information refer to https://docs.openfaas.com/