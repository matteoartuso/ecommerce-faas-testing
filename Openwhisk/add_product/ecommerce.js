const dbprovider = require('./couchdb')

async function mergeFunc(response){
    switch (response.type) {
        case 'product':
            var temp, sum_to_hold;

            for (var rev in response._conflicts) {
                temp = await dbprovider.getDocument(response._id + '?rev=' + rev + '&revs_info=true');

                
            }
            break;

        default:
            break;
    }

    return;
}