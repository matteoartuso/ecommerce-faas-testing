const dbprovider = require('./couchdb');
const ecommerce = require('./ecommerce');

async function checkout_cart(args){

    dbprovider.initialize(args.hostIP, args.DBName, ecommerce.mergeFunc);

    var cart = await dbprovider.getDocument(args.user);

    //Check if the cart is empty
    if (cart.products.length == 0) {
        return { error: { message: "EMPTY - The cart is empty" } };
    }

    if (cart.products_holded) {
        return { error: { message: "DUE_PAYMENT - You already checked out, complete the payment" } };
    }

    var response, total = 0;
    var sold_products = [];

    for(var cart_product of cart.products){
        do{
            skip = false;
            var store_product = await dbprovider.getDocument(cart_product.id);

            if(store_product.stock < cart_product.quantity){
                response = { error : { message : "Not enough stock, skipping product " + cart_product } };
                skip = true
            }else{
                store_product.stock -= cart_product.quantity;

                response = await dbprovider.editDocument(cart_product.id, store_product);
            }
        }while(!response.ok && !skip)

        if(!skip){
            sold_products.push(cart_product);
            total += cart_product.quantity * store_product.price;
        }
    }

    var invoice = {
        _id: 'invoice-' + args.user + '-' + Date.now(),
        type: 'invoice',
        sold_products: sold_products,
        total: total,
        timestamp: Date.now(),
        user: args.user
    }

    dbprovider.addDocument(invoice);

    //Resetting cart
    cart.products = [];
    cart.total = 0;
    cart.products_holded = false;

    dbprovider.editDocument(args.user, cart);

    return { invoice: invoice };
}

exports.main = checkout_cart;