'use strict'
const dbprovider = require('./couchdb')

module.exports = async (event, context) => {
  dbprovider.initialize(process.env.DB_URL, "ecommerce")

  //var args = JSON.parse(context);
  var args = event.body;

  var param = {
    _id: args._id,
    type: 'product',
    description: args.description,
    price: args.price,
    stock: args.stock
  }

  var response = await dbprovider.addDocument(param);

  return context.status(200).succeed(response);
}

