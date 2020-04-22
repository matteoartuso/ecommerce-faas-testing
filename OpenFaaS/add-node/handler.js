'use strict'

const dbprovider = require('./couchdb');

module.exports = async (event, context) => {

  var args = event.body;

  dbprovider.initialize(process.env.DB_URL, '_replicator');

  if(args.action && args.action == 'init'){
    var result = await dbprovider.initReplica();

    return context.status(200).succeed(result);
  }else{
    var result = await dbprovider.replicate(args.targetAddress, args.newNodeAddress, args.replicationFactor, args.replicatedDbName);

    return context.status(200).succeed(result);
  }
}

