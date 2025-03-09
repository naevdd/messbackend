const mongoose = require('mongoose');

const mealSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['Breakfast', 'Lunch', 'Dinner'], 
    required: true 
  },
  items: [{ 
    type: String, 
    required: true 
  }], 
});

const dailyMenuSchema = new mongoose.Schema({
  day: { 
    type: String, 
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], 
    required: true 
  },
  meals: [mealSchema],
});

const messSchema = new mongoose.Schema({
  messName: { 
    type: String, 
    required: true 
  },
  location: { 
    type: String 
  }, 
  weeklyMenu: [dailyMenuSchema], 
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'hosts', // Reference to the hosts collection
    required: true
  }
});

const Mess = mongoose.model('mess', messSchema);

module.exports = Mess;
