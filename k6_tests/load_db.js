import http from 'k6/http';
import { check } from 'k6';

//ow0
const DATABASE_IP = 'http://192.168.1.25:30007';

//of0
// const DATABASE_IP = 'http://192.168.1.18:31473';

const products = [
    {
        _id: "1",
        description: "Product 1",
        type:"product",
        stock: 5000,
        price: 1400,
        on_hold: 0,
        operations: [
            {
                id: "created",
                quantity: 5000,
                op: "created"
            }
        ]
    },
    {
        _id: "2",
        description: "Product 2",
        type: "product",
        stock: 5000,
        price: 200,
        on_hold: 0,
        operations: [
            {
                id: "created",
                quantity: 5000,
                op: "created"
            }
        ]
    },
    {
        _id: "3",
        description: "Product 3",
        type: "product",
        stock: 5000,
        price: 500,
        on_hold: 0,
        operations: [
            {
                id: "created",
                quantity: 5000,
                op: "created"
            }
        ]
    },
    {
        _id: "4",
        description: "Product 4",
        type: "product",
        stock: 5000,
        price: 25,
        on_hold: 0,
        operations: [
            {
                id: "created",
                quantity: 5000,
                op: "created"
            }
        ]
    },
    {
        _id: "5",
        description: "Product 5",
        type: "product",
        stock: 5000,
        price: 130,
        on_hold: 0,
        operations: [
            {
                id: "created",
                quantity: 5000,
                op: "created"
            }
        ]
    },
    {
        _id: "6",
        description: "Product 6",
        type: "product",
        stock: 5000,
        price: 130,
        on_hold: 0,
        operations: [
            {
                id: "created",
                quantity: 5000,
                op: "created"
            }
        ]
    },
    {
        _id: "7",
        description: "Product 7",
        type: "product",
        stock: 5000,
        price: 130,
        on_hold: 0,
        operations: [
            {
                id: "created",
                quantity: 5000,
                op: "created"
            }
        ]
    },
    {
        _id: "8",
        description: "Product 8",
        type: "product",
        stock: 5000,
        price: 130,
        on_hold: 0,
        operations: [
            {
                id: "created",
                quantity: 5000,
                op: "created"
            }
        ]
    },
    {
        _id: "9",
        description: "Product 9",
        type: "product",
        stock: 5000,
        price: 130,
        on_hold: 0,
        operations: [
            {
                id: "created",
                quantity: 5000,
                op: "created"
            }
        ]
    }
];

export let options = {
    insecureSkipTLSVerify: true
};

export default function () {

    var params = {
        headers: {
            'Content-Type': 'application/json',
        }
    };

    var payload, id, response;

    for (var product of products) {

        console.log("Getting product" + JSON.stringify(product))

        response = http.get(DATABASE_IP + '/ecommerce/' + product._id);

        if (!response.error) {
            product._rev = response.json()._rev;
        }

        id = product._id;
        delete product._id;

        payload = JSON.stringify(product)

        console.log("Updating product" + payload)

        response = http.put(DATABASE_IP + '/ecommerce/' + id, payload, params)

        check(response, {
            'Correct upload': response => response.json().ok == true
        })
    }
}