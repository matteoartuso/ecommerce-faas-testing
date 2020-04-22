async function confirm_payment(args) {

    const dbprovider = require(args.provider);

    dbprovider.initialize(args.hostIP, args.DBName);

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

            response = await dbprovider.addDocument(stored_product);
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

    dbprovider.addDocument(invoice);

    //Resetting cart
    cart.products = [];
    cart.total = 0;
    cart.products_holded = false;

    dbprovider.editDocument(cart);

    return { invoice: invoice };
}

exports.main = confirm_payment;