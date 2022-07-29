const mongoose = require("mongoose");

const ApplicationModel = new mongoose.Schema({
  campaignId: {
    type: String,
  },
});

const campaignQueue = mongoose.model("campaign_queue", ApplicationModel);

module.exports = campaignQueue;
