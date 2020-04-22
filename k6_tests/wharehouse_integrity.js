import http from 'k6/http';
import { check, group, sleep } from 'k6';

//ow0
// const DATABASE_IP = 'http://192.168.1.15:31324';

//of0
const DATABASE_IP = 'http://192.168.1.18:31473/';

export let options = {
    insecureSkipTLSVerify: true,
    iterations: 1,
    vus: 1
    //discardResponseBodies: true
}

const params = {
    headers: {
        'Content-Type': 'application/json',
        //'Authorization': 'Basic MjNiYzQ2YjEtNzFmNi00ZWQ1LThjNTQtODE2YWE0ZjhjNTAyOjEyM3pPM3haQ0xyTU42djJCS0sxZFhZRnBYbFBrY2NPRnFtMTJDZEFzTWdSVTRWck5aOWx5R1ZDR3VNREdJd1A='
    },
    //responseType: 'text'
};

export default function () {

    var payload, i;

    //Fetching all products stock
    var products_stock = [];
    var sold_products = [];
    var products_hold = [];

    var res = http.get(DATABASE_IP + '/ecommerce/_design/myDesignDoc/_view/allProducts?skip=0&reduce=false', payload, params);
    var stored_products = res.json().rows;

    for (i = 0; i < stored_products.length; i++) {
        products_stock[i] = stored_products[i].value.stock;
        products_hold[i] = stored_products[i].value.on_hold;
        sold_products[i] = 0;
    }

    console.log("Stored products: " + products_stock)
    console.log("Holded products: " + products_hold)

    var res = http.get(DATABASE_IP + '/ecommerce/_design/myDesignDoc/_view/invoices?skip=0&reduce=false', payload, params);
    var invoices = res.json().rows;

    for (i = 0; i < invoices.length; i++) {
        for(var product of invoices[i].value.sold_products){
            //FIXME Works only because the id is equal to the index of the array
            sold_products[product.id - 1] += product.quantity;
        }
    }

    console.log("Sold products: " + sold_products)


    var total

    var total_array = [];

    for(i=0;i< products_stock.length;i++){
        total = products_stock[i] + sold_products[i] + products_hold[i]

        total_array.push(total)

        if (total != 5000) {
            console.log("Product " + i.toString() + " not consistent")
        }

        check(total, {
            'Product total correct': (total) => total==5000
        })
    }

    console.log(total_array)
    
}