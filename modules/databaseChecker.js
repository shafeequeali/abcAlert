const campQM = require("../modeles/modules/campignQueueModule");

module.exports.dataBaseChecker = async () => {
  try {
    const data = await campQM.findOne({});
    return data;
  } catch (err) {
    return null;
  }
};
