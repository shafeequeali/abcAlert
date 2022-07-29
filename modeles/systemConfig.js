const mongoose = require("mongoose");

const ApplicationModel = new mongoose.Schema({
  is_listener_running:Boolean,
  listener_tracker:[Number]
});

const systemConfig = mongoose.model("system_config", ApplicationModel);

module.exports = systemConfig;
