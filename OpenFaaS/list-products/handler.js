'use strict'

const dbprovider = require('./couchdb');

module.exports = async (event, context) => {
  dbprovider.initialize(process.env.DB_URL, "ecommerce")

  var products = await dbprovider.getView('product');

  return context.status(200).succeed({ products: products });
}

