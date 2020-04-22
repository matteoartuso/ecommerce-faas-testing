async function main(args) {
    const dbprovider = require("./couchdb");

    dbprovider.initialize(args.hostIP, "_replicator");

    return dbprovider.replicate(args.targetAddress, args.newNodeAddress, args.replicationFactor, args.replicatedDbName);
}

exports.main = main;