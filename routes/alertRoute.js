var express = require("express");
var router = express.Router();
const fileUpload = require("express-fileupload");
const application = require("../model");
const systemConfig = require("../modeles/systemConfig");
const queueData = require("../modeles/Queue");
const testModel = require("../testMode");
const mainMM = require("../modeles/modules/mainModelModule");
const campQM = require("../modeles/modules/campignQueueModule");
const systemCM = require("../modeles/modules/systenCofigueModule");
const whatsApp = require("../modules/whatsAppApiCaller");
const fs = require("fs");
const csv = require("csv-parser");
const axios = require("axios");
const utility = require("../helpers/utility");
const { count } = require("console");
const { json } = require("body-parser");
require("dotenv").config();
// const setTimeout = require("timers/promises");
// create({baseUrl: "https://jsonplaceholder.typicode.com/"});

const dataBaseChecker = require("../modules/databaseChecker");
const loadCampaignData = require("../modules/campaignLoader");

const cassandraDb = require("../modeles/cassandraModel/cassandraMessageModel");

router.use(
  fileUpload({
    limits: {
      fileSize: 50 * 1024 * 1024,
    },
  })
);

router.post("/create_by_form", async (req, res) => {
  // console.log({
  //     tag: 'alert-router --post-create/form',
  //     body: req.body
  // });
  let data = {
    name: req.body.name,
    roll_number: req.body.roll_number,
    email_id: req.body.email_id,
    phone_number: req.body.phone_number ? req.body.phone_number.split(",") : "",
    alert_name: req.body.alert_name
      ? req.body.alert_name
      : `Alert-${Date.now()}`,
    alert_status: "CREATED",
    created_date: Date.now(),
    data_source: "STATIC",
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
});

router.post("/create_by_csv", async (req, res) => {
  let data = {
    data_source: "DYNAMIC",
    csv_file: req.body.csv_file,
    csv_file_name: req.body.csv_file_name,
    name: req.body.sampleFromData.name,
    roll_number: req.body.sampleFromData.roll_number,
    email_id: req.body.sampleFromData.email_id,
    phone_number: req.body.sampleFromData.phone_number.split(","),
    alert_name: req.body.sampleFromData.alert_name
      ? req.body.sampleFromData.alert_name
      : `Alert-${Date.now()}`,
    alert_status: "CREATED",
    created_date: Date.now(),
    modified_date: "",
    processed_date: "",
    binding_data: JSON.stringify(req.body.bindData),
    csv_headers: req.body.csv_headers,
    csv_sample: JSON.stringify(req.body.csv_sample),
  };
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
});

router.put("/create_by_csv/:id", async (req, res) => {
  let data = {
    data_source: "DYNAMIC",
    csv_file: req.body.csv_file,
    name: req.body.sampleFromData.name,
    roll_number: req.body.sampleFromData.roll_number,
    email_id: req.body.sampleFromData.email_id,
    phone_number: req.body.sampleFromData.phone_number.split(","),
    alert_name: req.body.sampleFromData.alert_name
      ? req.body.sampleFromData.alert_name
      : `Alert-${Date.now()}`,
    alert_status: "CREATED",
    modified_date: Date.now(),
    processed_date: "",
    binding_data: JSON.stringify(req.body.bindData),
    csv_headers: req.body.csv_headers,
    csv_sample: JSON.stringify(req.body.csv_sample),
  };

  application
    .findByIdAndUpdate(req.params.id, {
      ...data,
    })
    .then((data) => {
      res.json({
        message: "Hello World!",
        totalDocuments: data,
      });
    })
    .catch((err) => {
      res.json({
        message: "Hello World!",
        totalDocuments: err,
      });
    });

  // console.log({
  //     tag: 'alert-router --post-create_by_csv',
  //     csv_sample:typeof req.body.csv_sample
  // });
  // res.send({
  //     tag: 'alert-router --post-create_by_csv',
  //     data
  // });
});

router.post("/csv", async (req, res) => {
  const files = req.files;
  const file = files ? files.file : "nothing";
  const fileName = file ? file.name : "nothing";
  let results = [];
  let newFileName = Date.now() + ".csv";
  let newFilePath = "./uploads/" + newFileName;
  console.log({
    message: "file-upload",
    file: file,
    fileName,
    newFileName,
    newFilePath,
  });
  file.mv(newFilePath, (err) => {
    if (err) {
      console.log(err);
      res.json({
        err,
      });
    } else {
      fs.createReadStream(`./uploads/${newFileName}`)
        .pipe(csv())
        .on("data", (data) => {
          results.push(data);
          // console.log(data);
        })
        .on("end", () => {
          res.send({
            file_path: newFilePath,
            file_name: fileName,
            sample_data: results[0],
          });
        });
    }
  });
});

router.get("/", async (req, res) => {
  let dbMatchQuarry = {};

  let alert_status = req.query.alert_status;

  let match = {
    $match: {
      $or: [{}],
    },
  };

  if (alert_status == "CREATED") {
    await application
      .find({
        alert_status: "PROCESSING",
      })
      .then(async (data) => {
        // console.log({
        //     tag: '------------------------------------start---------',
        //     data
        // });
        await data.map(async (d) => {
          if (
            d.alert_status === "PROCESSING" &&
            d.csv_data_length <= d.whatsapp_alert_track.length
          ) {
            // console.log({
            //     tag: '------------------------------------start---------',
            //     d
            // });
            await application.findByIdAndUpdate(d._id, {
              alert_status: "PROCESSED",
            });
          }
        });
      })
      .then((data2) => {
        const aggregate = application.aggregate([
          {
            $match: {
              alert_status: {
                $in: ["CREATED", "PROCESSING"],
              },
            },
          },
        ]);
        aggregate
          .then((data) => {
            data.forEach((d) => {
              let ph_string = "";
              d.phone_number.map((e) => {
                ph_string = ph_string + e + ",";
              });
              // d.phone_number= ph_string.slice(0, str.length - 1);
              let temp = ph_string.slice(0, ph_string.length - 1);
              d.phone_number = temp;
            });
            // console.log({
            //     tag: 'alert-router -get',
            //     data
            // });
            res.json({
              data: data,
            });
          })
          .catch((err) => {
            res.json({
              message: "somthing went wrong",
              totalDocuments: err,
            });
          });
      })
      .catch((err) => {
        res.json({
          message: "somthing went wrong",
          totalDocuments: err,
        });
      });
  } else {
    console.log("........procesed......");
    dbMatchQuarry = {
      alert_status,
    };
    application
      .find(dbMatchQuarry)
      .then((data) => {
        data.forEach((d) => {
          let ph_string = "";
          d.phone_number.map((e) => {
            ph_string = ph_string + e + ",";
          });
          // d.phone_number= ph_string.slice(0, str.length - 1);
          let temp = ph_string.slice(0, ph_string.length - 1);
          d.phone_number = temp;
        });

        // console.log({
        //   tag: "alert-router -get",
        //   data,
        // });
        res.json({
          data: data,
        });
      })
      .catch((err) => {
        res.json({
          message: "Hello World!",
          totalDocuments: err,
        });
      });
  }

  // res.send({
  //     tag: 'alert-router --post-update'
  // });
});

router.put("/create_by_form/:id", async (req, res) => {
  let data = {
    name: req.body.name,
    roll_number: req.body.roll_number,
    email_id: req.body.email_id,
    phone_number: req.body.phone_number ? req.body.phone_number.split(",") : "",
    alert_name: req.body.alert_name,
    alert_status: "CREATED",
    modified_date: Date.now(),
    data_source: "FORM",
  };
  console.log({
    tag: "alert-router --post-update",
    data,
    body: req.body,
    param: req.params,
  });

  application
    .findByIdAndUpdate(req.params.id, {
      ...data,
    })
    .then((data) => {
      res.json({
        message: "Hello World!",
        totalDocuments: data,
      });
    })
    .catch((err) => {
      res.json({
        message: "Hello World!",
        totalDocuments: err,
      });
    });

  // res.send({
  //     tag: 'alert-router --post-update'
  // });
});

router.delete("/:id", async (req, res) => {
  let filePath = req.query.csv_file;
  application
    .findByIdAndDelete(req.params.id)
    .then((data) => {
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
              message: "removing csv file failed",
              data: data,
              fsErr: err,
            });
          } else {
            // console.log({
            //     message: 'file deleted successfully',
            //     data: data
            // });
            res.json({
              message: "file deleted successfully",
              data: data,
            });
          }
        });
      } else {
        res.json({
          message: "data deleted successfully",
          data: data,
        });
      }
    })
    .catch((err) => {
      res.json({
        message: "delete data filed",
        err: err,
      });
    });

  // console.log({
  //     tag: 'alert-router --post-delete',
  //     queryParams: req.query,
  //     id: req.params.id
  // });

  // res.send({
  //     tag: 'alert-router --post-delete'
  // });
});

router.post("/sendAlert/:id", (req, res) => {
  const TAG = "/sendAlert/:id";
  let count = 0;

  const dataBaseTrackUpdate = (id, track, callback) => {
    // let track = {
    //     index: index,
    //     status: 'SUCCESS'
    // }
    console.log({
      tag: TAG + " dataBaseTrackUpdate-1",
    });
    application
      .findByIdAndUpdate(id, {
        $push: {
          whatsapp_alert_track: track,
        },
      })
      .then((data) => {
        callback();
        console.log({
          tag: TAG + " dataBaseTrackUpdat--334",
          // data
        });
      })
      .catch((err) => {
        callback();
        console.log({
          tag: TAG + " dataBaseTrackUpdatie--341",
          err,
        });
      });
  };

  const getDataBaseTrack = () => {
    application
      .findById(req.params.id)
      .then((data) => {})
      .catch((err) => {
        console.log({
          tag: TAG + " getDataBaseTrack",
        });
      });
  };

  const loadLatestData = (_id, res) => {
    application
      .findByIdAndUpdate(_id, {
        alert_status: "PROCESSED",
      })
      .then((data) => {
        application
          .find({})
          .then((data) => {
            res.status(200).json({
              data,
            });
          })
          .catch((err) => {
            res.status(200).json({
              err,
            });
            // console.log({
            //     tag: TAG + ' getDataBaseTrack'
            // });
          });
      })
      .catch((err) => {
        application
          .find({})
          .then((data) => {
            res.status(200).json({
              data,
            });
          })
          .catch((err) => {
            res.status(200).json({
              err,
            });
            // console.log({
            //     tag: TAG + ' getDataBaseTrack'
            // });
          });
      });
  };

  const sentWhatsAppAlert = (data, phs, index, _id, res) => {
    console.log({
      tag: TAG + " sentWhatsAppAlert-38900",
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
        role: "appMaker",
      },
      messageSchema: "whatsapp",
      message: {
        type: "template",
        template: {
          namespace: "b95d3cd4_9035_4c76_b0bb_788239007519",
          name: "error_notification",
          language: {
            policy: "deterministic",
            code: "en",
          },
          components: [
            {
              type: "body",
              parameters: [
                {
                  type: "text",
                  text: data.name,
                },
                {
                  type: "text",
                  text: data.email_id,
                },
                {
                  type: "text",
                  text: data.roll_number,
                },
              ],
            },
          ],
        },
      },
    };
    console.log({
      tag: TAG + " sentWhatsAppAlert-433",
    });
    axios({
      url: "https://alpha.panel.mapapi.io/v1/api/whatsapp/60ba619cdc52f500d37e810f/notification",
      method: "post",
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImFwcF82MGJlN2VkZjg5YjA5ODAwZDQ1YjE4OTEifQ.eyJzY29wZSI6ImFwcCJ9.bghgMypz5bsEp0Zp3f56FswY5Rk_iR-zx1MHQMlazgM",
      },
      data: JSON.stringify(whatsappBody),
    })
      .then((response) => {
        console.log({
          tag: TAG + " axios-then-426",
          // response
        });
        let track = {
          index: count,
          status: "SUCCESS",
        };
        count = count + 1;
        let callback = () => {
          if (phs.length != count) {
            sentWhatsAppAlert(data, phs, index, _id, res);
            console.log({
              tag: ".......................................then............count",
              count,
            });
          } else {
            console.log({
              tag: "........................................then...........stoped",
              count,
            });
            loadLatestData(_id, res);
          }
        };

        dataBaseTrackUpdate(_id, track, callback);
      })
      .catch((err) => {
        console.log({
          tag: TAG + " axios-catch-446",
          // err
        });
        let track = {
          index: count,
          status: "FAILED",
        };

        count = count + 1;
        let callback = () => {
          // sentWhatsAppAlert(data, phs, index, _id, res)
          if (phs.length - 1 != count) {
            sentWhatsAppAlert(data, phs, index, _id, res);
            console.log(
              "....................................catch...............count"
            );
          } else {
            console.log(
              "......................................catch.............stoped"
            );
            loadLatestData(_id, res);
          }
        };
        dataBaseTrackUpdate(_id, track, callback);
      });
  };

  application
    .findByIdAndUpdate(req.params.id, {
      alert_status: "PROCESSING",
    })
    .then((aa) => {
      application
        .findById(req.params.id)
        .then((data) => {
          console.log({
            tag: TAG + " findById-489",
            data,
          });
          let whatsappParams = {
            name: "",
            email_id: "",
            roll_number: "",
          };
          console.log({
            tag: TAG + " findById-498",
          });
          if (data.data_source === "STATIC") {
            whatsappParams.name = data.name;
            whatsappParams.email_id = data.email_id;
            whatsappParams.roll_number = data.roll_number;
            let alertNumbers = [];
            data.phone_number.map((p) => {
              if (p.charAt(0) === "+") {
                alertNumbers.push(p.slice(1));
              } else {
                alertNumbers.push(p);
              }
            });
            console.log({
              tag: TAG + " findById-515",
            });
            sentWhatsAppAlert(
              whatsappParams,
              alertNumbers,
              null,
              req.params.id,
              res
            );
            // sentWhatsAppAlert(whatsappParams,
            //     [ '918301848679', '918301848679', '918301848679', '918301848679'],
            //     null,
            //     req.params.id, res);

            console.log({
              tag: TAG + " findById-523",
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
          } else if (data.data_source === "DYNAMIC") {
            res.send("DYNAMIC NOT WORKING");
          }
        })
        .catch((err) => {
          res.status(404).json(err);
        });
    })
    .catch((err) => {
      res.status(404).json(err);
    });
});
//new system-5 exicuters
router.post("/sendAlert_csv6--removed/:id", async (req, res) => {
  const TAG = "sendAlert_csv6";
  const IdOfsystemConfigration = "62d4db8ebb4c949a10b775b4";
  // below data can control the system, it altered by commander function
  //---------------------------------------------------
  //---------------------------------------------------
  //---------------------------------------------------
  var listnerCommand = ""; // terminate
  var listnercountDown = -1; // -1 default ,-2 disabled
  //---------------------------------------------------
  //---------------------------------------------------
  //---------------------------------------------------
  //---------------------------------------------------
  //exicutableDataContainer is a two diamentional container
  const exicutableDataContainer = [];
  //processedDataContainer: it is the to be updated in database ,elemets is object like {alertId,ph,res_data}
  const proccessedDataContainer = [];
  //exicutionCompletedItems: it is the data of completed item of exicutableDataContainer;
  const exicutionCompletedContainerItems = [];
  //executerErrorBucket is a data container ,it filled by the executer when failing the whatsApp-api calls
  const executerErrorBucket = [];
  var listnerCounter = 0;
  var systemErrorReportOnDB = {
    tag: "systemErrorReportOnDB",
    campaignQueueError: "",
    systemConfigError: "",
  };
  var systemErrorReportOnLocal = {
    tag: "systemErrorReportOnLocal",
    executer: "",
  };
  //LCCN : Last Called Colum Number
  var LCCN = 0;
  //executerInfo: it is the info about executer. about the recution,and status.
  var executerInfo = {
    counter: 0,
    delayIntervel: 0,
    counterLastUpdatedTime: null,
    faultDetector: [],
    status: "stoped", //running or stoped
    isWritable: true,
    a: { recursion: 0, status: "stoped" },
    b: { recursion: 0, status: "stoped" },
    c: { recursion: 0, status: "stoped" },
    d: { recursion: 0, status: "stoped" },
    e: { recursion: 0, status: "stoped" },
    //the status willbe enum of [stoped,recursion-exceed,running]
  };
  //executerRecursionHolder: whenever the any one of five executer exceeded the recurion limit ,that info will appear hear eg: [a,b,e],
  var RecursionExceededExecuters = [];
  //exicuterFaultDetectorReport: it is the report of unexpected exicuter is working or not
  var exicuterFaultDetectorReport = [];
  //alertDatabaseUpdaterInfo: it is a info about alertDatabaseUpdater
  var alertDatabaseUpdaterInfo = {
    status: "stoped", //running or stoped
    reTryStatus: "stoped", //running or stoped
    finalAlertStatus: "stoped", //running or stoped
  };
  //databaseUpdateErrorBucket: is the alertData have to update to db,and it got when alertDatabaseUpdater-trackUpdater catch err .
  var databaseUpdateErrorBucket = []; //element->{ id, track }

  const commander = () => {
    if (
      executerInfo.status === "stoped" &&
      alertDatabaseUpdaterInfo.status === "stoped" &&
      alertDatabaseUpdaterInfo.reTryStatus === "stoped" &&
      alertDatabaseUpdaterInfo.finalAlertStatus === "stoped"
    ) {
      if (listnerCommand !== "terminate") {
        listnerCommand = "terminate";
        listnercountDown = 50;
      }
    } else {
      listnerCommand = "";
      listnercountDown = -2;
    }
  };

  //alertDatabaseUpdater : it will manage trackupdation of each alertApicalls and if alert completed it will update the status
  const alertDatabaseUpdater = () => {
    const trackUpdater = async (id, track) => {
      // let track = {
      //     status: 'SUCCESS',
      //      ph:889999999,
      //      res_data:<response>,
      // }
      await application
        .findByIdAndUpdate(id, {
          $push: {
            whatsapp_alert_track: track,
          },
        })
        .then((data) => {})
        .catch((err) => {
          databaseUpdateErrorBucket.push({ id, track });
        });
    };
    if (alertDatabaseUpdaterInfo.status !== "running") {
      const alertDatabaseUpdater1 = async () => {
        if (proccessedDataContainer.length > 0) {
          alertDatabaseUpdaterInfo.status = "running";
          let n = 0;
          while (n < 100) {
            let item = proccessedDataContainer[0];
            proccessedDataContainer.shift();
            await new Promise((resolve) =>
              setTimeout(() => {
                resolve();
              }, 30)
            );
            trackUpdater(item.alertId, {
              status: item.status,
              res_data: item.res_data,
              ph: item.ph,
            });
            if (proccessedDataContainer.length > 0) {
              n = 1;
            } else {
              alertDatabaseUpdaterInfo.status = "stoped";
              n = 100;
            }
          }
        }
      };
      alertDatabaseUpdater1();
    }
    if (alertDatabaseUpdaterInfo.reTryStatus !== "running") {
      const alertDatabaseUpdater2OnErrorBase = async () => {
        if (databaseUpdateErrorBucket.length > 0) {
          alertDatabaseUpdaterInfo.reTryStatus = "running";
          let n = 0;
          while (n < 100) {
            let item = databaseUpdateErrorBucket[0];
            databaseUpdateErrorBucket.shift();
            await new Promise((resolve) =>
              setTimeout(() => {
                resolve();
              }, 50)
            );
            trackUpdater(item.id, item.track);
            if (databaseUpdateErrorBucket.length > 0) {
              n = 1;
            } else {
              alertDatabaseUpdaterInfo.reTryStatus = "stoped";
              n = 100;
            }
          }
        }
      };
      alertDatabaseUpdater2OnErrorBase();
    }

    if (alertDatabaseUpdaterInfo.finalAlertStatus !== "running") {
      const updateProcessedAlert = async (alertId) => {
        await application
          .findByIdAndUpdate(alertId, {
            alert_status: "PROCESSED",
          })
          .then((data) => {})
          .catch((err) => {
            exicutionCompletedContainerItems.push(alertId);
          });
      };
      (async function () {
        if (exicutionCompletedContainerItems.length > 0) {
          alertDatabaseUpdaterInfo.finalAlertStatus = "running";
          let n = 0;
          while (n < 100) {
            let item = exicutionCompletedContainerItems[0];
            exicutionCompletedContainerItems.shift();
            await new Promise((resolve) =>
              setTimeout(() => {
                resolve();
              }, 400)
            );
            updateProcessedAlert(item);
            if (exicutionCompletedContainerItems.length > 0) {
              n = 1;
            } else {
              alertDatabaseUpdaterInfo.finalAlertStatus = "stoped";
              n = 100;
            }
          }
        }
      })();
    }
  };
  //executerFaultDetector: it will find unexpected exicuter is working or not
  const executerFaultDetector = () => {
    if (executerInfo.faultDetector.length > 50) {
      const faultArray = executerInfo.faultDetector;
      executerInfo.faultDetector = [];
      let dupArra = [];
      for (let i = 0; i < faultArray.length; i++) {
        const item = faultArray[i];
        const found = dupArra.find((e) => e === item);
        dupArra.push(item);
        if (found) {
          exicuterFaultDetectorReport.push("fault");
        }
      }
    }
  };
  //executableDataCreator: it creating whatsappPayloads based on available data in database
  const executableDataCreator = (data) => {
    const alertId = data._id;
    if (data.data_source === "DYNAMIC") {
      let isDataAvailabe = data ? (data.csv_file ? true : false) : false;
      const bindingData = JSON.parse(data.binding_data);
      let results = [];
      if (isDataAvailabe) {
        fs.createReadStream(data.csv_file)
          .pipe(csv())
          .on("data", (csvData) => {
            results.push(csvData);
          })
          .on("end", () => {
            mainMM.findByIdAndUpdateCsvLength(alertId, results.length);
            let whatsappParamsArray = [];
            for (const csvData of results) {
              let whatsappParams = {
                name: "",
                email_id: "",
                roll_number: "",
                phone_number: "",
              };
              for (const key in whatsappParams) {
                let type = bindingData[key].type;
                if (type === "csv_data") {
                  // console.log('........alertId............csvdata.........');
                  let csv_key = bindingData[key].value;
                  whatsappParams[key] = csvData[csv_key]
                    ? csvData[csv_key]
                    : "";
                } else if (type === "type_data") {
                  // console.log('....................type_data.........');
                  whatsappParams[key] = data[key] ? data[key] : "";
                }
              }
              // console.log(whatsappParams);
              let errFound = utility.whatsappParamsValidation(whatsappParams);

              if (!errFound) {
                whatsappParamsArray.push(whatsappParams);
              }
            }
            exicutableDataContainer.push({
              alertId,
              payloads: whatsappParamsArray,
              totalPayloads: whatsappParamsArray.length,
            });
          });
      } else {
        console.log({
          tag: TAG + "runSystem-csv finder",
          message: "csv fle not found",
        });
      }
    } else if (data.data_source === "STATIC") {
      console.log({
        tag: TAG + "runSystem-> appliction-type-chooser",
        message: "STATIC NOT WORKING",
      });
    }
  };
  //loading alerts
  const loadAlerts = async () => {
    let foundNew = false;
    let alertData = null;
    const dataBaseInfo = await dataBaseChecker.dataBaseChecker();

    // console.log({ tag: TAG + " loadAlerts", dataBaseInfo });
    if (dataBaseInfo) {
      foundNew = true;
    }
    if (foundNew) {
      alertData = await loadCampaignData.loadCampaignData(
        dataBaseInfo.campaignId
      );
      if (alertData) {
        let deletion = campQM.deleteById(dataBaseInfo._id);
        if (deletion) {
          console.log({ tag: TAG + " loadAlerts", deletion });
        } else {
          console.log({ tag: TAG + " loadAlerts", message: "failed" });
        }
        mainMM.findByIdAndUpdateAlertStatus(
          dataBaseInfo.campaignId,
          "PROCESSING"
        );
      }
      console.log({ tag: TAG + " loadAlerts", alertData });
    }
    if (alertData) {
      executableDataCreator(alertData);
    }
  };
  //linsterManager
  const listnerManager = async () => {
    if (listnerCounter !== 0) {
      systemCM.updateListnerTrack(listnerCounter);
    }
    listnerCounter++;
    if (listnerCounter >= 10000) {
      systemCM.updateListner({ listener_tracker: [0] });
      listnerCounter = 0;
    }
  };
  //system Error reporter
  const systemErrorReporter = (key, value) => {
    systemErrorReportOnDB[key] = value;
  };
  //system Error reporter on local
  const systemErrorReporterOnLocal = (key, value) => {
    systemErrorReportOnLocal[key] = value;
  };
  // systemErrorAnalyser
  const systemErrorAnalyser = async (obj) => {
    let stoper = 0;
    for (const key in obj) {
      if ((stoper = 0)) {
        if (obj[key] != "") {
          stoper = 1;
          console.log({
            tag: TAG + "systemErrorAnalyser",
            message:
              "error detected ######################################################################",
            message2:
              "error detected ######################################################################",
            message3:
              "error detected ######################################################################",
            errorReport: obj,
          });
        }
      }
    }
  };
  //executerCallback: to fillthe executerErrorBucket;
  const executerCallback = async (okData, notOkData, finalMessage, execId) => {
    if (okData) {
      proccessedDataContainer.push(okData);
    }
    if (notOkData) {
      //executerErrorBucket : this feature not yet avaible
      executerErrorBucket.push(notOkData);
      // proccessedDataContainer.push(notOkData);
    }
    if (finalMessage) {
      exicutionCompletedContainerItems.push(finalMessage);
    }
    if (executerInfo.delayIntervel >= 20) {
      await new Promise((resolve) =>
        setTimeout(() => {
          resolve();
        }, 10000)
      );
      executerInfo.delayIntervel = 0;
      executer(execId);
    } else {
      executer(execId);
    }
  };
  //calling whatsAppApi
  const executer = async (execId) => {
    if (
      exicutableDataContainer.length > 0 &&
      LCCN < exicutableDataContainer.length
    ) {
      if (!executerInfo.isWritable) {
        await (async function delayLoop() {
          if (!executerInfo.isWritable) {
            console.log(
              "------------(((((((((((((((((((((((exicuter-delay-Loop-working))))))))))))))))))))))))))))----------------"
            );
            await new Promise((resolve) =>
              setTimeout(() => {
                resolve();
              }, 150)
            );
            delayLoop();
          } else {
            executerInfo.isWritable = false;
          }
        })();
      } else {
        executerInfo.isWritable = false;
      }
      const currentExecInfo = executerInfo;
      let thisExicuterIfo = currentExecInfo[execId];
      if (thisExicuterIfo.recursion === 200) {
        executerInfo.isWritable = true;
        executerInfo[execId].status = "recursion-exceed";
        RecursionExceededExecuters.push(execId);
      } else {
        const item = exicutableDataContainer[LCCN];
        const plaloadsLength = item.payloads.length;
        const nextIndex = item.nextIndex ? item.nextIndex : 0;
        const totalPayloads = item.totalPayloads;
        const countOfCompleted = item.countOfCompleted
          ? item.countOfCompleted
          : 0;
        if (plaloadsLength > 0 && nextIndex < plaloadsLength) {
          let alertId = item.alertId;
          let payload = item.payloads[nextIndex];
          exicutableDataContainer[LCCN].nextIndex = nextIndex + 1;
          exicutableDataContainer[LCCN].countOfCompleted = countOfCompleted + 1;
          // final message will helped for the database updation of that alert as it is completed
          let finalMessage = null;
          if (countOfCompleted + 1 == totalPayloads) {
            finalMessage = "completed";
            exicutableDataContainer.splice(LCCN, 1);
          } else {
            finalMessage = null;
          }
          if (LCCN + 1 < exicutableDataContainer.length) {
            LCCN++;
          } else if (LCCN + 1 == exicutableDataContainer.length) {
            LCCN = 0;
          } else if (LCCN + 1 > exicutableDataContainer.length) {
            LCCN = 0;
          }
          executerInfo.counter = currentExecInfo.counter + 1;
          executerInfo.delayIntervel++;
          executerInfo.counterLastUpdatedTime = Date.now();
          executerInfo.faultDetector.push(currentExecInfo.counter);
          executerInfo[execId].recursion = thisExicuterIfo.recursion + 1;
          if (thisExicuterIfo.status !== "running") {
            executerInfo[execId].status = "running";
          }
          //accepting callback with params okData and notOkData
          whatsApp.whatsAppApiCaller(
            payload,
            alertId,
            finalMessage,
            execId,
            executerCallback
          );
          executerInfo.isWritable = true;
        } else {
          if (plaloadsLength <= 0) {
            exicutableDataContainer.splice(LCCN, 1);
          } else if (nextIndex > plaloadsLength) {
            systemErrorReporterOnLocal(
              "executer",
              "nextIndex exeeded the plaloadsLength"
            );
            exicutableDataContainer.splice(LCCN, 1);
          }
        }
      }
    } else {
      if (exicutableDataContainer.length <= 0) {
        executerInfo[execId].status = "stoped";
      }
      if (LCCN >= exicutableDataContainer.length) {
        systemErrorReporterOnLocal(
          "executer",
          "LCCN exeeded the exicutableDataContainer.length"
        );
      }
    }
  };
  //runExicuter: it calls exeCuter . it is initializer of exicution stage
  const runExicuter = () => {
    let stopedArray = [];
    let currExecInfo1 = executerInfo;
    for (const key in currExecInfo1) {
      if (
        key === "a" ||
        key === "b" ||
        key === "c" ||
        key === "d" ||
        key === "e"
      ) {
        let itemStatus = currExecInfo1[key].status;
        if (itemStatus === "stoped") {
          stopedArray.push(key);
        }
      }
    }
    if (stopedArray.length === 5) {
      if (executerInfo.status !== "stoped") {
        executerInfo.status = "stoped";
      }
    }
    if (exicutableDataContainer.length > 0) {
      let isNewInitializing = true;
      let array = [];
      let currentExecInfo = executerInfo;
      for (const key in currentExecInfo) {
        if (
          key === "a" ||
          key === "b" ||
          key === "c" ||
          key === "d" ||
          key === "e"
        ) {
          let itemStatus = currentExecInfo[key].status;
          if (itemStatus !== "stoped") {
            array.push(key);
          }
        }
      }

      if (array.length > 0) {
        isNewInitializing = false;
        if (executerInfo.status !== "running") {
          executerInfo.status = "running";
        }
      }

      if (isNewInitializing) {
        const arr = ["a", "b", "c", "d", "e"];
        for (let i = 0; i < arr.length; i++) {
          executer(arr[i]);
        }
      } else {
        if (RecursionExceededExecuters.length > 0) {
          for (let i = 0; i < RecursionExceededExecuters.length; i++) {
            executerInfo[RecursionExceededExecuters[i]] = {
              recursion: 0,
              status: "running",
            };
            executer(RecursionExceededExecuters[i]);
          }
          RecursionExceededExecuters = [];
        }
      }
    }
  };
  //lister : handling whole the system by callin fuctions on intervels
  const linstener = async () => {
    const intervel = setInterval(() => {
      console.log({
        tag: TAG + "linstener",
        // message:
        //   "====================================================================================================",
        listnerCounter,
        // exicutableDataContainer,
        exicutableDataContainerLenth: exicutableDataContainer.length,
        proccessedDataContainerLength: proccessedDataContainer.length,
        // proccessedDataContainer,
        exicutionCompletedContainerItems,
        executerErrorBucket,
        executerInfo,
        exicuterFaultDetectorReport,
        alertDatabaseUpdaterInfo,
        databaseUpdateErrorBucket,
        listnerCommand,
        listnercountDown,
      });
      listnerCounter++;
      loadAlerts();
      runExicuter();
      executerFaultDetector();
      alertDatabaseUpdater();
      commander();
      //listener termination proccess
      if (listnerCommand === "terminate") {
        if (listnercountDown > 0) {
          listnercountDown--;
        }
        if (listnercountDown === 0) {
          clearInterval(intervel);
          systemCM.systemConfigUpdate({
            is_listener_running: false,
            listener_tracker: [0],
          });
        }
      }
    }, 500);
  };
  const requestManager = async () => {
    //campaign queue details
    const cmq = await campQM.save(req.params.id);
    if (cmq === null) {
      const cmq2 = await campQM.save(req.params.id);
      if (cmq2 === null) {
        systemErrorReporter(
          "campaignQueueError",
          "can not Update alerts in to Queue  --requestManger"
        );
      } else {
        console.log({
          tag: TAG + "requestManager",
          message: "new campaign ---cmq2 queued",
        });
      }
    } else {
      console.log({
        tag: TAG + "requestManager",
        message: "new campaign ---cmq queued",
      });
    }
    //system config details
    // const scm = await systemCM.save(true, listnerCounter);
    // if (scm === null) {
    //   const scm2 = await systemCM.save(true, listnerCounter);
    //   if (scm2 === null) {
    //     systemErrorReporter(
    //       "systemConfigSaveError",
    //       "can not save listner data into db --requestManger"
    //     );
    //   }
    // }
    let systemConfigData = await systemCM.findOne();
    console.log("[[[[[[[[[[[[[[[[[]]]]]]]]]]]]]");
    console.log(systemConfigData);
    if (systemConfigData) {
      if (!systemConfigData.is_listener_running) {
        const scm = await systemCM.systemConfigUpdate({
          is_listener_running: true,
          listener_tracker: [0],
        });
        if (scm === null) {
          const scm2 = await systemCM.systemConfigUpdate({
            is_listener_running: true,
            listener_tracker: [0],
          });
          if (scm2 === null) {
            systemErrorReporter(
              "systemConfigError",
              "can not save listner data into db --requestManger"
            );
          } else {
            linstener();
            console.log({
              tag: TAG + "requestManager",
              message:
                "system configue --scm2. updated ,listener started running",
            });
          }
        } else {
          linstener();
          console.log({
            tag: TAG + "requestManager",
            message: "system configue --scm. updated ,listener started running",
          });
        }
      } else {
        if (listnercountDown > 0) {
          listnerCommand = "";
          listnercountDown = -2;
        }
        console.log({
          tag: TAG + "requestManager",
          message: "system configue listern is in running already",
        });
      }
    } else {
      systemErrorReporter(
        "systemConfigError",
        "can not find listner data from db --requestManger"
      );
      console.log({
        tag: TAG + "requestManager",
        message: "system configue not found",
      });
    }
    //calling system error analyser
    systemErrorAnalyser(systemErrorReportOnDB);
  };
  //initiator initiator initiator
  //initiator initiator initiator
  //initiator initiator initiator
  requestManager();
  res.status(200).json({ message: "request accepted" });
});
//new system - 1 exicuters
router.post("/sendAlert_csv7--paused/:id", async (req, res) => {
  const TAG = "sendAlert_csv7";
  const IdOfsystemConfigration = "62d4db8ebb4c949a10b775b4";
  // below data can control the system, it altered by commander function
  //---------------------------------------------------
  //---------------------------------------------------
  //---------------------------------------------------
  var listnerCommand = ""; // terminate
  var listnercountDown = -1; // -1 default ,-2 disabled
  //---------------------------------------------------
  //---------------------------------------------------
  //---------------------------------------------------
  //---------------------------------------------------
  //exicutableDataContainer is a two diamentional container
  const exicutableDataContainer = [];
  //processedDataContainer: it is the to be updated in database ,elemets is object like {alertId,ph,res_data}
  const proccessedDataContainer = [];
  //exicutionCompletedItems: it is the data of completed item of exicutableDataContainer;
  const exicutionCompletedContainerItems = [];
  //executerErrorBucket is a data container ,it filled by the executer when failing the whatsApp-api calls
  const executerErrorBucket = [];
  var listnerCounter = 0;
  var systemErrorReportOnDB = {
    tag: "systemErrorReportOnDB",
    campaignQueueError: "",
    systemConfigError: "",
  };
  var systemErrorReportOnLocal = {
    tag: "systemErrorReportOnLocal",
    executer: "",
  };
  //LCCN : Last Called Colum Number
  var LCCN = 0;
  //executerInfo: it is the info about executer. about the recution,and status.
  var executerInfo = {
    counter: 0,
    delayIntervel: 0,
    counterLastUpdatedTime: null,
    faultDetector: [],
    status: "stoped", //running or stoped
    isWritable: true,
    a: { recursion: 0, status: "stoped" },
    b: { recursion: 0, status: "stoped" },
    c: { recursion: 0, status: "stoped" },
    d: { recursion: 0, status: "stoped" },
    e: { recursion: 0, status: "stoped" },
    //the status willbe enum of [stoped,recursion-exceed,running]
  };
  //executerRecursionHolder: whenever the any one of five executer exceeded the recurion limit ,that info will appear hear eg: [a,b,e],
  var RecursionExceededExecuters = [];
  //exicuterFaultDetectorReport: it is the report of unexpected exicuter is working or not
  var exicuterFaultDetectorReport = [];
  //alertDatabaseUpdaterInfo: it is a info about alertDatabaseUpdater
  var alertDatabaseUpdaterInfo = {
    status: "stoped", //running or stoped
    reTryStatus: "stoped", //running or stoped
    finalAlertStatus: "stoped", //running or stoped
  };
  //databaseUpdateErrorBucket: is the alertData have to update to db,and it got when alertDatabaseUpdater-trackUpdater catch err .
  var databaseUpdateErrorBucket = []; //element->{ id, track }
  var preparationStageStatus = {
    status: "",
    csvReadingStatus: "",
    generatingExicutableStatus: "",
    preparationStageListeningResource: [], //{ status: "running",  uuid, }
  };
  //RequestMangerNewAlertAvailble: it will altered by request manager and loadAlert
  var RequestMangerNewAlertAvailble = false;

  const commander = () => {
    if (preparationStageStatus.preparationStageListeningResource.length > 0) {
      // preparationStageStatus.status = "running";
      // let find = preparationStageStatus.preparationStageListeningResource.find(
      //   (e) => e.status === "running"
      // );
    } else {
      preparationStageStatus.status = "stoped";
    }

    if (
      executerInfo.status === "stoped" &&
      alertDatabaseUpdaterInfo.status === "stoped" &&
      alertDatabaseUpdaterInfo.reTryStatus === "stoped" &&
      alertDatabaseUpdaterInfo.finalAlertStatus === "stoped" &&
      preparationStageStatus.status === "stoped" &&
      !RequestMangerNewAlertAvailble
    ) {
      if (listnerCommand !== "terminate") {
        listnerCommand = "terminate";
        listnercountDown = 50;
      }
    } else {
      listnerCommand = "";
      listnercountDown = -2;
    }
  };

  //alertDatabaseUpdater : it will manage trackupdation of each alertApicalls and if alert completed it will update the status
  const alertDatabaseUpdater = () => {
    const trackUpdater = async (id, track) => {
      // let track = {
      //     status: 'SUCCESS',
      //      ph:889999999,
      //      res_data:<response>,
      // }
      await application
        .findByIdAndUpdate(id, {
          $push: {
            whatsapp_alert_track: track,
          },
        })
        .then((data) => {})
        .catch((err) => {
          databaseUpdateErrorBucket.push({ id, track });
        });
    };
    if (alertDatabaseUpdaterInfo.status !== "running") {
      const alertDatabaseUpdater1 = async () => {
        if (proccessedDataContainer.length > 0) {
          alertDatabaseUpdaterInfo.status = "running";
          let n = 0;
          while (n < 100) {
            let item = proccessedDataContainer[0];
            proccessedDataContainer.shift();
            await new Promise((resolve) =>
              setTimeout(() => {
                resolve();
              }, 30)
            );
            trackUpdater(item.alertId, {
              status: item.status,
              res_data: item.res_data,
              ph: item.ph,
            });
            if (proccessedDataContainer.length > 0) {
              n = 1;
            } else {
              alertDatabaseUpdaterInfo.status = "stoped";
              n = 100;
            }
          }
        }
      };
      alertDatabaseUpdater1();
    }
    if (alertDatabaseUpdaterInfo.reTryStatus !== "running") {
      const alertDatabaseUpdater2OnErrorBase = async () => {
        if (databaseUpdateErrorBucket.length > 0) {
          alertDatabaseUpdaterInfo.reTryStatus = "running";
          let n = 0;
          while (n < 100) {
            let item = databaseUpdateErrorBucket[0];
            databaseUpdateErrorBucket.shift();
            await new Promise((resolve) =>
              setTimeout(() => {
                resolve();
              }, 50)
            );
            trackUpdater(item.id, item.track);
            if (databaseUpdateErrorBucket.length > 0) {
              n = 1;
            } else {
              alertDatabaseUpdaterInfo.reTryStatus = "stoped";
              n = 100;
            }
          }
        }
      };
      alertDatabaseUpdater2OnErrorBase();
    }

    if (alertDatabaseUpdaterInfo.finalAlertStatus !== "running") {
      const updateProcessedAlert = async (alertId) => {
        await application
          .findByIdAndUpdate(alertId, {
            alert_status: "PROCESSED",
          })
          .then((data) => {})
          .catch((err) => {
            exicutionCompletedContainerItems.push(alertId);
          });
      };
      (async function () {
        if (exicutionCompletedContainerItems.length > 0) {
          alertDatabaseUpdaterInfo.finalAlertStatus = "running";
          let n = 0;
          while (n < 100) {
            let item = exicutionCompletedContainerItems[0];
            exicutionCompletedContainerItems.shift();
            await new Promise((resolve) =>
              setTimeout(() => {
                resolve();
              }, 400)
            );
            updateProcessedAlert(item);
            if (exicutionCompletedContainerItems.length > 0) {
              n = 1;
            } else {
              alertDatabaseUpdaterInfo.finalAlertStatus = "stoped";
              n = 100;
            }
          }
        }
      })();
    }
  };
  //executerFaultDetector: it will find unexpected exicuter is working or not
  const executerFaultDetector = () => {
    if (executerInfo.faultDetector.length > 50) {
      const faultArray = executerInfo.faultDetector;
      executerInfo.faultDetector = [];
      let dupArra = [];
      for (let i = 0; i < faultArray.length; i++) {
        const item = faultArray[i];
        const found = dupArra.find((e) => e === item);
        dupArra.push(item);
        if (found) {
          exicuterFaultDetectorReport.push("fault");
        }
      }
    }
  };
  //executableDataCreator: it creating whatsappPayloads based on available data in database
  const executableDataCreator = (data, uuid) => {
    const alertId = data._id;
    if (data.data_source === "DYNAMIC") {
      let isDataAvailabe = data ? (data.csv_file ? true : false) : false;
      const bindingData = JSON.parse(data.binding_data);
      let results = [];
      if (isDataAvailabe) {
        fs.createReadStream(data.csv_file)
          .pipe(csv())
          .on("data", (csvData) => {
            results.push(csvData);
          })
          .on("end", () => {
            mainMM.findByIdAndUpdateCsvLength(alertId, results.length);
            let whatsappParamsArray = [];
            for (const csvData of results) {
              let whatsappParams = {
                name: "",
                email_id: "",
                roll_number: "",
                phone_number: "",
              };
              for (const key in whatsappParams) {
                let type = bindingData[key].type;
                if (type === "csv_data") {
                  // console.log('........alertId............csvdata.........');
                  let csv_key = bindingData[key].value;
                  whatsappParams[key] = csvData[csv_key]
                    ? csvData[csv_key]
                    : "";
                } else if (type === "type_data") {
                  // console.log('....................type_data.........');
                  whatsappParams[key] = data[key] ? data[key] : "";
                }
              }
              // console.log(whatsappParams);
              let errFound = utility.whatsappParamsValidation(whatsappParams);

              if (!errFound) {
                whatsappParamsArray.push(whatsappParams);
              }
            }
            exicutableDataContainer.push({
              alertId,
              payloads: whatsappParamsArray,
              totalPayloads: whatsappParamsArray.length,
            });
            const fileterd =
              preparationStageStatus.preparationStageListeningResource.filter(
                (e) => e.uuid !== uuid
              );
            preparationStageStatus.preparationStageListeningResource = fileterd;
            preparationStageStatus.generatingExicutableStatus = "stoped";
          });
      } else {
        console.log({
          tag: TAG + "runSystem-csv finder",
          message: "csv fle not found",
        });
      }
    } else if (data.data_source === "STATIC") {
      console.log({
        tag: TAG + "runSystem-> appliction-type-chooser",
        message: "STATIC NOT WORKING",
      });
    }
  };
  //loading alerts
  const loadAlerts = async () => {
    let foundNew = false;
    let alertData = null;
    const dataBaseInfo = await dataBaseChecker.dataBaseChecker();
    const uuid =
      Date.now() +
      preparationStageStatus.preparationStageListeningResource.length;
    // console.log({ tag: TAG + " loadAlerts", dataBaseInfo });
    if (dataBaseInfo) {
      foundNew = true;
      preparationStageStatus.preparationStageListeningResource.push({
        status: "running",
        uuid,
      });
      preparationStageStatus.status = "running";
    } else {
      RequestMangerNewAlertAvailble = false;
    }
    if (foundNew) {
      preparationStageStatus.csvReadingStatus = "running";
      alertData = await loadCampaignData.loadCampaignData(
        dataBaseInfo.campaignId
      );
      if (alertData) {
        preparationStageStatus.csvReadingStatus = "stoped";
        let deletion = campQM.deleteById(dataBaseInfo._id);
        if (deletion) {
          console.log({ tag: TAG + " loadAlerts", deletion });
        } else {
          console.log({ tag: TAG + " loadAlerts", message: "failed" });
        }
        // mainMM.findByIdAndUpdateAlertStatus(
        //   dataBaseInfo.campaignId,
        //   "PROCESSING"
        // );
      }
      console.log({ tag: TAG + " loadAlerts", alertData });
    }
    if (alertData) {
      preparationStageStatus.generatingExicutableStatus = "running";
      executableDataCreator(alertData, uuid);
    }
  };
  //linsterManager
  const listnerManager = async () => {
    if (listnerCounter !== 0) {
      systemCM.updateListnerTrack(listnerCounter);
    }
    listnerCounter++;
    if (listnerCounter >= 10000) {
      systemCM.updateListner({ listener_tracker: [0] });
      listnerCounter = 0;
    }
  };
  //system Error reporter
  const systemErrorReporter = (key, value) => {
    systemErrorReportOnDB[key] = value;
  };
  //system Error reporter on local
  const systemErrorReporterOnLocal = (key, value) => {
    systemErrorReportOnLocal[key] = value;
  };
  // systemErrorAnalyser
  const systemErrorAnalyser = async (obj) => {
    let stoper = 0;
    for (const key in obj) {
      if ((stoper = 0)) {
        if (obj[key] != "") {
          stoper = 1;
          console.log({
            tag: TAG + "systemErrorAnalyser",
            message:
              "error detected ######################################################################",
            message2:
              "error detected ######################################################################",
            message3:
              "error detected ######################################################################",
            errorReport: obj,
          });
        }
      }
    }
  };
  //executerCallback: to fillthe executerErrorBucket;
  const executerCallback = async (okData, notOkData, finalMessage, execId) => {
    if (okData) {
      proccessedDataContainer.push(okData);
    }
    if (notOkData) {
      //executerErrorBucket : this feature not yet avaible
      executerErrorBucket.push(notOkData);
      // proccessedDataContainer.push(notOkData);
    }
    if (finalMessage) {
      exicutionCompletedContainerItems.push(finalMessage);
    }
    if (executerInfo.delayIntervel >= 20) {
      // await new Promise((resolve) =>
      //   setTimeout(() => {
      //     resolve();
      //   }, 500)
      // );
      executerInfo.delayIntervel = 0;
      executer(execId);
    } else {
      executer(execId);
    }
  };
  //calling whatsAppApi
  const executer = async (execId) => {
    if (
      exicutableDataContainer.length > 0 &&
      LCCN < exicutableDataContainer.length
    ) {
      if (!executerInfo.isWritable) {
        await (async function delayLoop() {
          if (!executerInfo.isWritable) {
            console.log(
              "------------(((((((((((((((((((((((exicuter-delay-Loop-working))))))))))))))))))))))))))))----------------"
            );
            await new Promise((resolve) =>
              setTimeout(() => {
                resolve();
              }, 150)
            );
            delayLoop();
          } else {
            executerInfo.isWritable = false;
          }
        })();
      } else {
        executerInfo.isWritable = false;
      }
      const currentExecInfo = executerInfo;
      let thisExicuterIfo = currentExecInfo[execId];
      if (thisExicuterIfo.recursion === 200) {
        executerInfo.isWritable = true;
        executerInfo[execId].status = "recursion-exceed";
        RecursionExceededExecuters.push(execId);
      } else {
        const item = exicutableDataContainer[LCCN];
        const plaloadsLength = item.payloads.length;
        const nextIndex = item.nextIndex ? item.nextIndex : 0;
        const totalPayloads = item.totalPayloads;
        const countOfCompleted = item.countOfCompleted
          ? item.countOfCompleted
          : 0;
        if (plaloadsLength > 0 && nextIndex < plaloadsLength) {
          let alertId = item.alertId;
          let payload = item.payloads[nextIndex];
          exicutableDataContainer[LCCN].nextIndex = nextIndex + 1;
          exicutableDataContainer[LCCN].countOfCompleted = countOfCompleted + 1;
          // final message will helped for the database updation of that alert as it is completed
          let finalMessage = null;
          if (countOfCompleted + 1 == totalPayloads) {
            finalMessage = "completed";
            exicutableDataContainer.splice(LCCN, 1);
          } else {
            finalMessage = null;
          }
          if (LCCN + 1 < exicutableDataContainer.length) {
            LCCN++;
          } else if (LCCN + 1 == exicutableDataContainer.length) {
            LCCN = 0;
          } else if (LCCN + 1 > exicutableDataContainer.length) {
            LCCN = 0;
          }
          executerInfo.counter = currentExecInfo.counter + 1;
          executerInfo.delayIntervel++;
          executerInfo.counterLastUpdatedTime = Date.now();
          executerInfo.faultDetector.push(currentExecInfo.counter);
          executerInfo[execId].recursion = thisExicuterIfo.recursion + 1;
          if (thisExicuterIfo.status !== "running") {
            executerInfo[execId].status = "running";
          }
          //accepting callback with params okData and notOkData
          whatsApp.whatsAppApiCaller(
            payload,
            alertId,
            finalMessage,
            execId,
            executerCallback
          );
          executerInfo.isWritable = true;
        } else {
          if (plaloadsLength <= 0) {
            exicutableDataContainer.splice(LCCN, 1);
          } else if (nextIndex > plaloadsLength) {
            systemErrorReporterOnLocal(
              "executer",
              "nextIndex exeeded the plaloadsLength"
            );
            exicutableDataContainer.splice(LCCN, 1);
          }
        }
      }
    } else {
      if (exicutableDataContainer.length <= 0) {
        executerInfo[execId].status = "stoped";
      }
      if (LCCN >= exicutableDataContainer.length) {
        systemErrorReporterOnLocal(
          "executer",
          "LCCN exeeded the exicutableDataContainer.length"
        );
      }
    }
  };
  //runExicuter: it calls exeCuter . it is initializer of exicution stage
  const runExicuter = () => {
    let stopedArray = [];
    let currExecInfo1 = executerInfo;
    for (const key in currExecInfo1) {
      if (
        key === "a" ||
        key === "b" ||
        key === "c" ||
        key === "d" ||
        key === "e"
      ) {
        let itemStatus = currExecInfo1[key].status;
        if (itemStatus === "stoped") {
          stopedArray.push(key);
        }
      }
    }
    if (stopedArray.length === 5) {
      if (executerInfo.status !== "stoped") {
        executerInfo.status = "stoped";
      }
    }
    if (exicutableDataContainer.length > 0) {
      let isNewInitializing = true;
      let array = [];
      let currentExecInfo = executerInfo;
      for (const key in currentExecInfo) {
        if (
          key === "a" ||
          key === "b" ||
          key === "c" ||
          key === "d" ||
          key === "e"
        ) {
          let itemStatus = currentExecInfo[key].status;
          if (itemStatus !== "stoped") {
            array.push(key);
          }
        }
      }

      if (array.length > 0) {
        isNewInitializing = false;
        if (executerInfo.status !== "running") {
          executerInfo.status = "running";
        }
      }

      if (isNewInitializing) {
        // const arr = ["a", "b", "c","d","e"];
        const arr = ["a"];
        for (let i = 0; i < arr.length; i++) {
          executer(arr[i]);
        }
      } else {
        if (RecursionExceededExecuters.length > 0) {
          for (let i = 0; i < RecursionExceededExecuters.length; i++) {
            executerInfo[RecursionExceededExecuters[i]] = {
              recursion: 0,
              status: "running",
            };
            executer(RecursionExceededExecuters[i]);
          }
          RecursionExceededExecuters = [];
        }
      }
    }
  };
  //lister : handling whole the system by callin fuctions on intervels
  const linstener = async () => {
    const intervel = setInterval(() => {
      console.log({
        tag: TAG + "linstener",
        // message:
        //   "====================================================================================================",
        listnerCounter,
        // exicutableDataContainer,
        exicutableDataContainerLenth: exicutableDataContainer.length,
        proccessedDataContainerLength: proccessedDataContainer.length,
        // proccessedDataContainer,
        exicutionCompletedContainerItems,
        executerErrorBucket,
        executerInfo,
        exicuterFaultDetectorReport,
        alertDatabaseUpdaterInfo,
        databaseUpdateErrorBucket,
        preparationStageStatus,
        RequestMangerNewAlertAvailble,
        listnerCommand,
        listnercountDown,
      });
      listnerCounter++;
      loadAlerts();
      runExicuter();
      executerFaultDetector();
      alertDatabaseUpdater();
      commander();
      //listener termination proccess
      if (listnerCommand === "terminate") {
        if (listnercountDown > 0) {
          listnercountDown--;
        }
        if (listnercountDown === 0) {
          clearInterval(intervel);
          systemCM.systemConfigUpdate({
            is_listener_running: false,
            listener_tracker: [0],
          });
        }
      }
    }, 500);
  };
  const requestManager = async () => {
    RequestMangerNewAlertAvailble = true;
    //campaign queue details
    const cmq = await campQM.save(req.params.id);
    if (cmq === null) {
      const cmq2 = await campQM.save(req.params.id);
      if (cmq2 === null) {
        systemErrorReporter(
          "campaignQueueError",
          "can not Update alerts in to Queue  --requestManger"
        );
      } else {
        mainMM.findByIdAndUpdateAlertStatus(req.params.id, "PROCESSING");
        console.log({
          tag: TAG + "requestManager",
          message: "new campaign ---cmq2 queued",
        });
      }
    } else {
      mainMM.findByIdAndUpdateAlertStatus(req.params.id, "PROCESSING");
      console.log({
        tag: TAG + "requestManager",
        message: "new campaign ---cmq queued",
      });
    }
    //system config details
    // const scm = await systemCM.save(true, listnerCounter);
    // if (scm === null) {
    //   const scm2 = await systemCM.save(true, listnerCounter);
    //   if (scm2 === null) {
    //     systemErrorReporter(
    //       "systemConfigSaveError",
    //       "can not save listner data into db --requestManger"
    //     );
    //   }
    // }
    let systemConfigData = await systemCM.findOne();
    console.log("[[[[[[[[[[[[[[[[[]]]]]]]]]]]]]");
    console.log(systemConfigData);
    if (systemConfigData) {
      if (!systemConfigData.is_listener_running) {
        const scm = await systemCM.systemConfigUpdate({
          is_listener_running: true,
          listener_tracker: [0],
        });
        if (scm === null) {
          const scm2 = await systemCM.systemConfigUpdate({
            is_listener_running: true,
            listener_tracker: [0],
          });
          if (scm2 === null) {
            systemErrorReporter(
              "systemConfigError",
              "can not save listner data into db --requestManger"
            );
          } else {
            linstener();
            console.log({
              tag: TAG + "requestManager",
              message:
                "system configue --scm2. updated ,listener started running",
            });
          }
        } else {
          linstener();
          console.log({
            tag: TAG + "requestManager",
            message: "system configue --scm. updated ,listener started running",
          });
        }
      } else {
        if (listnercountDown > 0) {
          listnerCommand = "";
          listnercountDown = -2;
        }
        console.log({
          tag: TAG + "requestManager",
          message: "system configue listern is in running already",
        });
      }
    } else {
      systemErrorReporter(
        "systemConfigError",
        "can not find listner data from db --requestManger"
      );
      console.log({
        tag: TAG + "requestManager",
        message: "system configue not found",
      });
    }
    //calling system error analyser
    systemErrorAnalyser(systemErrorReportOnDB);
  };
  //initiator initiator initiator
  //initiator initiator initiator
  //initiator initiator initiator
  requestManager();
  await new Promise((resolve) =>
    setTimeout(() => {
      resolve();
    }, 500)
  );
  res.status(200).json({ message: "request accepted" });
});
// used cloude api
router.post("/sendAlert_csv7/:id", async (req, res) => {
  const TAG = "sendAlert_csv7";
  const IdOfsystemConfigration = "62d4db8ebb4c949a10b775b4";
  // below data can control the system, it altered by commander function
  //---------------------------------------------------
  //---------------------------------------------------
  //---------------------------------------------------
  var listnerCommand = ""; // terminate
  var listnercountDown = -1; // -1 default ,-2 disabled
  //---------------------------------------------------
  //---------------------------------------------------
  //---------------------------------------------------
  //---------------------------------------------------
  //exicutableDataContainer is a two diamentional container
  const exicutableDataContainer = [];
  //processedDataContainer: it is the to be updated in database ,elemets is object like {alertId,ph,res_data}
  const proccessedDataContainer = [];
  //exicutionCompletedItems: it is the data of completed item of exicutableDataContainer;
  const exicutionCompletedContainerItems = [];
  //executerErrorBucket is a data container ,it filled by the executer when failing the whatsApp-api calls
  const executerErrorBucket = [];
  const executerRecursionLimit = 1000;
  var listnerCounter = 0;
  var systemErrorReportOnDB = {
    tag: "systemErrorReportOnDB",
    campaignQueueError: "",
    systemConfigError: "",
  };
  var systemErrorReportOnLocal = {
    tag: "systemErrorReportOnLocal",
    executer: "",
  };
  //LCCN : Last Called Colum Number
  var LCCN = 0;
  //executerInfo: it is the info about executer. about the recution,and status.
  var executerInfo = {
    counter: 0,
    delayIntervel: 0,
    counterLastUpdatedTime: null,
    faultDetector: [],
    status: "stoped", //running or stoped
    isWritable: true,
    a: { recursion: 0, status: "stoped" },
    b: { recursion: 0, status: "stoped" },
    c: { recursion: 0, status: "stoped" },
    d: { recursion: 0, status: "stoped" },
    e: { recursion: 0, status: "stoped" },
    //the status willbe enum of [stoped,recursion-exceed,running]
  };
  //executerRecursionHolder: whenever the any one of five executer exceeded the recurion limit ,that info will appear hear eg: [a,b,e],
  var RecursionExceededExecuters = [];
  //exicuterFaultDetectorReport: it is the report of unexpected exicuter is working or not
  var exicuterFaultDetectorReport = [];
  //alertDatabaseUpdaterInfo: it is a info about alertDatabaseUpdater
  var alertDatabaseUpdaterInfo = {
    status: "stoped", //running or stoped
    reTryStatus: "stoped", //running or stoped
    finalAlertStatus: "stoped", //running or stoped
  };
  //databaseUpdateErrorBucket: is the alertData have to update to db,and it got when alertDatabaseUpdater-trackUpdater catch err .
  var databaseUpdateErrorBucket = []; //element->{ id, track }
  var preparationStageStatus = {
    status: "",
    csvReadingStatus: "",
    generatingExicutableStatus: "",
    preparationStageListeningResource: [], //{ status: "running",  uuid, }
  };
  //RequestMangerNewAlertAvailble: it will altered by request manager and loadAlert
  var RequestMangerNewAlertAvailble = false;

  const commander = () => {
    if (preparationStageStatus.preparationStageListeningResource.length > 0) {
      // preparationStageStatus.status = "running";
      // let find = preparationStageStatus.preparationStageListeningResource.find(
      //   (e) => e.status === "running"
      // );
    } else {
      preparationStageStatus.status = "stoped";
    }

    if (
      executerInfo.status === "stoped" &&
      alertDatabaseUpdaterInfo.status === "stoped" &&
      alertDatabaseUpdaterInfo.reTryStatus === "stoped" &&
      alertDatabaseUpdaterInfo.finalAlertStatus === "stoped" &&
      preparationStageStatus.status === "stoped" &&
      !RequestMangerNewAlertAvailble
    ) {
      if (listnerCommand !== "terminate") {
        listnerCommand = "terminate";
        listnercountDown = 50;
      }
    } else {
      listnerCommand = "";
      listnercountDown = -2;
    }
  };

  //alertDatabaseUpdater : it will manage trackupdation of each alertApicalls and if alert completed it will update the status
  const alertDatabaseUpdater = () => {
    const cassandraDbUpdater = (resData) => {
      // const res_data = {
      //   messaging_product: "whatsapp",
      //   contacts: [{ input: "918301848679", wa_id: "918301848679" }],
      //   messages: [
      //     {
      //       id: "wamid.HBgMOTE4MzAxODQ4Njc5FQIAERgSRkI2OTQ1NEVCQTk3MjhFQUQ1AA==",
      //     },
      //   ],
      // };

      // message_id | deliverd_datetime | failed_datetime | failed_reson | final_status
      // | form_number | message_content | message_datetime | read_datetime |
      //  recieved_datetime | send_datetime | to_number
      // console.log({ tag: "cassandraDbUpdter", resData });
      const message_id = resData.messages[0].id;
      const form_number = resData.contacts[0].input;
      const to_number = resData.contacts[0].wa_id;
      const message_content = {
        type: "template",
        name: "test_n",
        parameters: ["<name>\\n"],
      };
      const insertMessageQuarry =
        "INSERT INTO test.mis2 (message_id, form_number, to_number, message_content) VALUES (?,?,?,?)";
      const params = [
        message_id,
        form_number,
        to_number,
        JSON.stringify(message_content),
      ];
      cassandraDb.insertOrUpdateData(
        insertMessageQuarry,
        params,
        (err, data) => {
          if (err) {
            console.log({ TAG: "cassandraDbUpdter", err });
          } else {
            // console.log({ TAG: "cassandraDbUpdter", dbresponse: data });
          }
        }
      );
    };

    const trackUpdater = async (id, track) => {
      // let track = {
      //     status: 'SUCCESS',
      //      ph:889999999,
      //      res_data:<response>,
      // }
      await application
        .findByIdAndUpdate(id, {
          $push: {
            whatsapp_alert_track: track,
          },
        })
        .then((data) => {})
        .catch((err) => {
          databaseUpdateErrorBucket.push({ id, track });
        });
    };

    if (alertDatabaseUpdaterInfo.status !== "running") {
      const alertDatabaseUpdater1 = async () => {
        if (proccessedDataContainer.length > 0) {
          alertDatabaseUpdaterInfo.status = "running";
          let n = 0;
          while (n < 100) {
            let item = proccessedDataContainer[0];
            proccessedDataContainer.shift();
            await new Promise((resolve) =>
              setTimeout(() => {
                resolve();
              }, 30)
            );
            console.log("{{{{{{{{{{{{{{{{{{{{{{{}}}}}}}}}}}}}}}}}}}}}}}");
            console.log(item);
            cassandraDbUpdater(JSON.parse(item.res_data));
            trackUpdater(item.alertId, {
              status: item.status,
              res_data: item.res_data,
              ph: item.ph,
            });
            if (proccessedDataContainer.length > 0) {
              n = 1;
            } else {
              alertDatabaseUpdaterInfo.status = "stoped";
              n = 100;
            }
          }
        }
      };
      alertDatabaseUpdater1();
    }
    if (alertDatabaseUpdaterInfo.reTryStatus !== "running") {
      const alertDatabaseUpdater2OnErrorBase = async () => {
        if (databaseUpdateErrorBucket.length > 0) {
          alertDatabaseUpdaterInfo.reTryStatus = "running";
          let n = 0;
          while (n < 100) {
            let item = databaseUpdateErrorBucket[0];
            databaseUpdateErrorBucket.shift();
            await new Promise((resolve) =>
              setTimeout(() => {
                resolve();
              }, 50)
            );
            trackUpdater(item.id, item.track);
            if (databaseUpdateErrorBucket.length > 0) {
              n = 1;
            } else {
              alertDatabaseUpdaterInfo.reTryStatus = "stoped";
              n = 100;
            }
          }
        }
      };
      alertDatabaseUpdater2OnErrorBase();
    }

    if (alertDatabaseUpdaterInfo.finalAlertStatus !== "running") {
      const updateProcessedAlert = async (alertId) => {
        await application
          .findByIdAndUpdate(alertId, {
            alert_status: "PROCESSED",
          })
          .then((data) => {})
          .catch((err) => {
            exicutionCompletedContainerItems.push(alertId);
          });
      };
      (async function () {
        if (exicutionCompletedContainerItems.length > 0) {
          alertDatabaseUpdaterInfo.finalAlertStatus = "running";
          let n = 0;
          while (n < 100) {
            let item = exicutionCompletedContainerItems[0];
            exicutionCompletedContainerItems.shift();
            await new Promise((resolve) =>
              setTimeout(() => {
                resolve();
              }, 400)
            );
            updateProcessedAlert(item);
            if (exicutionCompletedContainerItems.length > 0) {
              n = 1;
            } else {
              alertDatabaseUpdaterInfo.finalAlertStatus = "stoped";
              n = 100;
            }
          }
        }
      })();
    }
  };
  //executerFaultDetector: it will find unexpected exicuter is working or not
  const executerFaultDetector = () => {
    if (executerInfo.faultDetector.length > 50) {
      const faultArray = executerInfo.faultDetector;
      executerInfo.faultDetector = [];
      let dupArra = [];
      for (let i = 0; i < faultArray.length; i++) {
        const item = faultArray[i];
        const found = dupArra.find((e) => e === item);
        dupArra.push(item);
        if (found) {
          exicuterFaultDetectorReport.push("fault");
        }
      }
    }
  };
  //executableDataCreator: it creating whatsappPayloads based on available data in database
  const executableDataCreator = (data, uuid) => {
    const alertId = data._id;
    if (data.data_source === "DYNAMIC") {
      let isDataAvailabe = data ? (data.csv_file ? true : false) : false;
      const bindingData = JSON.parse(data.binding_data);
      let results = [];
      if (isDataAvailabe) {
        fs.createReadStream(data.csv_file)
          .pipe(csv())
          .on("data", (csvData) => {
            results.push(csvData);
          })
          .on("end", () => {
            mainMM.findByIdAndUpdateCsvLength(alertId, results.length);
            let whatsappParamsArray = [];
            for (const csvData of results) {
              let whatsappParams = {
                name: "",
                email_id: "",
                roll_number: "",
                phone_number: "",
              };
              for (const key in whatsappParams) {
                let type = bindingData[key].type;
                if (type === "csv_data") {
                  // console.log('........alertId............csvdata.........');
                  let csv_key = bindingData[key].value;
                  whatsappParams[key] = csvData[csv_key]
                    ? csvData[csv_key]
                    : "";
                } else if (type === "type_data") {
                  // console.log('....................type_data.........');
                  whatsappParams[key] = data[key] ? data[key] : "";
                }
              }
              // console.log(whatsappParams);
              let errFound = utility.whatsappParamsValidation(whatsappParams);

              if (!errFound) {
                whatsappParamsArray.push(whatsappParams);
              }
            }
            exicutableDataContainer.push({
              alertId,
              payloads: whatsappParamsArray,
              totalPayloads: whatsappParamsArray.length,
            });
            const fileterd =
              preparationStageStatus.preparationStageListeningResource.filter(
                (e) => e.uuid !== uuid
              );
            preparationStageStatus.preparationStageListeningResource = fileterd;
            preparationStageStatus.generatingExicutableStatus = "stoped";
          });
      } else {
        console.log({
          tag: TAG + "runSystem-csv finder",
          message: "csv fle not found",
        });
      }
    } else if (data.data_source === "STATIC") {
      console.log({
        tag: TAG + "runSystem-> appliction-type-chooser",
        message: "STATIC NOT WORKING",
      });
    }
  };
  //loading alerts
  const loadAlerts = async () => {
    let foundNew = false;
    let alertData = null;
    const dataBaseInfo = await dataBaseChecker.dataBaseChecker();
    const uuid =
      Date.now() +
      preparationStageStatus.preparationStageListeningResource.length;
    // console.log({ tag: TAG + " loadAlerts", dataBaseInfo });
    if (dataBaseInfo) {
      foundNew = true;
      preparationStageStatus.preparationStageListeningResource.push({
        status: "running",
        uuid,
      });
      preparationStageStatus.status = "running";
    } else {
      RequestMangerNewAlertAvailble = false;
    }
    if (foundNew) {
      preparationStageStatus.csvReadingStatus = "running";
      alertData = await loadCampaignData.loadCampaignData(
        dataBaseInfo.campaignId
      );
      if (alertData) {
        preparationStageStatus.csvReadingStatus = "stoped";
        let deletion = campQM.deleteById(dataBaseInfo._id);
        if (deletion) {
          console.log({ tag: TAG + " loadAlerts", deletion });
        } else {
          console.log({ tag: TAG + " loadAlerts", message: "failed" });
        }
        // mainMM.findByIdAndUpdateAlertStatus(
        //   dataBaseInfo.campaignId,
        //   "PROCESSING"
        // );
      }
      console.log({ tag: TAG + " loadAlerts", alertData });
    }
    if (alertData) {
      preparationStageStatus.generatingExicutableStatus = "running";
      executableDataCreator(alertData, uuid);
    }
  };
  //linsterManager
  const listnerManager = async () => {
    if (listnerCounter !== 0) {
      systemCM.updateListnerTrack(listnerCounter);
    }
    listnerCounter++;
    if (listnerCounter >= 10000) {
      systemCM.updateListner({ listener_tracker: [0] });
      listnerCounter = 0;
    }
  };
  //system Error reporter
  const systemErrorReporter = (key, value) => {
    systemErrorReportOnDB[key] = value;
  };
  //system Error reporter on local
  const systemErrorReporterOnLocal = (key, value) => {
    systemErrorReportOnLocal[key] = value;
  };
  // systemErrorAnalyser
  const systemErrorAnalyser = async (obj) => {
    let stoper = 0;
    for (const key in obj) {
      if ((stoper = 0)) {
        if (obj[key] != "") {
          stoper = 1;
          console.log({
            tag: TAG + "systemErrorAnalyser",
            message:
              "error detected ######################################################################",
            message2:
              "error detected ######################################################################",
            message3:
              "error detected ######################################################################",
            errorReport: obj,
          });
        }
      }
    }
  };
  //executerCallback: to fillthe executerErrorBucket;
  const executerCallback = async (okData, notOkData, finalMessage, execId) => {
    if (okData) {
      proccessedDataContainer.push(okData);
    }
    if (notOkData) {
      //executerErrorBucket : this feature not yet avaible
      executerErrorBucket.push(notOkData);
      // proccessedDataContainer.push(notOkData);
    }
    if (finalMessage) {
      exicutionCompletedContainerItems.push(finalMessage);
    }
    if (executerInfo.delayIntervel >= 20) {
      // await new Promise((resolve) =>
      //   setTimeout(() => {
      //     resolve();
      //   }, 500)
      // );
      executerInfo.delayIntervel = 0;
      executer(execId);
    } else {
      executer(execId);
    }
  };
  //calling whatsAppApi
  const executer = async (execId) => {
    if (
      exicutableDataContainer.length > 0 &&
      LCCN < exicutableDataContainer.length
    ) {
      if (!executerInfo.isWritable) {
        await (async function delayLoop() {
          if (!executerInfo.isWritable) {
            console.log(
              "------------(((((((((((((((((((((((exicuter-delay-Loop-working))))))))))))))))))))))))))))----------------"
            );
            await new Promise((resolve) =>
              setTimeout(() => {
                resolve();
              }, 150)
            );
            delayLoop();
          } else {
            executerInfo.isWritable = false;
          }
        })();
      } else {
        executerInfo.isWritable = false;
      }
      const currentExecInfo = executerInfo;
      let thisExicuterIfo = currentExecInfo[execId];
      if (thisExicuterIfo.recursion === executerRecursionLimit) {
        executerInfo.isWritable = true;
        executerInfo[execId].status = "recursion-exceed";
        RecursionExceededExecuters.push(execId);
      } else {
        const item = exicutableDataContainer[LCCN];
        const plaloadsLength = item.payloads.length;
        const nextIndex = item.nextIndex ? item.nextIndex : 0;
        const totalPayloads = item.totalPayloads;
        const countOfCompleted = item.countOfCompleted
          ? item.countOfCompleted
          : 0;
        if (plaloadsLength > 0 && nextIndex < plaloadsLength) {
          let alertId = item.alertId;
          let payload = item.payloads[nextIndex];
          exicutableDataContainer[LCCN].nextIndex = nextIndex + 1;
          exicutableDataContainer[LCCN].countOfCompleted = countOfCompleted + 1;
          // final message will helped for the database updation of that alert as it is completed
          let finalMessage = null;
          if (countOfCompleted + 1 == totalPayloads) {
            finalMessage = "completed";
            exicutableDataContainer.splice(LCCN, 1);
          } else {
            finalMessage = null;
          }
          if (LCCN + 1 < exicutableDataContainer.length) {
            LCCN++;
          } else if (LCCN + 1 == exicutableDataContainer.length) {
            LCCN = 0;
          } else if (LCCN + 1 > exicutableDataContainer.length) {
            LCCN = 0;
          }
          executerInfo.counter = currentExecInfo.counter + 1;
          executerInfo.delayIntervel++;
          executerInfo.counterLastUpdatedTime = Date.now();
          executerInfo.faultDetector.push(currentExecInfo.counter);
          executerInfo[execId].recursion = thisExicuterIfo.recursion + 1;
          if (thisExicuterIfo.status !== "running") {
            executerInfo[execId].status = "running";
          }
          //accepting callback with params okData and notOkData
          whatsApp.whatsAppApiCaller(
            payload,
            alertId,
            finalMessage,
            execId,
            executerCallback
          );
          executerInfo.isWritable = true;
        } else {
          if (plaloadsLength <= 0) {
            exicutableDataContainer.splice(LCCN, 1);
          } else if (nextIndex > plaloadsLength) {
            systemErrorReporterOnLocal(
              "executer",
              "nextIndex exeeded the plaloadsLength"
            );
            exicutableDataContainer.splice(LCCN, 1);
          }
        }
      }
    } else {
      if (exicutableDataContainer.length <= 0) {
        executerInfo[execId].status = "stoped";
      }
      if (LCCN >= exicutableDataContainer.length) {
        systemErrorReporterOnLocal(
          "executer",
          "LCCN exeeded the exicutableDataContainer.length"
        );
      }
    }
  };
  //runExicuter: it calls exeCuter . it is initializer of exicution stage
  const runExicuter = () => {
    let stopedArray = [];
    let currExecInfo1 = executerInfo;
    for (const key in currExecInfo1) {
      if (
        key === "a" ||
        key === "b" ||
        key === "c" ||
        key === "d" ||
        key === "e"
      ) {
        let itemStatus = currExecInfo1[key].status;
        if (itemStatus === "stoped") {
          stopedArray.push(key);
        }
      }
    }
    if (stopedArray.length === 5) {
      if (executerInfo.status !== "stoped") {
        executerInfo.status = "stoped";
      }
    }
    if (exicutableDataContainer.length > 0) {
      let isNewInitializing = true;
      let array = [];
      let currentExecInfo = executerInfo;
      for (const key in currentExecInfo) {
        if (
          key === "a" ||
          key === "b" ||
          key === "c" ||
          key === "d" ||
          key === "e"
        ) {
          let itemStatus = currentExecInfo[key].status;
          if (itemStatus !== "stoped") {
            array.push(key);
          }
        }
      }

      if (array.length > 0) {
        isNewInitializing = false;
        if (executerInfo.status !== "running") {
          executerInfo.status = "running";
        }
      }

      if (isNewInitializing) {
        // const arr = ["a", "b", "c","d","e"];
        const arr = ["a"];
        for (let i = 0; i < arr.length; i++) {
          executer(arr[i]);
        }
      } else {
        if (RecursionExceededExecuters.length > 0) {
          for (let i = 0; i < RecursionExceededExecuters.length; i++) {
            executerInfo[RecursionExceededExecuters[i]] = {
              recursion: 0,
              status: "running",
            };
            executer(RecursionExceededExecuters[i]);
          }
          RecursionExceededExecuters = [];
        }
      }
    }
  };
  //lister : handling whole the system by callin fuctions on intervels
  const linstener = async () => {
    const intervel = setInterval(() => {
      console.log({
        tag: TAG + "linstener",
        // message:
        //   "====================================================================================================",
        listnerCounter,
        // exicutableDataContainer,
        exicutableDataContainerLenth: exicutableDataContainer.length,
        proccessedDataContainerLength: proccessedDataContainer.length,
        // proccessedDataContainer,
        exicutionCompletedContainerItems,
        executerErrorBucket,
        executerInfo,
        exicuterFaultDetectorReport,
        alertDatabaseUpdaterInfo,
        databaseUpdateErrorBucket,
        preparationStageStatus,
        RequestMangerNewAlertAvailble,
        listnerCommand,
        listnercountDown,
      });
      listnerCounter++;
      loadAlerts();
      runExicuter();
      executerFaultDetector();
      alertDatabaseUpdater();
      commander();
      //listener termination proccess
      if (listnerCommand === "terminate") {
        if (listnercountDown > 0) {
          listnercountDown--;
        }
        if (listnercountDown === 0) {
          clearInterval(intervel);
          systemCM.systemConfigUpdate({
            is_listener_running: false,
            listener_tracker: [0],
          });
        }
      }
    }, 500);
  };
  const requestManager = async () => {
    RequestMangerNewAlertAvailble = true;
    //campaign queue details
    const cmq = await campQM.save(req.params.id);
    if (cmq === null) {
      const cmq2 = await campQM.save(req.params.id);
      if (cmq2 === null) {
        systemErrorReporter(
          "campaignQueueError",
          "can not Update alerts in to Queue  --requestManger"
        );
      } else {
        mainMM.findByIdAndUpdateAlertStatus(req.params.id, "PROCESSING");
        console.log({
          tag: TAG + "requestManager",
          message: "new campaign ---cmq2 queued",
        });
      }
    } else {
      mainMM.findByIdAndUpdateAlertStatus(req.params.id, "PROCESSING");
      console.log({
        tag: TAG + "requestManager",
        message: "new campaign ---cmq queued",
      });
    }
    //system config details
    // const scm = await systemCM.save(true, listnerCounter);
    // if (scm === null) {
    //   const scm2 = await systemCM.save(true, listnerCounter);
    //   if (scm2 === null) {
    //     systemErrorReporter(
    //       "systemConfigSaveError",
    //       "can not save listner data into db --requestManger"
    //     );
    //   }
    // }
    let systemConfigData = await systemCM.findOne();
    console.log("[[[[[[[[[[[[[[[[[]]]]]]]]]]]]]");
    console.log(systemConfigData);
    if (systemConfigData) {
      if (!systemConfigData.is_listener_running) {
        const scm = await systemCM.systemConfigUpdate({
          is_listener_running: true,
          listener_tracker: [0],
        });
        if (scm === null) {
          const scm2 = await systemCM.systemConfigUpdate({
            is_listener_running: true,
            listener_tracker: [0],
          });
          if (scm2 === null) {
            systemErrorReporter(
              "systemConfigError",
              "can not save listner data into db --requestManger"
            );
          } else {
            linstener();
            console.log({
              tag: TAG + "requestManager",
              message:
                "system configue --scm2. updated ,listener started running",
            });
          }
        } else {
          linstener();
          console.log({
            tag: TAG + "requestManager",
            message: "system configue --scm. updated ,listener started running",
          });
        }
      } else {
        if (listnercountDown > 0) {
          listnerCommand = "";
          listnercountDown = -2;
        }
        console.log({
          tag: TAG + "requestManager",
          message: "system configue listern is in running already",
        });
      }
    } else {
      systemErrorReporter(
        "systemConfigError",
        "can not find listner data from db --requestManger"
      );
      console.log({
        tag: TAG + "requestManager",
        message: "system configue not found",
      });
    }
    //calling system error analyser
    systemErrorAnalyser(systemErrorReportOnDB);
  };
  //initiator initiator initiator
  //initiator initiator initiator
  //initiator initiator initiator
  requestManager();
  await new Promise((resolve) =>
    setTimeout(() => {
      resolve();
    }, 500)
  );
  res.status(200).json({ message: "request accepted" });
});
router.post("/sendAlert_csv7_pused/:id", async (req, res) => {
  let errBucket = [];
  let successBucket = [];
  const executerCallback = (track, fails, finalMessage, execId) => {
    if (track) {
      successBucket.push("success");
    } else if (fails) {
      errBucket.push("fails");
    }
  };
  const loopLimit = 4;
  const phoneNumbers = [
    "917026157826",
    "917026157826",
    "917026157826",
    "917026157826",
  ];
  for (let i = 0; i < loopLimit; i++) {
    let j = 0;
    if (i >= 30) {
      j = 1;
    }
    if (i >= 60) {
      j = 2;
    }
    if (i >= 90) {
      j = 3;
    }
    if (i >= 120) {
      j = 4;
    }

    await whatsApp.whatsAppApiCaller(
      { phone_number: phoneNumbers[j] },
      56578767,
      34543543,
      i,
      executerCallback
    );
  }
  await new Promise((resolve) =>
    setTimeout(() => {
      resolve();
    }, 1000 * 5)
  );
  console.log({
    errLenth: errBucket.length,
    successLength: successBucket.length,
  });
});
router.post("/test", async (req, res) => {
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
    status: "FAILED",
  };
  let id = "62c7e1ed41baabab57094180";
  testModel
    .findByIdAndUpdate(id, {
      $push: {
        track: a,
      },
    })
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.send(err);
    });
});
router.get("/test", async (req, res) => {
  nnn = "test";
  console.log(globalThis.nnn);
  res.json(globalThis.nnn);

  // testModel.find({}).then((data) => {
  //   res.json(data);
  // });
});
router.delete("/test", async (req, res) => {
  console.log(globalThis.nnn);
  res.json("");
});

module.exports = router;
