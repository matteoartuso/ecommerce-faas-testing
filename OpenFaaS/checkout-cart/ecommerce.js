const dbprovider = require('./couchdb')

async function mergeFunc(response){

    switch (response.type) {
        case 'product':
            /*var temp, found;
            var i, j;
            var docs = [];
        
            for (var rev of response._conflicts) {
                //Get the conflicting and deleted document
                temp = await dbprovider.getDocument(response._id + '?rev=' + rev);

                //This document is obsolete and will be deleted
                temp._deleted = true;
                docs.push(temp);

                //Last common opeation still not found
                var op_to_apply = [];
                found = false;

                //For each operation of the conflict
                for(i = temp.operations.length-2; i>=0; i--){
                    //Search the operation in the winner operations
                    for(j=response.operations.lenght-1; j>=0; j--){
                        if(temp.operations[i].id == response.operations.id){
                            //Common operation found, stop the search and apply operations
                            found = true;
                            break;
                        }else{
                            //This operation is different and must be applied
                            op_to_apply.push(temp.operaions[i]);
                        }
                    }

                    if (found) {
                        //The common operation has been found, stop searching
                        break;
                    }
                }

                //For each operation not applied on the winner, do it
                for(var operation of op_to_apply){
                    switch (operation.op) {
                        case "hold":
                            response.stock -= operation.quantity;
                            response.on_hold += operation.quantity;

                            response.operations.push(operation);

                            break;

                        case "purchase":
                            response.on_hold -= operation.quantity;

                            response.operations.push(operation);
                            break;
                    
                        default:
                            break;
                    }
                }
            }

            //The operations have been applied to the winner, the document will be updated and all the conflicts will be discarded
            response.merged = true;
            docs.push(response);
            await dbprovider.bulkUpdate({docs : docs});*/

            return response;

        default:
            return response;
    }
}

exports.mergeFunc = mergeFunc;