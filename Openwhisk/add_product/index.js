async function main(args){

    const dbprovider = require(args.provider)

    dbprovider.initialize(args.hostIP, args.DBName)

    var param = {
        _id : args._id,
        type : 'product',
        description : args.description,
        price : args.price,
        stock : args.stock
    }

    var response = await dbprovider.addDocument(param)
    
    return response
}

exports.main = main;