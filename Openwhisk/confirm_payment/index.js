const dbprovider = require('./couchdb');
const ecommerce = require('./ecommerce');

async function confirm_payment(args) {

    dbprovider.initialize(args.hostIP, args.DBName, ecommerce.mergeFunc);

    var cart = await dbprovider.getDocument(args.user);

    //Checks if producst are holded
    if(!cart.products_holded){
        return { error : "You can't confirm a payment without starting the checkout process - call /checkout_cart"}
    }

    var stored_product, response;

    //The payment is completed so we remove every holded product in the cart
    for (var cart_product of cart.products) {
        do{
            stored_product = await dbprovider.getDocument(cart_product.id);

            stored_product.on_hold = stored_product.on_hold - cart_product.quantity;

            op = {
                id: args.user + Date.now() + cart_product.id,
                quantity: cart_product.quantity,
                op: "purchase"
            }
            stored_product.operations.push(op)

            response = await dbprovider.editDocument(cart_product.id, stored_product, false);
        }while(!response.ok)
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

    await dbprovider.addDocument(invoice);

    //Resetting cart
    cart.products = [];
    cart.total = 0;
    cart.products_holded = false;

    await dbprovider.editDocument(args.user, cart);

    return { invoice: invoice };
}

exports.main = confirm_payment;