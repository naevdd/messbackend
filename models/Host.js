const mongoose = require('mongoose');

const hostSchema = new mongoose.Schema({
  ownername: {
    type: String,
    required: true,
  },
  messname: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  workinghours: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  review_sum: {type:Number, default:0},
  review_total: {type:Number, default:0},
});

module.exports = mongoose.model('hosts', hostSchema);