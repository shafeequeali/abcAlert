var express = require('express');
var router = express.Router();
const fileUpload = require('express-fileupload');
const application = require("../model");
const testModel = require("../testMode");
const fs = require('fs');
const csv = require('csv-parser');
const axios = require("axios");
const utility = require("../helpers/utility");
const {
    count
} = require('console');

// create({baseUrl: "https://jsonplaceholder.typicode.com/"});

router.use(fileUpload({
    limits: {
        fileSize: 50 * 1024 * 1024
    },
}));

router.post('/create_by_form', async (req, res) => {
    // console.log({
    //     tag: 'alert-router --post-create/form',
    //     body: req.body
    // });
    let data = {
        name: req.body.name,
        roll_number: req.body.roll_number,
        email_id: req.body.email_id,
        phone_number: req.body.phone_number ? req.body.phone_number.split(',') : '',
        alert_name: req.body.alert_name ? req.body.alert_name : `Alert-${Date.now()}`,
        alert_status: 'CREATED',
        created_date: Date.now(),
        data_source: 'STATIC'
    };
    const form = new application(data);
    // console.log({
    //     tag: 'alert-router --post-create/form',data
    // });

    try {
        const dbres = await form.save();
        console.log(dbres);
        res.send(dbres);
    } catch (error) {
        res.status(500).send(error);
    }
    // res.send({
    //     tag: 'alert-router --post-create/form',data
    // });

})

router.post('/create_by_csv', async (req, res) => {
    let data = {
        data_source: 'DYNAMIC',
        csv_file: req.body.csv_file,
        csv_file_name: req.body.csv_file_name,
        name: req.body.sampleFromData.name,
        roll_number: req.body.sampleFromData.roll_number,
        email_id: req.body.sampleFromData.email_id,
        phone_number: req.body.sampleFromData.phone_number.split(','),
        alert_name: req.body.sampleFromData.alert_name ? req.body.sampleFromData.alert_name : `Alert-${Date.now()}`,
        alert_status: 'CREATED',
        created_date: Date.now(),
        modified_date: '',
        processed_date: '',
        binding_data: JSON.stringify(req.body.bindData),
        csv_headers: req.body.csv_headers,
        csv_sample: JSON.stringify(req.body.csv_sample)
    }
    const form = new application(data);

    // console.log({
    //     tag: 'alert-router --post-create_by_csv',
    //     // body: req.body
    //     data
    // });
    try {
        const dbres = await form.save();
        // console.log(dbres);
        res.send(dbres);
    } catch (error) {
        res.status(500).send(error);
    }
    // res.send({
    //     tag: 'alert-router --post-create_by_csv',
    //     body: req.body
    // });

})

router.put('/create_by_csv/:id', async (req, res) => {
    let data = {
        data_source: 'DYNAMIC',
        csv_file: req.body.csv_file,
        name: req.body.sampleFromData.name,
        roll_number: req.body.sampleFromData.roll_number,
        email_id: req.body.sampleFromData.email_id,
        phone_number: req.body.sampleFromData.phone_number.split(','),
        alert_name: req.body.sampleFromData.alert_name ? req.body.sampleFromData.alert_name : `Alert-${Date.now()}`,
        alert_status: 'CREATED',
        modified_date: Date.now(),
        processed_date: '',
        binding_data: JSON.stringify(req.body.bindData),
        csv_headers: req.body.csv_headers,
        csv_sample: JSON.stringify(req.body.csv_sample)
    }

    application.findByIdAndUpdate(req.params.id, {
            ...data
        }).then(data => {
            res.json({
                message: 'Hello World!',
                totalDocuments: data
            })
        })
        .catch(err => {
            res.json({
                message: 'Hello World!',
                totalDocuments: err
            })
        })

    // console.log({
    //     tag: 'alert-router --post-create_by_csv',
    //     csv_sample:typeof req.body.csv_sample
    // });
    // res.send({
    //     tag: 'alert-router --post-create_by_csv',
    //     data
    // });

})

router.post('/csv', async (req, res) => {
    const files = req.files;
    const file = files ? files.file : "nothing";
    const fileName = file ? file.name : 'nothing';
    let results = []
    // console.log({
    //     message: 'file-upload',
    //     file: file,
    //     fileName,
    // });

    let newFileName = Date.now() + '.csv';
    let newFilePath = './uploads/' + newFileName
    file.mv(newFilePath, (err) => {
        if (err) {
            console.log(err);
            res.json({
                err
            })
        } else {
            fs.createReadStream(`./uploads/${newFileName}`)
                .pipe(csv())
                .on('data', (data) => {
                    results.push(data)
                    // console.log(data);
                })
                .on('end', () => {
                    res.send({
                        file_path: newFilePath,
                        file_name: fileName,
                        sample_data: results[0]
                    })
                });

        }
    })

})

router.get('/', async (req, res) => {

    let dbMatchQuarry = {};

    let alert_status = req.query.alert_status


    let match = {
        $match: {
            $or: [{}]
        }
    }

    if (alert_status == 'CREATED') {

        await application.find({
                alert_status: 'PROCESSING'
            }).then(async (data) => {
                // console.log({
                //     tag: '------------------------------------start---------',
                //     data
                // });
                await data.map(async (d) => {
                    if (d.alert_status === 'PROCESSING' && d.csv_data_length <= d.whatsapp_alert_track.length) {
                        // console.log({
                        //     tag: '------------------------------------start---------',
                        //     d
                        // });
                        await application.findByIdAndUpdate(d._id, {
                            alert_status: 'PROCESSED'
                        })
                    }
                })
            })
            .then((data2) => {
                const aggregate = application.aggregate([{
                    $match: {
                        alert_status: {
                            $in: ['CREATED', 'PROCESSING']
                        }
                    }
                }]);
                aggregate.then((data) => {

                        data.forEach((d) => {
                            let ph_string = '';
                            d.phone_number.map((e) => {
                                ph_string = ph_string + e + ','
                            })
                            // d.phone_number= ph_string.slice(0, str.length - 1);
                            let temp = ph_string.slice(0, ph_string.length - 1)
                            d.phone_number = temp;
                        })
                        // console.log({
                        //     tag: 'alert-router -get',
                        //     data
                        // });
                        res.json({
                            data: data
                        })
                    })
                    .catch(err => {
                        res.json({
                            message: 'somthing went wrong',
                            totalDocuments: err
                        })
                    })
            }).catch(err => {
                res.json({
                    message: 'somthing went wrong',
                    totalDocuments: err
                })
            })
    } else {
        console.log('........procesed......');
        dbMatchQuarry = {
            alert_status
        }
        application.find(dbMatchQuarry).then(data => {

                data.forEach((d) => {
                    let ph_string = '';
                    d.phone_number.map((e) => {
                        ph_string = ph_string + e + ','
                    })
                    // d.phone_number= ph_string.slice(0, str.length - 1);
                    let temp = ph_string.slice(0, ph_string.length - 1)
                    d.phone_number = temp;
                })


                console.log({
                    tag: 'alert-router -get',
                    data
                });
                res.json({
                    data: data
                })
            })
            .catch(err => {
                res.json({
                    message: 'Hello World!',
                    totalDocuments: err
                })
            })
    }




    // res.send({
    //     tag: 'alert-router --post-update'
    // });
})

router.put('/create_by_form/:id', async (req, res) => {
    let data = {
        name: req.body.name,
        roll_number: req.body.roll_number,
        email_id: req.body.email_id,
        phone_number: req.body.phone_number ? req.body.phone_number.split(',') : '',
        alert_name: req.body.alert_name,
        alert_status: 'CREATED',
        modified_date: Date.now(),
        data_source: 'FORM'
    };
    console.log({
        tag: 'alert-router --post-update',
        data,
        body: req.body,
        param: req.params
    });

    application.findByIdAndUpdate(req.params.id, {
            ...data
        }).then(data => {
            res.json({
                message: 'Hello World!',
                totalDocuments: data
            })
        })
        .catch(err => {
            res.json({
                message: 'Hello World!',
                totalDocuments: err
            })
        })



    // res.send({
    //     tag: 'alert-router --post-update'
    // });
})

router.delete('/:id', async (req, res) => {
    let filePath = req.query.csv_file;
    application.findByIdAndDelete(req.params.id).then(data => {
            // delete csv file uploaded
            if (filePath) {
                fs.unlink(filePath, (err) => {
                    if (err) {
                        // console.log({
                        //     message: 'removing csv file failed',
                        //     data: data,
                        //     fsErr: err
                        // });
                        res.json({
                            message: 'removing csv file failed',
                            data: data,
                            fsErr: err
                        })
                    } else {
                        // console.log({
                        //     message: 'file deleted successfully',
                        //     data: data
                        // });
                        res.json({
                            message: 'file deleted successfully',
                            data: data
                        })
                    }
                });
            } else {
                res.json({
                    message: 'data deleted successfully',
                    data: data
                })
            }

        })
        .catch(err => {
            res.json({
                message: 'delete data filed',
                err: err
            })
        })


    // console.log({
    //     tag: 'alert-router --post-delete',
    //     queryParams: req.query,
    //     id: req.params.id
    // });

    // res.send({
    //     tag: 'alert-router --post-delete'
    // });
})

router.post('/sendAlert/:id', (req, res) => {
    const TAG = '/sendAlert/:id';
    let count = 0;

    const dataBaseTrackUpdate = (id, track, callback) => {
        // let track = {
        //     index: index,
        //     status: 'SUCCESS'
        // }
        console.log({
            tag: TAG + ' dataBaseTrackUpdate-1',
        });
        application.findByIdAndUpdate(id, {
                $push: {
                    whatsapp_alert_track: track
                }
            }).then(data => {
                callback()
                console.log({
                    tag: TAG + ' dataBaseTrackUpdat--334',
                    // data
                });
            })
            .catch(err => {
                callback()
                console.log({
                    tag: TAG + ' dataBaseTrackUpdatie--341',
                    err
                });
            })
    }

    const getDataBaseTrack = () => {
        application.findById(req.params.id).then((data) => {

        }).catch(err => {
            console.log({
                tag: TAG + ' getDataBaseTrack'
            });
        })
    }

    const loadLatestData = (_id, res) => {
        application.findByIdAndUpdate(_id, {
            alert_status: 'PROCESSED'
        }).then((data) => {
            application.find({}).then((data) => {
                res.status(200).json({
                    data
                })
            }).catch(err => {
                res.status(200).json({
                    err
                })
                // console.log({
                //     tag: TAG + ' getDataBaseTrack'
                // });
            })
        }).catch(err => {
            application.find({}).then((data) => {
                res.status(200).json({
                    data
                })
            }).catch(err => {
                res.status(200).json({
                    err
                })
                // console.log({
                //     tag: TAG + ' getDataBaseTrack'
                // });
            })
        })

    }


    const sentWhatsAppAlert = (data, phs, index, _id, res) => {
        console.log({
            tag: TAG + ' sentWhatsAppAlert-38900'
        });
        // const callback = () => {
        //     loadLatestData(_id, res)
        // }
        let whatsappBody = {
            storage: "full",
            destination: {
                integrationId: "60be3bbfaa6e4100d373d7ce",
                destinationId: phs[count],
                // destinationId: '918301848679',
            },
            author: {
                name: "support@moplet.com",
                email: "Moplet",
                role: "appMaker"
            },
            messageSchema: "whatsapp",
            message: {
                type: "template",
                template: {
                    namespace: "b95d3cd4_9035_4c76_b0bb_788239007519",
                    name: "error_notification",
                    language: {
                        policy: "deterministic",
                        code: "en"
                    },
                    components: [{
                        type: "body",
                        parameters: [{
                                type: "text",
                                text: data.name
                            },
                            {
                                type: "text",
                                text: data.email_id
                            },
                            {
                                type: "text",
                                text: data.roll_number
                            }
                        ]
                    }]
                }
            }
        };
        console.log({
            tag: TAG + ' sentWhatsAppAlert-433'
        });
        axios({
                url: 'https://alpha.panel.mapapi.io/v1/api/whatsapp/60ba619cdc52f500d37e810f/notification',
                method: "post",
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImFwcF82MGJlN2VkZjg5YjA5ODAwZDQ1YjE4OTEifQ.eyJzY29wZSI6ImFwcCJ9.bghgMypz5bsEp0Zp3f56FswY5Rk_iR-zx1MHQMlazgM'
                },
                data: JSON.stringify(whatsappBody)
            })
            .then(response => {
                console.log({
                    tag: TAG + ' axios-then-426',
                    // response
                });
                let track = {
                    index: count,
                    status: 'SUCCESS'
                }
                count = count + 1;
                let callback = () => {
                    if (phs.length != count) {
                        sentWhatsAppAlert(data, phs, index, _id, res)
                        console.log({
                            tag: '.......................................then............count',
                            count
                        });
                    } else {
                        console.log({
                            tag: '........................................then...........stoped',
                            count
                        });
                        loadLatestData(_id, res)
                    }
                }

                dataBaseTrackUpdate(_id, track, callback)

            })
            .catch((err) => {
                console.log({
                    tag: TAG + ' axios-catch-446',
                    // err
                });
                let track = {
                    index: count,
                    status: 'FAILED'
                }

                count = count + 1;
                let callback = () => {
                    // sentWhatsAppAlert(data, phs, index, _id, res)
                    if (phs.length - 1 != count) {
                        sentWhatsAppAlert(data, phs, index, _id, res)
                        console.log('....................................catch...............count');
                    } else {
                        console.log('......................................catch.............stoped');
                        loadLatestData(_id, res)
                    }
                }
                dataBaseTrackUpdate(_id, track, callback)

            });
    }

    application.findByIdAndUpdate(req.params.id, {
        alert_status: 'PROCESSING'
    }).then((aa) => {
        application.findById(req.params.id).then((data) => {
                console.log({
                    tag: TAG + ' findById-489',
                    data
                });
                let whatsappParams = {
                    name: '',
                    email_id: '',
                    roll_number: ''
                }
                console.log({
                    tag: TAG + ' findById-498',
                });
                if (data.data_source === 'STATIC') {
                    whatsappParams.name = data.name;
                    whatsappParams.email_id = data.email_id;
                    whatsappParams.roll_number = data.roll_number;
                    let alertNumbers = [];
                    data.phone_number.map((p) => {
                        if (p.charAt(0) === '+') {
                            alertNumbers.push(p.slice(1))
                        } else {
                            alertNumbers.push(p)
                        }
                    })
                    console.log({
                        tag: TAG + ' findById-515',

                    });
                    sentWhatsAppAlert(whatsappParams, alertNumbers, null, req.params.id, res);
                    // sentWhatsAppAlert(whatsappParams,
                    //     [ '918301848679', '918301848679', '918301848679', '918301848679'],
                    //     null,
                    //     req.params.id, res);

                    console.log({
                        tag: TAG + ' findById-523',

                    });
                    // alertNumbers.map((num, index) => {
                    //     console.log({
                    //         tag: TAG + ' findById-498',
                    //         // alertNumbers,
                    //         // num,
                    //         // dyNUm: alertNumbers[index]
                    //     });
                    // sentWhatsAppAlert(whatsappParams, alertNumbers, index, req.params.id, res);
                    // })

                } else if (data.data_source === 'DYNAMIC') {
                    res.send('DYNAMIC NOT WORKING')
                }

            })
            .catch(err => {
                res.status(404).json(err)
            })
    }).catch((err) => {
        res.status(404).json(err)
    })



})

router.post('/sendAlert_csv/:id', async (req, res) => {
    const TAG = 'sendAlert_csv'
    const dataBaseTrackUpdate = (id, track, callback) => {
        // let track = {
        //     index: index,
        //     status: 'SUCCESS'
        // }
        console.log({
            tag: TAG + ' dataBaseTrackUpdate-1',
        });
        application.findByIdAndUpdate(id, {
                $push: {
                    whatsapp_alert_track: track
                }
            }).then(data => {
                callback()
                console.log({
                    tag: TAG + ' dataBaseTrackUpdat----',
                    // data
                });
            })
            .catch(err => {
                callback()
                console.log({
                    tag: TAG + ' dataBaseTrackUpdatie-----',
                    err
                });
            })
    }
    const callWhatsappApi = async (ph, data, id, track, callback) => {
        let whatsappBody = {
            storage: "full",
            destination: {
                integrationId: "60be3bbfaa6e4100d373d7ce",
                destinationId: ph,
                // destinationId: '918301848679',
            },
            author: {
                name: "support@moplet.com",
                email: "Moplet",
                role: "appMaker"
            },
            messageSchema: "whatsapp",
            message: {
                type: "template",
                template: {
                    namespace: "b95d3cd4_9035_4c76_b0bb_788239007519",
                    name: "error_notification",
                    language: {
                        policy: "deterministic",
                        code: "en"
                    },
                    components: [{
                        type: "body",
                        parameters: [{
                                type: "text",
                                text: data.name
                            },
                            {
                                type: "text",
                                text: data.email_id
                            },
                            {
                                type: "text",
                                text: data.roll_number
                            }
                        ]
                    }]
                }
            }
        };
        console.log({
            tag: TAG + ' sentWhatsAppAlert-433'
        });
        await axios({
                url: 'https://alpha.panel.mapapi.io/v1/api/whatsapp/60ba619cdc52f500d37e810f/notification',
                method: "post",
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImFwcF82MGJlN2VkZjg5YjA5ODAwZDQ1YjE4OTEifQ.eyJzY29wZSI6ImFwcCJ9.bghgMypz5bsEp0Zp3f56FswY5Rk_iR-zx1MHQMlazgM'
                },
                data: JSON.stringify(whatsappBody)
            })
            .then(response => {
                console.log('...................callWhatsappApi........res....');
                dataBaseTrackUpdate(id, track, callback)
            })
            .catch(err => {
                console.log('...................callWhatsappApi........err....');

                dataBaseTrackUpdate(id, track, callback)
            })
    }

    application.findByIdAndUpdate(req.params.id, {
            alert_status: 'PROCESSING'
        }).then(data => {

            application.findById(req.params.id).then((data) => {

                if (data.data_source === 'DYNAMIC') {
                    let isDataAvailabe = data ? data.csv_file ? true : false : false
                    const bindingData = JSON.parse(data.binding_data)
                    // console.log({
                    //     tag: TAG,
                    //     data,
                    //     bindingData
                    // });
                    let results = [];
                    if (isDataAvailabe) {
                        let counter = 0
                        fs.createReadStream(data.csv_file)
                            .pipe(csv())
                            .on('data', (csvData) => {

                                new Promise(async (resolve, reject) => {

                                    results.push(data)
                                    // console.log(csvData);
                                    let whatsappParams = {
                                        name: '',
                                        email_id: '',
                                        roll_number: '',
                                        phone_number: ''
                                    }

                                    for (const key in whatsappParams) {

                                        let type = bindingData[key].type
                                        if (type === 'csv_data') {
                                            // console.log('....................csvdata.........');
                                            let csv_key = bindingData[key].value;
                                            whatsappParams[key] = csvData[csv_key] ? csvData[csv_key] : ''
                                        } else if (type === 'type_data') {
                                            // console.log('....................type_data.........');
                                            whatsappParams[key] = data[key] ? data[key] : ''
                                        }
                                    }
                                    // console.log(whatsappParams);
                                    let errFound = utility.whatsappParamsValidation(whatsappParams);
                                    const callback = () => {
                                        counter = counter + 1
                                    }
                                    if (!errFound) {
                                        const track = {
                                            index: counter,
                                            status: 'SUCCESS'
                                        };

                                        await callWhatsappApi(whatsappParams.phone_number, whatsappParams, req.params.id, track, callback)
                                    } else {
                                        const track = {
                                            index: counter,
                                            status: 'FAILED'
                                        };

                                        await callWhatsappApi(whatsappParams.phone_number, whatsappParams, req.params.id, track, callback)
                                    }
                                    // counter = counter + 1
                                    // ph, data, id, track, callback
                                    // console.log({
                                    //     tag: 'errFound',
                                    //     errFound
                                    // });
                                    // console.log({
                                    //     tag: '............on data.....csv',
                                    //     counter
                                    // });
                                    resolve('resolve');


                                });


                            })
                            .on('end', () => {
                                // console.log({
                                //     tag: '.............on end---',
                                //     counter,
                                //     length: results.length
                                // });
                                application.findByIdAndUpdate(req.params.id, {
                                        csv_data_length: results.length
                                    }).then(data => {
                                        console.log({
                                            tag: TAG + 'at status update',
                                            data
                                        });
                                    })
                                    .catch(err => {
                                        console.log({
                                            tag: TAG + 'at status update',
                                            err
                                        });
                                    })

                            });

                    } else {
                        res.status(404).json({
                            message: 'csv fle not found'
                        })
                    }

                } else if (data.data_source === 'STATIC') {
                    res.send('STATIC NOT WORKING')
                }



            }).catch(err => {
                res.status(404).json(err)
            })

            // console.log({
            //     tag: TAG + 'at status update-PROCESSING',
            //     // data
            // });
            res.json({
                message: "processing"
            })
        })
        .catch(err => {
            console.log({
                tag: TAG + 'at status update-PROCESSING',
                err
            });
            res.json({
                message: "processing--failed"
            })
        })



})

router.post('/test', async (req, res) => {
    // let newTestmodel = new testModel({
    //     track: [{
    //         index: 1,
    //         status: 'SUCCESS'
    //     }]
    // })
    // let dbres = await newTestmodel.save();
    // res.send(dbres)
    let a = {
        index: 111,
        status: 'FAILED'
    }
    let id = '62c7e1ed41baabab57094180'
    testModel.findByIdAndUpdate(id, {
        $push: {
            track: a
        }
    }).then(data => {

        res.send(data)
    }).catch(err => {
        res.send(err)
    })

});
router.get('/test', async (req, res) => {

    testModel.find({}).then(data => {
        res.json(data)
    })
})

module.exports = router;