const campQM = require("../modeles/modules/campignQueueModule");

module.exports.dataBaseChecker = async () => {
  try {
    const data = await campQM.findOne({});
    return data.campaignId;
  } catch (err) {
    return null;
  }
};
