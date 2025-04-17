const mongoose = require('mongoose');

const hostSchema = new mongoose.Schema({
  ownername: String,
  password: String,
  messname: String,
  location: String,
  email: String,
  phone: String,
  price: String,
  time: String,
  review_sum: { type: Number, default: 0 },
  review_total: { type: Number, default: 0 },
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

hostSchema.virtual('review').get(function () {
  return this.review_total > 0 ? (this.review_sum / this.review_total).toFixed(2) : 0;
});

module.exports = mongoose.model('hosts', hostSchema, 'hosts');
