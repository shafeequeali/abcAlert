const mongoose = require("mongoose");

const TestModel = new mongoose.Schema({

    track: [{
        index: Number,
        status: {
            type: String,
            enum: ['SUCCESS', 'FAILED']
        }
    }]

});

const testModel = mongoose.model("test_model", TestModel);

module.exports = testModel;