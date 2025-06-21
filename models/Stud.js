const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  studentname: { type: String, required: true },
  hostelname: { type: String, required: true },
  address: { type: String, required: true },
  email: { type: String, required: true, unique: true }, 
  phone: { type: String, required: true },
  password: { type: String, required: true },
});

module.exports = mongoose.model('students', studentSchema);