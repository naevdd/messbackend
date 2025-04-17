const mongoose = require('mongoose');

const mealSchema = new mongoose.Schema({
  type: String,
  items: [String]
});

const weeklyMenuSchema = new mongoose.Schema({
  day: String,
  meals: [mealSchema]
});

const messSchema = new mongoose.Schema({
  messName: String,
  location: String,
  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "hosts"
  },
  weeklyMenu: [weeklyMenuSchema]
});

module.exports = mongoose.model("messes", messSchema, "messes");
