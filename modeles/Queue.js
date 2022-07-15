const mongoose = require("mongoose");

const ApplicationModel = new mongoose.Schema({
  Queue: [
    {
      timestamp: {
        type: String,
      },
      alertId: {
        type: String,
      },
    },
  ],
});

const queueData = mongoose.model("queue_alerts", ApplicationModel);

module.exports = queueData;
