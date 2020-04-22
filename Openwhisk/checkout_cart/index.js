const dbprovider = require('./couchdb')

async function checkout_cart(args){

    dbprovider.initialize(args.hostIP, args.DBName);

    var cart = await dbprovider.getDocument(args.user);

    //Check if the cart is empty
    if (cart.products.length == 0) {
        return { error: { message: "EMPTY - The cart is empty" } };
    }

    if (cart.products_holded) {
        return { error: { message: "DUE_PAYMENT - You already checked out, complete the payment" } };
    }

    var response;
    var holded_products = [];

    for(var cart_product of cart.products){
        var store_product = await dbprovider.getDocument(cart_product.id);

        if(store_product.stock < cart_product.quantity){
            //There is not enough stock anymore
            return { error : { message : "NOT ENOUGH - There is not enough stock anymore, the product will be removed from the cart"}};
        }

        store_product.stock -= cart_product.quantity;
        store_product.on_hold += cart_product.quantity;

        response = await dbprovider.editDocument(cart_product.id, store_product);

        if(!response.ok){
            var unhold_responses = [];
            
            for(var prod of holded_products){
                do{
                    temp = await dbprovider.getDocument(prod.id);

                    temp.stock += prod.quantity;
                    temp.on_hold -= prod.quantity;

                    var unhold_response = await dbprovider.editDocument(prod.id, temp);
                }while(!unhold_response.ok)

                unhold_responses.push(unhold_response);
            }

            return {
                error:{
                    message:"RETRY - Conflict",
                    unhold_responses : unhold_responses
                }
            }
        }else{
            holded_products.push(cart_product);
        }
    }

    cart.products_holded = true;

    var response = await dbprovider.editDocument(args.user, cart);

    return response;
}

exports.main = checkout_cart;