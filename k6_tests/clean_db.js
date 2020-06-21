import http from 'k6/http';
import { check } from 'k6';

//ow0
const DATABASE_IP = 'http://192.168.1.25:30007';

//of0
// const DATABASE_IP = 'http://192.168.1.18:31473';

export let options = {
    insecureSkipTLSVerify: true
};

export default function () {

    var params = {
        headers: {
            'Content-Type': 'application/json',
        }
    };

    var payload;

    var response = http.get(DATABASE_IP + '/ecommerce/_design/myDesignDoc/_view/invoices?skip=0&reduce=false', payload, params);
    var invoices = response.json().rows;

    for (var invoice of invoices) {
        response = http.del(DATABASE_IP + '/ecommerce/' + invoice.id + '?rev=' + invoice.value._rev, payload, params);
    }

    response = http.get(DATABASE_IP + '/ecommerce/_design/myDesignDoc/_view/carts?skip=0&reduce=false', payload, params);
    var carts = response.json().rows;

    for(var cart of carts){
        response = http.del(DATABASE_IP + '/ecommerce/' + cart.id + '?rev=' + cart.value._rev, payload, params);
    }

    console.log("Database cleaned")
}