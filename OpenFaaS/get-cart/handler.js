'use strict'

const dbprovider = require('./couchdb');

module.exports = async (event, context) => {
  dbprovider.initialize(process.env.DB_URL, "ecommerce")

  var args = event.body;

  var response = await dbprovider.getDocument(args.user);

  return context.status(200).succeed(response);
}

