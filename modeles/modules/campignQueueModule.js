const campaignQueue = require("../campaignQueue");

module.exports.find = async (arg) => {
  try {
    const data = await campaignQueue.find(arg ? arg : {});
    return data;
  } catch (err) {
    return null;
  }
};
module.exports.findOne = async (arg) => {
  try {
    const data = await campaignQueue.findOne(arg ? arg : {});
    return data;
  } catch (err) {
    return null;
  }
};
module.exports.save = async (campaignId) => {
  try {
    const newQueue = new campaignQueue({ campaignId });
    const data = await newQueue.save();
    return data;
  } catch (err) {
    return null;
  }
};
module.exports.deleteById = async (id) => {
  try {
    const data = campaignQueue.findByIdAndDelete(id);
    return data;
  } catch (err) {
    return null;
  }
};

// module.exports.find=async(arg,callback)=>{
//     try{

//     }catch(){

//     }
// }
