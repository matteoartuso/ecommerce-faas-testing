'use strict'

const dbprovider = require('./couchdb');
const ecommerce = require('./ecommerce');

module.exports = async (event, context) => {
  var args = event.body;

  dbprovider.initialize(process.env.DB_URL, "ecommerce", ecommerce.mergeFunc);

  var cart = await dbprovider.getDocument(args.user);

  //Check if the cart is empty
  if (cart.products.length == 0) {
    return context.status(200).succeed({ error: { message: "EMPTY - The cart is empty" } });
  }

  if (cart.products_holded) {
    return context.status(200).succeed({ error: { message: "DUE_PAYMENT - You already checked out, complete the payment" } });
  }

  var response, op, temp;
  var holded_products = [];

  for (var cart_product of cart.products) {
    var store_product = await dbprovider.getDocument(cart_product.id, false);

    if (store_product.stock < cart_product.quantity) {
      //There is not enough stock anymore
      return context.status(200).succeed({
        error: { message: "NOT ENOUGH - There is not enough stock anymore, the product will be removed from the cart" } 
      });
    }

    store_product.stock -= cart_product.quantity;
    store_product.on_hold += cart_product.quantity;

    //Adding an operation to the product to merge
    op = {
      id: args.user + Date.now() + cart_product.id,
      quantity: cart_product.quantity,
      op: "hold"
    }
    store_product.operations.push(op)

    response = await dbprovider.editDocument(cart_product.id, store_product);

    /*if (!response.ok) {
      var unhold_responses = [];

      for (var operation of holded_products) {
        do {
          temp = await dbprovider.getDocument(operation.prod.id, false);

          temp.stock += operation.prod.quantity;
          temp.on_hold -= operation.prod.quantity;

          for (var prod_op of temp.operations) {
            if (prod_op.id == operation.op.id) {
              prod_op = null;
            }
          }

          var unhold_response = await dbprovider.editDocument(operation.prod.id, temp);
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
      holded_products.push({ prod: cart_product, op: op });
    }*/
  }

  cart.products_holded = true;

  var response = await dbprovider.editDocument(args.user, cart);

  return context.status(200).succeed(response);
}