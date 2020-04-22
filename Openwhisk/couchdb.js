const axios = require('axios').default;

var couchDbHost;
var couchDbDatabase;

var mergeFunction;

/**
 * The initialize function must be called at the beginnig of every action to set 'couchDbHost' and 'couchDbDatabase'
 * 
 * @param {string} host - The IP address of the host where the CouchDB istance is listening in the form http://<address>:<CouchDB port>
 * @param {string} db - The name of the database that will be used for every request
 * @param {Function} mergefun - Function that will be used from the get and edit methods if a conflict is detected
 */
function initialize(host, db, mergeFun) {
    couchDbHost = host;
    couchDbDatabase = db;

    mergeFunction = mergeFun;
}

exports.initialize = initialize;

/**
 * This function will put in the _replicator database the view document needed from a new joining node to obtain all
 * the nodes in the network. The initialize function must be called with 'db' set to '_replicator'
 */
async function initReplica() {

    if (couchDbHost == null || couchDbDatabase == null) {
        return { error: 'The function \'initialize\' must be called at the beginning' }
    }

    var param = {
        _id: "_design/myDesignDoc",
        views: {
            "nodeList": {
                "map": "function (doc) {\n  if(doc._id.includes('node-')){\n    emit(doc._id, doc);\n  }\n}"
            }
        },
        language: "javascript"
    }

    return await addDocument(param);
}

exports.initReplica = initReplica;

/**
 * Adds the node to the network of replicas supported by a node already in the network answering to 'targetAddress'.
 * The database named 'replicatedDbName' will be replicated in a PUSH-PULL configuration on a number of nodes not 
 * greater than 'replicationFactor', if enough nodes are prensent.
 * 
 * No particular policy on how the new nodes are attached is defined.
 * In future multiple replication policy can be implemented.
 * 
 * @param {string} targetAddress 
 * @param {string} newNodeAddress 
 * @param {int} replicationFactor 
 * @param {string} replicatedDbName 
 */
async function replicate(targetAddress, newNodeAddress, replicationFactor, replicatedDbName) {
    //global var 'couchDBDatabase' must be set to '_replicator'

    if (couchDbHost == null || couchDbDatabase == null) {
        return { error: 'The function \'initialize\' must be called at the beginning' }
    }

    //Getting the list of replicas from the chosen target
    //'targetAddress' must be in the form 'http://<targetIP>:<targetPORT>
    var url = targetAddress + '/' + couchDbDatabase + '/_design/myDesignDoc/_view/nodeList?skip=0&limit=2&reduce=false'

    var targetReplicasList = await axios.get(url).then((response) => response.data.rows);

    //FIXME choose a standard for the address format
    var replicasList = [{ target: targetAddress + '/' + replicatedDbName }]

    for (var node of targetReplicasList) {
        replicasList.push(node.value);
    }

    var responses = [];
    var response;

    //For 'replicationFactor' replicas, including the target, add a replication document locally and on the remote node
    var i, random_id;
    var localToTargetDocument, targetToLocalDocument;
    for (i = 0; i < replicationFactor && i < replicasList.length; i++) {
        random_id = 'node-' + await getRandomUuid();

        //Saving local replication document
        localToTargetDocument = {
            source: 'http://localhost:5984/' + replicatedDbName,
            target: replicasList[i].target,
            create_target: true,
            continuous: true
        }

        response = await axios.put('http://my-couchdb.default:5984/' + couchDbDatabase + '/' + random_id, localToTargetDocument)
            .then((response) => response.data)
            .catch((error) => error);

        responses.push(response)

        //We have to truncate the target address because in the _replicator databases they are saved with the replicatedDbName at the end
        var truncateAt = replicasList[i].target.indexOf('/' + replicatedDbName)

        //Saving remote replication document
        targetToLocalDocument = {
            source: 'http://localhost:5984/' + replicatedDbName,
            target: newNodeAddress + '/' + replicatedDbName,
            create_target: true,
            continuous: true
        }

        response = await axios.put(replicasList[i].target.slice(0, truncateAt) + '/' + couchDbDatabase + '/' + random_id, targetToLocalDocument)
            .then((response) => response.data)
            .catch((error) => error);

        responses.push(response)
    }

    return { responses: responses };
}

exports.replicate = replicate;

/**
 * Return a random uuid obtained from the CouchDB functionality
 */
async function getRandomUuid() {

    if (couchDbHost == null || couchDbDatabase == null) {
        return { error: 'The function \'initialize\' must be called at the beginning' }
    }

    return axios.get(couchDbHost + '/_uuids').then((response) => response.data.uuids[0]);
}

/**
 * Create a new document with the fields contained in the args argument. if 'args' contains a parameter called '_id'
 * it will be used as identifier, otherwise a new id will be generated.
 * 
 * @param {*} args Object containing every parameter to include in the document
 */
async function addDocument(args) {

    if (couchDbHost == null || couchDbDatabase == null) {
        return { error: 'The function \'initialize\' must be called at the beginning' }
    }

    if (args.local == null) {
        args.local = false
    }

    if (args._id != null) {
        var uuid = args._id
    } else {
        var uuid = await getRandomUuid();
    }

    delete args._id;

    return await axios.put(couchDbHost + '/' + couchDbDatabase + '/' + uuid, args)
        .then((response) => response.data)
        .catch((error) => error);
}

exports.addDocument = addDocument;

/**
 * 
 * @param {*} id 
 * @param {*} document 
 * @param {*} retry 
 * @param {*} attempt_limit 
 * @param {function} action - function to execute on the document when retrying 
 */
async function editDocument(id, document) {

    if (couchDbHost == null || couchDbDatabase == null) {
        return { error: 'The function \'initialize\' must be called at the beginning' }
    }

    var response = await axios.put(couchDbHost + '/' + couchDbDatabase + '/' + id, document)
        .then((response) => response.data, (error) => error);

    return response;
}

exports.editDocument = editDocument;

/**
 * 
 * @param {*} id 
 * @param {Function} action 
 * @param {*} attempt_limit 
 */
async function editWithRetry(id, action, attempt_limit = 0) {

    if (couchDbHost == null || couchDbDatabase == null) {
        return { error: 'The function \'initialize\' must be called at the beginning' }
    }

    var response;
    var attempt = 0;

    do {
        attempt++;

        var old_document = await getDocument(id);

        new_document = action(old_document)

        response = await axios.put(couchDbHost + '/' + couchDbDatabase + '/' + id, new_document)
            .then((response) => response.data, (error) => error);
    } while ((attempt_limit == 0 || attempt < attempt_limit) && !response.ok)

    return response.data;
}

exports.editWithRetry = editWithRetry;

/**
 * Tries to get a document from the db, if present returns an object like
 * {
 *  "field1": field1,
 *  "field2": field2,
 *   ...
 * }
 * @param str document_id
 */
async function getDocument(document_id, resolveConflict = false) {

    if (couchDbHost == null || couchDbDatabase == null) {
        return { error: 'The function \'initialize\' must be called at the beginning' }
    }

    if (resolveConflict) {
        document_id = document_id + '?conflicts=true';
    }

    var response = await axios.get(couchDbHost + '/' + couchDbDatabase + '/' + document_id)
        .then((response) => response.data)
        .catch((error) => error);

    if (response._conflicts && response._conflicts.length > 0) {
        //Returns the document with the conflicts resolved
        return mergeFunction(response._conflicts);
    } else {
        return response;
    }
}

exports.getDocument = getDocument;

/**
 * 
 * @param {string} designId 
 */
async function getView(designId) {

    if (couchDbHost == null || couchDbDatabase == null) {
        return { error: 'The function \'initialize\' must be called at the beginning' }
    }

    url = couchDbHost + '/' + couchDbDatabase + '/_design/myDesignDoc/_view/' + designId + '?skip=0&limit=21&reduce=false'

    return await axios.get(url).then((response) => response.data);
}

exports.getView = getView;