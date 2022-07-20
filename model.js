const mongoose = require("mongoose");

const ApplicationModel = new mongoose.Schema({
  data_source: {
    type: String,
    enum: ["STATIC", "DYNAMIC"],
  },
  csv_file: {
    type: String,
  },
  csv_file_name: {
    type: String,
  },
  name: {
    type: String,
    required: true,
  },
  roll_number: {
    type: String,
    required: true,
    // default: 0,
  },
  email_id: {
    type: String,
    required: true,
  },
  phone_number: {
    type: [String],
    required: true,
  },
  alert_name: {
    type: String,
  },
  alert_status: {
    type: String,
    enum: ["PROCESSING", "PROCESSED", "CREATED", "CRASHED"],
  },
  created_date: {
    type: Number,
  },
  modified_date: {
    type: Number,
  },
  processed_date: {
    type: Number,
  },
  binding_data: {
    type: String,
  },
  csv_headers: {
    type: [String],
  },
  csv_sample: {
    type: String,
  },
  whatsapp_alert_track: [
    {
      index: Number,
      status: {
        type: String,
        enum: ["SUCCESS", "FAILED"],
      },
      res_data: String,
    },
  ],
  csv_data_length: {
    type: Number,
  },
});

const application = mongoose.model("application_form", ApplicationModel);

module.exports = application;
