const systemConfig = require("../systemConfig");
const id = "62e76f9c81e1bbef286c93ca";

module.exports.findOne = async () => {
  try {
    const data = await systemConfig.findOne({});
    return data;
  } catch (err) {
    return null;
  }
};
module.exports.find = async (arg) => {
  try {
    const data = await systemConfig.find(arg ? arg : {});
    return data;
  } catch (err) {
    return null;
  }
};
// module.exports.save = async (status, track) => {
//   try {
//     const newConfig = new systemConfig({
//       is_listener_running: status,
//       listener_tracker: [track],
//     });
//     const data = await newConfig.save();
//     return data;
//   } catch (err) {
//     return null;
//   }
// };

module.exports.updateListnerTrack = async (track) => {
  try {
    const data = await systemConfig.findByIdAndUpdate(id, {
      $push: {
        listener_tracker: track,
      },
    });
    return data;
  } catch (err) {
    return null;
  }
};

module.exports.systemConfigUpdate = async (mData) => {
  try {
    const data = await systemConfig.findByIdAndUpdate(id, { ...mData });
    return data;
  } catch (err) {
    return null;
  }
};
