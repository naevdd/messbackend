const express = require('express');
const cors = require('cors');
const Mess = require('./models/Menu')
const Host =require('./models/Host')
const app = express();
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
      const messes = await mess.find();
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
      const messes = await mess.find().lean();
      const sortedMesses = messes.sort((a, b) => (b.review - a.review)).slice(0, 4);
      res.json(sortedMesses);
  }
  catch(error){
      res.status(400).json({error:"Error in fetching mess data"});
  }
})

app.get('/indmess/:id',async(req,res)=>{
  try{
      const messData = await mess.findById(req.params.id);
      if(!messData){
          return res.status(404).json({error : "Mess not found"});
      }
      res.json(messData);
  }
  catch(err){
      res.json({error:err.message});
  }
});

app.post('/indmess/:id/rate', async (req, res) => {
  try {
      const { rating } = req.body; // Get rating from request
      const messData = await mess.findById(req.params.id);

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

    const host = await Host.findById(hostId);
    if (!host) return res.status(404).json({ error: 'Host not found' });

    const newMess = new Mess({
      messName: host.messname,
      location: host.location,
      weeklyMenu,
      hostId: host._id
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
      const host = await Host.findById(hostId);
      if (!host) {
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


app.put('/hosts', async (req, res) => {
  const { id, ownerName, messName, location, mailId, mobileNumber, workingDays } = req.body;

  try {
    // Find the host by ID and update the details
    console.log("Request body:", req.body); 
    const updatedHost = await hosts.findByIdAndUpdate(
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

app.listen(PORT,()=>{
    console.log(`server listening on port ${PORT}`)
});