const mongoose = require("mongoose");

const ApplicationModel = new mongoose.Schema({
  total_system: {
    type: Number,
  },
  availble_system: {
    type: Number,
  },
});

const systemConfig = mongoose.model("system_config", ApplicationModel);

module.exports = systemConfig;
