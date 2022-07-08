var fs = require('fs')
var csv = require('csv-parser')

module.exports.csvReader = (file, callback) => {
    const result = [];
    // callback('test','test')

    fs.createReadStream(file).pipe(csv({}))
        .on('data', (data) => {
            result.push(data)
        })
        .on('end', () => {
            callback(null, result)
        })
        .on('error', () => {
            callback(err, null)
        })
}


// module.exports.removeSvg = {

// }