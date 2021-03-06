const dbprovider = require('./couchdb')

async function mergeFunc(response) {

    switch (response.type) {
        case 'product':
            var temp, found;
            var i, j;
            var del_response, winner_response;

            do {
                for (var rev of response._conflicts) {
                    //Get the conflicting and deleted document
                    temp = await dbprovider.getDocument(response._id + '?rev=' + rev);

                    //This document is obsolete and will be deleted
                    temp._deleted = true;

                    //Last common opeation still not found
                    var op_to_apply = [];
                    found = false;

                    //For each operation of the conflict
                    for (i = temp.operations.length - 1; i >= 0; i--) {
                        //Search the operation in the winner operations
                        for (j = response.operations.lenght - 1; j >= 0; j--) {
                            if (temp.operations[i].id == response.operations.id) {
                                //Common operation found, stop the search and apply operations
                                found = true;
                                break;
                            }
                        }

                        if (found) {
                            //The common operation has been found, stop searching
                            break;
                        } else {
                            //This operation is different and must be applied
                            op_to_apply.push(temp.operations[i]);
                        }
                    }

                    //For each operation not applied on the winner, do it
                    for (var operation of op_to_apply) {
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

                    //Delete this conflict
                    do {
                        del_response = dbprovider.editDocument(temp._id, temp, false);
                    } while (!del_response.ok)
                }

                //The operations have been applied to the winner, the document will be updated and all the conflicts will be discarded
                response.merged = true;
                //docs.push(response);
                //await dbprovider.bulkUpdate({ docs: docs });


                winner_response = dbprovider.editDocument(response._id, response, false);
            } while (!winner_response.ok)

            winner_response.merged = true;

            return winner_response;

        default:
            return response;
    }
}

exports.mergeFunc = mergeFunc;