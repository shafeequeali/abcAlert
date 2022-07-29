const systemConfig = require("../systemConfig");

module.exports.find = async (arg) => {
  try {
    const data = await systemConfig.find(arg ? arg : {});
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
