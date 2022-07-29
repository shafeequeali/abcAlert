const mainMM = require("../modeles/modules/mainModelModule");

module.exports.loadCampaignData = async (id) => {
  try {
    const data = await mainMM.findById(id);
    return data;
  } catch (err) {
    return null;
  }
};
