const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const hashed = await bcrypt.hash('gj8NaHXF39', 10);
    const superadmin = new User({
      name: 'Coach Sandeep',
      email: 'sandeep@untrain.fit',
      password: hashed,
      role: 'superadmin',
    });
    await superadmin.save();
    console.log('✅ Superadmin created successfully');
    process.exit();
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
