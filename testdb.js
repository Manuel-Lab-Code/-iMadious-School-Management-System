require('dotenv').config();
const mongoose = require('mongoose');

console.log('Connecting to:', process.env.MONGO_URI);

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Connected successfully!');
    mongoose.disconnect();
  })
  .catch(err => {
    console.log('❌ Failed:', err.message);
  });