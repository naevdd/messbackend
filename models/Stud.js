const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  studentName: { type: String, required: true },
  hostelName: { type: String, required: true },
  address: { type: String, required: true },
  emailID: { type: String, required: true, unique: true }, 
  phone: { type: String, required: true },
  password: { type: String, required: true },
});

module.exports = mongoose.model('students', studentSchema);