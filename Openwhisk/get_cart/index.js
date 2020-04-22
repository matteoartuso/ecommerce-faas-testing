async function list_products(args) {

    const dbprovider = require(args.provider)

    dbprovider.initialize(args.hostIP, args.DBName)

    return await dbprovider.getDocument(args.user)
}

exports.main = list_products;