const mongoose = require('mongoose');

const dayMealSchema = new mongoose.Schema({
    type: String,           // "Breakfast", "Lunch", "Dinner"
    items: [String]         // List of food items
})

const orderSchema = new mongoose.Schema({
    orderId: { type: String, required: true, unique: true },
    messemail: { type: String, required: true },
    customerName: { type: String, required: true },
    customerPhone: { type: Number, required: true },
    orderDate: { type: Date, default: Date.now },
    status: { type: String, required: true, enum: ['Pending', 'Delivered', 'Cancelled'] }
})

module.exports = mongoose.model('orders', orderSchema);