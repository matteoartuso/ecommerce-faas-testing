const redis = require("redis");

var redisDbHost //redis://10.109.154.178:6379

function initialize(host) {
    redisDbHost = host;
}

exports.initialize = initialize

function addDocument(args){

    var param = [];
    var uuid;

    for(let [key,value] of Object.entries(args)){
        if (key != '_id') {
            param.push(key);
            param.push(value);
        }
    }

    if (args._id != null) {
        uuid = '' + args.type + ':' + args._id
    } else {
        return { error : 'Provide an _id field property with a unique id'}
    }

    const client = redis.createClient(redisDbHost);

    var status = client.hmset(uuid, param);

    return { status : status , param_array : param };
}

exports.addDocument = addDocument;

function getDocument(hSetKey){

    const client = redis.createClient(redisDbHost);

    return new Promise((resolve, reject) => {
        client.hgetall(hSetKey, (err,reply) => {
            if(!reply){
                reject(err)
            }else{
                resolve({document : reply});
            }
        })
    });
}

exports.getDocument = getDocument;

function getView(category){
    const client = redis.createClient(redisDbHost);

    return new Promise((resolve, reject) => {
        client.keys('' + category + ":*", (err,reply) => {
            if(err){
                reject(err)
            }else{
                var items = [];

                reply.forEach((key) => {
                    var item = getDocument(key)

                    items.push(item);
                })

                resolve({items : items});
            }
        })
    })
}

exports.getView = getView