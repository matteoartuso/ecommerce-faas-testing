/**
 * 
 * @param {product_id, requested_quantity, user} args 
 */
async function add_to_cart(args) {

    const dbprovider = require(args.provider)

    dbprovider.initialize(args.hostIP, args.DBName)

    var product_id = args.product_id;
    var requested_quantity = args.requested_quantity;
    
    var product = await dbprovider.getDocument(product_id)
        .catch((error) => {
            return { error: 'Product not found' }
        });

    if (product.error) {
        return product;
    }

    if (product.stock <= requested_quantity){
        return { error : 'Not enough stock' };
    }

    var cart = await dbprovider.getDocument(args.user).catch((error) => error);

    if (cart.message && cart.message.includes('404')) {
        var newCart = {
            type: "cart",
            _id: args.user,
            products: [{ id: product_id, quantity: requested_quantity }],
            total: product.price * requested_quantity,
            products_holded: false
        }

        await dbprovider.addDocument(newCart);

        //Situation 1: Cart do not exists and must be created with the new product added
        //!!!Note we are not returning to the caller but just putting it into the 'cart' variable
        return { status: 'Cart created' };
    }else if (cart._id == args.user){

        if(cart.products_holded){
            //Error: the cart is waiting for the payment to be completed, add a new product would buy a product that is not being held
            return { error : "Can't add products, cart is in the checkout processing phase. Confirm payment or wait for it to end."}
        }

        for(cart_product of cart.products){
            if(cart_product.id == product_id){
                cart_product.quantity += requested_quantity;
                //TODO use editDocument and test
                await dbprovider.addDocument(cart);

                //Situation 2: the product is already in the cart, we can just add the quantity requested and return
                return { status: 'Cart updated' }
            }
        }

        cart.products.push({ id: product_id, quantity: requested_quantity });
        cart.total = cart.total + (product.price * requested_quantity);

        //TODO use editDocument and test
        await dbprovider.addDocument(cart);

        //Situation 3: The product is not present in the cart so we add it and return
        return { status: 'Cart updated' }
    }else{
        return cart;
    }
}

exports.main = add_to_cart;