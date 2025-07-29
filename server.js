const express = require('express');
const cors = require('cors');
const Host =require('./models/Host')
const Student =require('./models/Stud')
const Order = require('./models/Order');
const app = express();
const mongoose=require('mongoose');
const PORT = process.env.PORT || 3000;
const path = require('path')
const dotenv = require('dotenv')
const connectDB = require("./db");
const hostRoutes = require('./routes/hosts');
const studRoutes = require('./routes/students');

dotenv.config();
connectDB();
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/host', hostRoutes);
app.use('/student',studRoutes);

/*const hostSchema = new mongoose.Schema({
    ownername: String,
    password: String,
    messname: String,
    location: String,
    email: String,
    phone: String,
    price: String,
    time: String,
    review_sum: {type:Number, default:0},
    review_total: {type:Number, default:0},
},
{toJSON: {virtuals:true}, toObject:{virtuals:true}}
);

hostSchema.virtual('review').get(function(){
  return this.review_total>0 ? (this.review_sum/this.review_total).toFixed(2):0;
});

const mealSchema = new mongoose.Schema({
  type: String,           // "Breakfast", "Lunch", "Dinner"
  items: [String]         // List of food items
});

const weeklyMenuSchema = new mongoose.Schema({
  day: String,            // e.g., "Monday"
  meals: [mealSchema]     // Array of meals for the day
});

const messSchema = new mongoose.Schema({
  messName: String,       // e.g., "Campus Messy"
  location: String,       // e.g., "Block A"
  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "hosts"          // Reference to the hosts collection
  },
  weeklyMenu: [weeklyMenuSchema] // Full week's menu
});

const host = mongoose.model("hosts", hostSchema,"hostData");
const messes=mongoose.model("messes",messSchema,"messData")*/

app.get('/hosts',async(req,res)=>{
  try{
    const Hosts=await Host.find();
    console.log(Hosts)
    res.json(Hosts);
  }catch(error){
    console.error(error);
    res.status(500).json({message:'Failed to fetch hosts'})
  }
});

app.get('/students', async (req, res) => {
  try {
    const students = await Student.find();
    console.log('student', students)
    res.json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ message: 'Failed to fetch students' });
  }
});

app.get('/orders', async(req,res)=>{
  try{
      const orders = await Order.find().lean({ virtuals: true });
      console.log("Fetched Mess Data: ", orders.length, "records");
      res.json(orders);
  }
  catch(error){
      console.error("Error fetching mess data",error);
      res.status(400).json({error:"Error in fetching mess data"});
  }
})

app.get('/allmesses', async(req,res)=>{
  try{
      const messes = await Host.find().lean({ virtuals: true });
      console.log("Fetched Mess Data: ", messes.length, "records");
      res.json(messes);
  }
  catch(error){
      console.error("Error fetching mess data",error);
      res.status(400).json({error:"Error in fetching mess data"});
  }
})

app.get('/top_messes', async (req, res) => {
  try {
    const messes = await Host.find().lean({ virtuals: true });

    // Sort based on actual average rating
    const sortedMesses = messes.sort((a, b) => {
      const aRating = a.review_total > 0 ? a.review_sum / a.review_total : 0;
      const bRating = b.review_total > 0 ? b.review_sum / b.review_total : 0;
      return bRating - aRating;
    });

    const topMesses = sortedMesses.slice(0, 5); // Top 5 messes

    res.json(topMesses);
  } catch (error) {
    res.status(400).json({ error: "Error in fetching mess data" });
  }
});

const getDay=()=>{
  const days=["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[new Date().getDay()];
}

app.get('/indmess/:id', async (req, res) => {

  const { id } = req.params;
  console.log('Fetching mess with id:', id);

  try {
    console.log("hello")
    const mess = await Host.findById(id).lean();
    console.log(mess)

    if (!mess) {
      console.log("brah")
      return res.status(400).json({ message: "Mess not found" });
    }

    console.log("okk")

    const today = getDay();
    
    const todayMenu = mess.weeklyMenu.find(menu => menu.day === today);

    const data = {
      messname: mess.messname,
      location: mess.location,
      image: mess.image || null,
      breakfast: todayMenu ? todayMenu.meals[0].items : [],
      lunch: todayMenu ? todayMenu.meals[1].items : [],
      dinner: todayMenu ? todayMenu.meals[2].items : [],
      time: mess.workinghours || null,
      phone: mess.phone || null,
      weeklyMenu: mess.weeklyMenu || [],
    };

    console.log("yo",data)

    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post('/indmess/:id/rate', async (req, res) => {
  try {
      const { rating, studentId } = req.body; // Get rating from request
      const messData = await Host.findById(req.params.id);

      if (!messData) {
          return res.status(404).json({ error: "Mess not found" });
      }

      const existingRating = messData.ratings.find(r => r.studentId === studentId);
      if(existingRating){
        messData.review_sum -= existingRating.value;
        existingRating.value = rating; 
        messData.review_sum += rating; 
      }
      else{
        messData.ratings.push({ studentId, value: rating});
        messData.review_total += 1;
      }
      await messData.save();

      res.json({ message: "Rating updated successfully", updatedMess: messData });
  } catch (error) {
      console.error("Error updating rating:", error);
      res.status(500).json({ error: "Error updating rating" });
  }
});

app.put('/add-mess', async (req, res) => {
  const { id, weeklyMenu } = req.body; // weeklyMenu is expected to be an array with one object (the day to update)
  console.log("Update request received:", req.body);
  try {
    // Find the host by ID and update the details
    console.log("Request body:", req.body); 
    const updatedHost = await Host.findByIdAndUpdate(
      id,
      {
        weeklyMenu: weeklyMenu,
      },
      { new: true }
    );

    if (!updatedHost) {
      return res.status(404).json({ message: "Host not found" });
    }

    res.json(updatedHost);
  } catch (error) {
    console.error("Error while updating host:", error);
    res.status(500).json({ message: "Failed to update host details" });
  }
});

app.get('/get-menu/:hostId', async (req, res) => {
  const { hostId } = req.params;

  try {
    const mess = await Host.findById(hostId).lean();
    console.log(mess, hostId)
    if (!mess) return res.status(404).json({ message: "Mess not found" });

    res.json(mess);
  } catch (error) {
    console.error("Error fetching menu:", error);
    res.status(500).json({ message: "Failed to fetch menu details" });
  }
});

app.put('/update-menu', async (req, res) => {
  const { hostId, weeklyMenu } = req.body; // weeklyMenu is expected to be an array with one object (the day to update)
  console.log("Update request received:", req.body);
  try {
    // Find the Mess document for this host
    let mess = await Host.findById(hostId);
    
    // Extract the updated day object from the array
    const updatedDay = weeklyMenu[0];
    
    // Remove any existing entry for that day
    const filteredMenu = mess.weeklyMenu.filter(item => item.day !== updatedDay.day);
    // Add the updated day
    filteredMenu.push(updatedDay);
    
    // Update the document
    mess.weeklyMenu = filteredMenu;
    await mess.save();
    
    res.json({ message: 'Menu updated successfully!', data: mess });
  } catch (error) {
    console.error('Error while updating menu:', error);
    res.status(500).json({ message: 'Failed to update menu details' });
  }
});

app.put('/hosts', async (req, res) => {
  const { id, ownerName, messName, location, mailId, mobileNumber, workingDays } = req.body;

  try {
    // Find the host by ID and update the details
    console.log("Request body:", req.body); 
    const updatedHost = await Host.findByIdAndUpdate(
      id,
      {
        ownername: ownerName,
        messname: messName,
        location: location,
        email: mailId,
        phone: mobileNumber,
        workinghours: workingDays,
      },
      { new: true }
    );

    if (!updatedHost) {
      return res.status(404).json({ message: "Host not found" });
    }

    res.json(updatedHost);
  } catch (error) {
    console.error("Error while updating host:", error);
    res.status(500).json({ message: "Failed to update host details" });
  }
});

app.put('/students', async (req, res) => {
  const { id, studentname, hostelname, address, email, phone } = req.body;

  try {
    // Find the host by ID and update the details
    console.log("Request body:", req.body); 
    const updatedStudent = await Student.findByIdAndUpdate(
      id,
      {
        studentname: studentname,
        hostelname: hostelname,
        address: address,
        email: email,
        phone:phone,
      },
      { new: true }
    );

    if (!updatedStudent) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json(updatedStudent);
  } catch (error) {
    console.error("Error while updating student:", error);
    res.status(500).json({ message: "Failed to update student details" });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

app.post('/order' ,async (req,res) => {

  try {
    // Find the order by ID and update the details
    const { id, messemail, customerName,customerEmail, customerPhone, status,} = req.body;
    console.log("Order details received:", req.body);

    const newOrder = new Order({
      id,
      messemail,
      customerName,
      customerEmail,
      customerPhone,
      orderDate: new Date(),
      status
    });
    await newOrder.save();

    res.json(newOrder);
  } catch (error) {
    console.error("Error while updating order:", error);
    res.status(500).json({ message: "Failed to update order details" });
  }
})
