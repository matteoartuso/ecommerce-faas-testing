import http from 'k6/http';
import { check, group, sleep } from 'k6';

// const CLUSTER_0 = 'https://192.168.1.15:31001';
// const CLUSTER_1 = 'https://192.168.1.21:31001';

const CLUSTER_0 = 'http://192.168.1.18:31112';
const CLUSTER_1 = 'http://192.168.1.19:31112';

const CHECKOUT_ATTEMPT_LIMIT = 3;

// const baseUrl = (host, action) => host + '/api/v1/namespaces/guest/actions/' + action + '?blocking=true&result=true';
const baseUrl = (host, action) => host + '/function/' + action + '.openfaas-fn';

export let options = {
    insecureSkipTLSVerify: true,
    iterations : 20,
    vus : 20
    //discardResponseBodies: true
}

function randomString(length) {
    const charset = 'abcdefghijklmnopqrstuvwxyz';
    let res = '';
    while (length--) res += charset[Math.random() * charset.length | 0];
    return res;
}

const params = {
    headers: {
        'Content-Type': 'application/json',
        // 'Authorization': 'Basic MjNiYzQ2YjEtNzFmNi00ZWQ1LThjNTQtODE2YWE0ZjhjNTAyOjEyM3pPM3haQ0xyTU42djJCS0sxZFhZRnBYbFBrY2NPRnFtMTJDZEFzTWdSVTRWck5aOWx5R1ZDR3VNREdJd1A='
    },
    //responseType: 'text'
};

export default function(){

    //--------------------PART 1-----------------------
    //Fetch all products and choose randomly what to buy
    //console.log("User " + user + " - Part 1")

    var user = randomString(6);

    //console.log("User " + user + " started");

    var payload;

    //Get all stored products
    var res = http.post(baseUrl(CLUSTER_0, 'list-products'), payload, params);
    var stored_products = res.json().products.rows;

    //Choose a random number of products to buy [1,5]
    var number_of_products = Math.floor(Math.random() * (stored_products.length)) + 1

    //Select what products to buy and a random quantity
    var products_to_buy = []

    var i;
    for(i=0; i< number_of_products; i++){

        var selected_id = 1 + Math.floor(Math.random() * (stored_products.length))

        products_to_buy.push(
            { product_id : selected_id, 
                quantity : 1 + Math.floor(Math.random() * (stored_products[selected_id - 1].value.stock / 125))//[1,0,8% of the product stock]
            });
    }

    var product_added = false

    //--------------------PART 2-----------------------
    //Add the products to the cart
    //TODO change the cluster where the products are added and check for conflicts
    // console.log("User " + user + " - Part 2")

    var i = 0;

    for(var product of products_to_buy){
        payload = JSON.stringify({
            product_id : product.product_id,
            requested_quantity : product.quantity,
            user : user
        });

        //Calling alternatively the two clusters
        if(i%2 == 0){
            res = http.post(baseUrl(CLUSTER_0, 'add-to-cart'), payload, params);
        }else{
            res = http.post(baseUrl(CLUSTER_1, 'add-to-cart'), payload, params);
        }

        i++;

        var res_body = res.json()

        if(res_body.error){
            console.log("Error while loading cart " + user + ": " + JSON.stringify(res_body));
            return;
        }else{
            // console.log("Added {" + product.product_id + "," + product.quantity + "} to " + user + " cart on cluster " + (i % 2).toString());
            product_added = true;
        }

        sleep(2)
    }

    check(product_added, {
        "Cart loading": (product_added) => product_added == true
    })

    //--------------------PART 3-----------------------
    //Proceeds with the checkout of the cart
    // console.log("User " + user + " - Part 3")

    if(product_added){
        
        payload = JSON.stringify({
            user: user
        })

        //Loop the checkout process until a critical error occurs or 'i' reaches 'CHECKOUT_ATTEMPT_LIMIT'
        var checkout_error = false;
        var retry = false;
        i=0;

        do {
            sleep(3)
            i++;

            res = http.post(baseUrl(CLUSTER_0, 'checkout-cart'), payload, params);

            // console.log(user + " checkout body: " + res.body);

            res_body = res.json();

            if (res_body.error){
                checkout_error = true;
                if (res_body.error.message.includes("RETRY")){
                    retry = true;
                }
                //console.log("Cart " + user + ": " + JSON.stringify(res_body));
            }else{
                retry = false;
                checkout_error = false
            }
        }while(i < CHECKOUT_ATTEMPT_LIMIT && retry)

        if(checkout_error){
            console.log("ERROR Cart " + user + ": " + JSON.stringify(res_body));
            return;
        }else if(i>1){
            console.log(user + " correct checkout on attempt " + i.toString())
        }

        res = http.post(baseUrl(CLUSTER_0, 'confirm-payment'), payload, params);

        // console.log(user + " payment body: " + res.body);

        res_body = res.json()

        if(res_body.error){
            console.log("Error on payment confirmation of " + user);
        }

        check(res.json(), {
            'Payment confirmed': (response) => response.invoice.user && response.invoice.user == user
        })


    }else{
        console.log("Cart " + user + " not completed")
    }
}