const express = require('express');
const cors = require('cors');
const Mess = require('./models/Menu')
const Host =require('./models/Host')
const app = express();
const mongoose=require('mongoose');
const PORT = 3000;
const path = require('path')
const dotenv = require('dotenv')
const connectDB = require("./db");
const hostRoutes = require('./routes/hosts');
const studRoutes = require('./routes/students');

dotenv.config();
connectDB();
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
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

app.get('/top_messes', async(req,res)=>{
  try{
      const messes = await Host.find().lean({virtuals:true});
      const sortedMesses = messes.sort((a, b) => (b.review - a.review)).slice(0, 4);
      res.json(sortedMesses);
  }
  catch(error){
      res.status(400).json({error:"Error in fetching mess data"});
  }
})

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

    const today = 'Tuesday';
    
    const todayMenu = mess.weeklyMenu.find(menu => menu.day === today);

    const data = {
      messName: mess.messName,
      location: mess.location,
      image: mess.image || null,
      breakfast: todayMenu ? todayMenu.meals[0].items : [],
      lunch: todayMenu ? todayMenu.meals[1].items : [],
      dinner: todayMenu ? todayMenu.meals[2].items : [],
      time: mess.time || null,
      phone: mess.phone || null,
    };

    console.log(data.lunch)

    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post('/indmess/:id/rate', async (req, res) => {
  try {
      const { rating } = req.body; // Get rating from request
      const messData = await Host.findById(req.params.id);

      if (!messData) {
          return res.status(404).json({ error: "Mess not found" });
      }

      // Update the review_sum and review_total
      messData.review_sum += rating;
      messData.review_total += 1;
      await messData.save(); // Save updated document

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
    const mess = await Host.findById(hostId)
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
        time: workingDays,
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

app.put('/student', async (req, res) => {
  const { id, studentName, hostelName, address, emailId, phone } = req.body;

  try {
    // Find the host by ID and update the details
    console.log("Request body:", req.body); 
    const updatedHost = await Host.findByIdAndUpdate(
      id,
      {
        studentName: studentName,
        hostelName: hostelName,
        address: address,
        emailId: emailId,
        mobileNumber:phone,
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

app.listen(PORT,()=>{
    console.log(`server listening on port ${PORT}`)
});

app.put('/update-menu', async (req, res) => {
  const { hostId, weeklyMenu } = req.body; // weeklyMenu is expected to be an array with one object (the day to update)
  console.log("Update request received:", req.body);
  try {
    // Find the Mess document for this host
    let mess = await Host.findOne({ host: hostId });
    
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
