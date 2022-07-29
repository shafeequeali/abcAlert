const mainModel = require("../../model");

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

module.exports.findByIdAndUpdate = async (id, length) => {
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

// module.exports.find=async(arg,callback)=>{
//     try{

//     }catch(){

//     }
// }
