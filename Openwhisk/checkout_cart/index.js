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

    var response;
    var holded_products = [];
    var edit_responses = [];
    var op;

    for(var cart_product of cart.products){
        var store_product = await dbprovider.getDocument(cart_product.id);

        if(store_product.stock < cart_product.quantity){
            //There is not enough stock anymore
            return { error : { message : "NOT ENOUGH - There is not enough stock anymore, the product will be removed from the cart"}};
        }

        store_product.stock -= cart_product.quantity;
        store_product.on_hold += cart_product.quantity;

        //Adding an operation to the product to merge
        op = {
            id : args.user + Date.now() + cart_product.id,
            quantity : cart_product.quantity,
            op : "hold"
        }
        store_product.operations.push(op)

        response = await dbprovider.editDocument(cart_product.id, store_product, false);

        if(!response.ok){
            var unhold_responses = [];
            
            for(var operation of holded_products){
                do{
                    temp = await dbprovider.getDocument(operation.prod.id);

                    temp.stock += operation.prod.quantity;
                    temp.on_hold -= operation.prod.quantity;

                    for(var index in temp.operations){
                        if(temp.operations[index].id == operation.op.id){
                            delete temp.operations[index];
                        }
                    }

                    var unhold_response = await dbprovider.editDocument(operation.prod.id, temp, false);
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
            edit_responses.push(response);
            holded_products.push({prod : cart_product, op : op});
        }
    }

    cart.products_holded = true;

    response = await dbprovider.editDocument(args.user, cart, false);

    return { responses: edit_responses};
}

exports.main = checkout_cart;