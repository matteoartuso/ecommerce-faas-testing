async function list_products(args) {

    const dbprovider = require(args.provider)

    dbprovider.initialize(args.hostIP, args.DBName)
    
    var products = await dbprovider.getView('product');

    return {products : products};
}

exports.main = list_products;