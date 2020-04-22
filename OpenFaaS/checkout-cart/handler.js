'use strict'

const dbprovider = require('./couchdb')

module.exports = async (event, context) => {
  var args = event.body;

  dbprovider.initialize(process.env.DB_URL, "ecommerce")

  var cart = await dbprovider.getDocument(args.user);

  //Check if the cart is empty
  if (cart.products.length == 0) {
    return context.status(200).succeed({ error: { message: "EMPTY - The cart is empty" } });
  }

  if (cart.products_holded) {
    return context.status(200).succeed({ error: { message: "DUE_PAYMENT - You already checked out, complete the payment" } });
  }

  var response;
  var holded_products = [];

  for (var cart_product of cart.products) {
    var store_product = await dbprovider.getDocument(cart_product.id);

    if (store_product.stock < cart_product.quantity) {
      //There is not enough stock anymore
      return context.status(200).succeed({
        error: { message: "NOT ENOUGH - There is not enough stock anymore, the product will be removed from the cart" } 
      });
    }

    store_product.stock -= cart_product.quantity;
    store_product.on_hold += cart_product.quantity;

    response = await dbprovider.editDocument(cart_product.id, store_product);

    if (!response.ok) {
      var unhold_responses = [];

      for (var prod of holded_products) {
        do {
          var temp = await dbprovider.getDocument(prod.id);

          temp.stock += prod.quantity;
          temp.on_hold -= prod.quantity;

          var unhold_response = await dbprovider.editDocument(prod.id, temp);
        } while (!unhold_response.ok)

        unhold_responses.push(unhold_response);
      }

      return context.status(200).succeed({
        error: {
          message: "RETRY - Conflict",
          unhold_responses: unhold_responses
        }
      });
    } else {
      holded_products.push(cart_product);
    }
  }

  cart.products_holded = true;

  var response = await dbprovider.editDocument(args.user, cart);

  return context.status(200).succeed(response);
}