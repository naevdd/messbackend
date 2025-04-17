const express = require('express');
const cors = require('cors');
const Mess = require('./models/Menu')
const Host =require('./models/Host')
const app = express();
const mongoose=require('mongoose');
const PORT = 5000;
const dotenv = require('dotenv')
const connectDB = require("./db");
const hostRoutes = require('./routes/hosts');
const studRoutes = require('./routes/students');

dotenv.config();
connectDB();
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));

app.use('/host', hostRoutes);
app.use('/student',studRoutes);

app.use(express.json());

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
    res.json(Hosts);
  }catch(error){
    console.error(error);
    res.status(500).json({message:'Failed to fetch donors'})
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

app.get('/indmess/:id',async(req,res)=>{
  try{
    const {id} = req.params;
    const mess = await Mess.findById(id).lean();

    if(!mess){
      return res.status(404).json({message:"Mess not found"});
    }

    const hostdata = await Host.findById(mess.ObjectId).lean();

    if(!hostdata){
      return res.status(404).json({message:"Host not found"});
    }

    const today=getDay();
    const todayMenu = mess.weeklyMenu.find((menu) => menu.day == today);

    const data={
      messName:mess.messName,
      location:mess.location,
      image:mess.image||null,
      food:todayMenu?todayMenu.meals:[],
      time:hostdata.time,
      locations:hostdata.location,
      phone:hostdata.phone
    }

    res.json(data);
  }
  catch(error){
    console.log(error);
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

app.post('/add-mess', async (req, res) => {
  try {
    const { hostId, weeklyMenu } = req.body;

    const hostdata = await Host.findById(hostId);
    if (!hostdata) return res.status(404).json({ error: 'Host not found' });

    const newMess = new Mess({
      messName: hostdata.messname,
      location: hostdata.location,
      weeklyMenu,
      hostId: hostdata._id
    });

    await newMess.save();
    res.status(201).json({ message: 'Mess details added successfully!', data: newMess });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while adding mess details.' });
  }
});

app.get('/get-menu/:hostId', async (req, res) => {
  const { hostId } = req.params;

  try {
    const mess = await Mess.findOne({ host: hostId });
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
    let mess = await Mess.findOne({ host: hostId });
    
    // If no mess exists, try to create one using the host's messName from the Host document
    if (!mess) {
      const hostdata = await Host.findById(hostId);
      if (!hostdata) {
        return res.status(404).json({ message: 'Host not found' });
      }
      mess = await Mess.create({
        host: hostId,
        messName: host.messname, // required field from Host
        weeklyMenu: weeklyMenu  // Create with the provided day's data
      });
      return res.json({ message: 'Mess created and menu updated successfully!', data: mess });
    }
    
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
/*
app.get('/get-menu/:hostId', async (req, res) => {
  try {
    const { hostId } = req.params;
    const mess = await Mess.findOne({ hostId });

    if (!mess) return res.status(404).json({ error: 'Menu not found' });

    res.status(200).json({ message: 'Menu retrieved successfully!', data: mess });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while retrieving menu details.' });
  }
});
duplicate function
*/
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

app.listen(PORT,()=>{
    console.log(`server listening on port ${PORT}`)
});