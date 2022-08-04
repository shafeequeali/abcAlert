const mainModel = require("../../model");
const TAG = "MAIN MODEL MODULE";

module.exports.find = async (arg) => {
  try {
    const data = await mainModel.find(arg ? arg : {});
    return data;
  } catch (err) {
    return null;
  }
};

module.exports.findById = async (id) => {
  try {
    const data = await mainModel.findById(id);
    return data;
  } catch (err) {
    return null;
  }
};

module.exports.findByIdAndUpdateCsvLength = async (id, length) => {
  mainModel
    .findByIdAndUpdate(id, {
      csv_data_length: length,
    })
    .then((data) => {
      console.log({
        tag: TAG + "at csv_data_length update",
        // data,
      });
    })
    .catch((err) => {
      console.log({
        tag: TAG + "at csv_data_length update",
        err,
      });
    });
};

module.exports.findByIdAndUpdateAlertStatus = async (alertId, status) => {
  mainModel
    .findByIdAndUpdate(alertId, {
      alert_status: status, //"PROCESSED",
    })
    .then((data) => {
      // console.log({
      //   tag: TAG + "at csv_data_length update",
      //   // data,
      // });
    })
    .catch((err) => {
      console.log(
        "......................................................errrrrrrrrrrr---------"
      );
      console.log({
        tag: TAG + "at csv_data_length update",
        err,
        status,
      });
    });
};

// module.exports.find=async(arg,callback)=>{
//     try{

//     }catch(){

//     }
// }
