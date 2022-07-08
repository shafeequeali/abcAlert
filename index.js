const express = require('express')
var cors = require('cors')
var bodyParser = require('body-parser')
const mongoose = require("mongoose");
const application = require("./model");
const csvReaderIndex = require('./csvReader')
// const multer  = require('multer')
const fileUpload = require('express-fileupload')
const alertRoutes = require('./routes/alertRoute')

// const upload = multer({ dest: 'uploads/' })    
const app = express()
const port = 3000

app.use(cors())
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json())
app.use(bodyParser.text({
    type: 'text/plain'
}))
// app.use(fileUpload({
//     limits: {
//         fileSize: 50 * 1024 * 1024
//     },
// }));

app.use('/alert', alertRoutes);
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
let username = 'ali';
let password = 'ali';
let cluster = 'cluster0';
let dbname = 'teamMoplet';
// let url1 = `mongodb+srv://${username}:${password}@${cluster}.mongodb.net/${dbname}?retryWrites=true&w=majority`;
let url2 = `mongodb+srv://ali:ali@cluster0.uxqps.gcp.mongodb.net/${dbname}?retryWrites=true&w=majority`

mongoose.connect(url2, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error: "));
db.once("open", function () {
    console.log("Connected successfully");
});

app.get('/', (req, res) => {
    res.send('hellooo')
})

// app.get('/', (req, res) => {

//     application.find({}).then(data => {
//             res.json({
//                 message: 'Hello World!',
//                 totalDocuments: data
//             })
//         })
//         .catch(err => {
//             res.json({
//                 message: 'Hello World!',
//                 totalDocuments: err
//             })
//         })


// })


// app.post('/', async (req, res) => {
//     const form = new application(req.body);

//     try {
//         const dbres = await form.save();
//         console.log(dbres);
//         res.send(dbres);
//     } catch (error) {
//         res.status(500).send(error);
//     }
// })

// app.post('/bulk_data', (req, res) => {

//     csvReaderIndex.csvReader('sample.csv', (err, result) => {
//         if (err) {
//             console.log({
//                 tag: 'root-post',
//                 err
//             });
//             res.json({
//                 tag: 'root-post',
//                 err
//             })
//         } else {

//             result.forEach(e => {
//                 for (const key in e) {
//                     if (key === 'marks' || key === 'mob_number') {
//                         e[key] = Number.parseInt(e[key])
//                     }
//                 }
//                 // console.log(e);
//             });
//             res.json({
//                 m: 'test-bulk'
//             })

//             // application.create(result).then(data => {
//             //         console.log({
//             //             tag: 'root-post',
//             //             data
//             //         });
//             //         res.json({
//             //             message: 'data successfully loaded',
//             //             data,
//             //         })
//             //     })
//             //     .catch(err => {
//             //         console.log({
//             //             message: 'error occured',
//             //             err
//             //         });
//             //     })

//         }
//     })

// })




// app.post('/file', (req, res) => {

//     const files = req.files;
//     let writeToDb = true; //---for testing
//     // console.log(files);
//     const file = files ? files.file : "nothing";
//     const fileName = file ? file.name : 'nothing';
//     const prsedBody = JSON.parse(req.body.editData);
//     console.log({
//         message: 'file-upload',
//         // files,
//         file: file,
//         fileName,
//         body: req.body.editData,
//         prsedBody: JSON.parse(req.body.editData)
//         // date: Date.now()
//     });
//     if (!writeToDb) {
//         res.json({
//             message: 'file-upload',
//             // files,
//             file: file,
//             fileName,
//             body: req.body,
//         })
//     }


//     if (writeToDb) {
//         let newFileName = Date.now() + '.csv';
//         file.mv('./uploads/' + newFileName, (err) => {
//             if (err) {
//                 console.log(err);
//                 res.json({
//                     err
//                 })
//             } else {
//                 csvReaderIndex.csvReader('./uploads/' + newFileName, (err, result) => {
//                     if (err) {
//                         console.log({
//                             tag: 'root-post',
//                             err
//                         });
//                         res.json({
//                             tag: 'root-post',
//                             err
//                         })
//                     } else {
//                         const changeHeader = prsedBody;
//                         // const changeHeader = {
//                         //     college_name: "myColleage",
//                         //     current_date: "newDate",
//                         //     student_name: "newStudent",
//                         //     marks: 'result',
//                         //     emil_id: "email",
//                         //     place: "from",
//                         //     mob_number: 'mob',
//                         // }
//                         let modiResult = [];
//                         let faultHappen = false;
//                         result.forEach(e => {

//                             let tempObject = {};
//                             for (const key in e) {
//                                 for (const h in changeHeader) {

//                                     if (changeHeader[h] == key) {
//                                         // if (h === 'marks' || h === 'mob_number') {
//                                         //     tempObject[h] = Number.parseInt(e[key])
//                                         // } else {
//                                         //     tempObject[h] = e[key]
//                                         // }
//                                         tempObject[h] = e[key]
//                                     }
//                                 }
//                                 if (!e[key] || e[key] == '') {
//                                     console.log({
//                                         tag: 'line-193 - checking emty field in result',
//                                         e
//                                     });
//                                 }

//                             }
//                             console.log({
//                                 tag: 'from svg reader',
//                                 resultObject: e,
//                                 tempObject
//                             });
//                             modiResult.push(tempObject)
//                             console.log({
//                                 tag: 'from svg reader',
//                                 resultObject: e,
//                                 tempObject
//                             });

//                             if (e.legnth == 0) {
//                                 faultHappen == true;
//                                 console.log({
//                                     tag: 'line-number-211',
//                                     message: 'found emtpty object while prsing csv'
//                                 });
//                             }

//                         });
//                         // res.json({
//                         //     m: 'test-bulk'
//                         // })
//                         if (!faultHappen) {
//                             application.create(modiResult).then(data => {
//                                 // console.log({
//                                 //     tag: 'root-post',
//                                 //     data
//                                 // });
//                                 res.json({
//                                     message: 'data successfully loaded',
//                                     data,
//                                 })
//                             }).catch(err => {
//                                 console.log({
//                                     message: 'error occured',
//                                     err
//                                 });
//                             })
//                         }


//                     }
//                 })
//             }
//         })
//     }

// })


// app.post('/demo', async (req, res) => {

//     let demo = {
//         college_name: 'demo',
//         current_date: 'demoDate',
//         student_name: 'demo student',
//         marks: 80,
//         emil_id: 'demogamil',
//         place: 'demo place',
//         mob_number: 1341233
//     }
//     const form = new application(demo);

//     try {
//         await form.save();
//         res.send(demo);
//     } catch (error) {
//         res.status(500).send(error);
//     }

// })

app.listen(port, (err, data) => {
    err &&
        console.log({
            TAG: 'INDEX JS',
            err
        })

    console.log(`Example app listening on port ${port}`)
})