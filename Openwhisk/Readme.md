# OpenWhisk
## Installation and configuration

Openwhisk configuration steps

There are differences between this procedure and the one reported on the official documentation. This is due to the fact that following that procedure i encountered several problems related to the Helm version, and also because some changes were made to the official documentation while i was working.

Here i report the step i followed to install Openwhisk.

I use a single-node cluster with minikube v 1.9.0 and helm v3.1.2

```
choco install minikube
choco install kubernetes-helm
```

To avoid compatibility problems with the helm version, you need to use kubernetes 1.15.4

The `-p` param associate the cluster to a profile name. In case of parallel work with other clusters it will be easier to differentiate them. I assign 4GB of memory as suggested in the Openwhisk docs

```
minikube start --kubernetes-version=1.15.4 -p ow --cpus=4 --memory=4096mb
```

After the cluster is available, assign the openwhisk-role to invoker

```
kubectl label nodes --all openwhisk-role=invoker
```

Clone the openwhisk-deploy-kube repo

```
git clone https://github.com/apache/openwhisk-deploy-kube.git
cd openwhisk-deploy-kube
```

Now we need to change some configuration parameters in the file openwhisk-deply-kube/helm/openwhisk/values.yml to allow a higher request rate. Here is possible to edit also all kinds of configuration parameter, for example to deploy the software in production or the connect with an external service. For our purposes is sufficient to increase the max request quota.

```yaml
whisk:
  limits:
      actionsInvokesPerminute: 10000
      actionsInvokesConcurrent: 10000
      triggersFiresPerminute: 10000
      actionsSequenceMaxlength: 50
```

Create a `mycluster.yaml` file and add the IP address of the cluster obtained with `kubectl describe nodes | grep InternalIP` or `minikube profile list` and search for the ow machine IP address

```yaml
whisk:
  ingress:
    type: NodePort
    apiHostName: <Add cluster IP address>
    apiHostPort: 31001

nginx:
  httpsNodePort: 31001
```

Proceed to install the cluster with
```
helm init
helm install owdev ./helm/openwhisk -n openwhisk -f mycluster.yaml
helm install ./helm/openwhisk --namespace=openwhisk --name=owdev -f mycluster.yaml
```

Now the cluster will start to download all the needed images. The process is serialized and the time needed vary from 30 minutes to 1 hour according to your internet connection speed. To check the state of the process, you can use  `kubectl get pods -A`

Personally the cluster is working even if the install-package pods failed, but everything else must be Runnning/Completed.

One possible troubleshooting path is to use `minikube kubectl -- describe pod <pod-name> -n openwhisk` to read the pod log.

Now check that the services are correctly working with
```
minikube kubectl -- get services -o wide -n openwhisk
```

You should see
```
owdev-nginx        NodePort       10.108.133.100   <none>        80:31865/TCP,443:31001/TCP   24d   name=owdev-nginx
```

A get request to the 31001 port should return all the Openwhisk server details. You can now proceed to use the Postman collection or the wsk CLI to interact with the server.


## Use and monitoring

## Notes

I am aware that there is plenty of space for improvement in every aspect, from the documentation to the programming style, so please feel free to contact me for any question or proposal to improve the work. I would be happy to make some useful changes.

For any additional information refer to https://openwhisk.apache.org/documentation.html