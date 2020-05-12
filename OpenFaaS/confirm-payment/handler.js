'use strict'

const dbprovider = require('./couchdb');
const ecommerce = require('./ecommerce');

module.exports = async (event, context) => {
  
  var args = event.body;

  dbprovider.initialize(process.env.DB_URL, "ecommerce", ecommerce.mergeFunc);

  var cart = await dbprovider.getDocument(args.user);

  //Checks if producst are holded
  if (!cart.products_holded) {
    return context.status(200).succeed({
      error: "You can't confirm a payment without starting the checkout process - call /checkout_cart"
    });
  }

  var stored_product, response, op;

  //The payment is completed so we remove every holded product in the cart
  for (var cart_product of cart.products) {
    // do {
      stored_product = await dbprovider.getDocument(cart_product.id, true);

      stored_product.on_hold = stored_product.on_hold - cart_product.quantity;

      op = {
        id: args.user + Date.now() + cart_product.id,
        quantity: cart_product.quantity,
        op: "purchase"
      }
      stored_product.operations.push(op)

      response = await dbprovider.addDocument(stored_product);
    // } while (!response.ok)
  }

  //At this point the purchase is completed, generate and invoice and return it
  var invoice = {
    _id: 'invoice-' + args.user + '-' + Date.now(),
    type: 'invoice',
    sold_products: cart.products,
    total: cart.total,
    timestamp: Date.now(),
    user: args.user
  }

  dbprovider.addDocument(invoice);

  //Resetting cart
  cart.products = [];
  cart.total = 0;
  cart.products_holded = false;

  dbprovider.editDocument(args.user, cart);

  return context.status(200).succeed({ invoice: invoice });
}