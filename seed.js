/* ═══════════════════════════════════════════════════════════
   EduPortal — seed.js
   Run once: node seed.js
   Creates predefined teacher accounts in MongoDB.
   Admin is handled in code (not DB).
   ═══════════════════════════════════════════════════════════ */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const User     = require('./models/User');
const Fee      = require('./models/Fee');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅ Connected. Seeding…');

    /* Clear teachers */
    await User.deleteMany({ role: 'teacher' });

    const teachers = [
      { firstName:'Mrs Adaeze', lastName:'Okafor', username:'teacher1', password:'Teacher@1', subject:'Mathematics',          email:'teacher1@school.ng' },
      { firstName:'Mr Emeka',   lastName:'Nwosu',  username:'teacher2', password:'Teacher@2', subject:'English Language',     email:'teacher2@school.ng' },
      { firstName:'Dr Ngozi',   lastName:'Eze',    username:'teacher3', password:'Teacher@3', subject:'Biology',              email:'teacher3@school.ng' },
      { firstName:'Mr Chidi',   lastName:'Obi',    username:'teacher4', password:'Teacher@4', subject:'Physics',              email:'teacher4@school.ng' },
      { firstName:'Mrs Amaka',  lastName:'Dike',   username:'teacher5', password:'Teacher@5', subject:'Chemistry',            email:'teacher5@school.ng' },
    ];

    for (const t of teachers) {
      const hashed = await bcrypt.hash(t.password, 10);
      await User.create({
        firstName : t.firstName,
        lastName  : t.lastName,
        username  : t.username,
        password  : hashed,
        email     : t.email,
        role      : 'teacher',
        subject   : t.subject,
        isActive  : true
      });
      console.log(`✅ Teacher created: ${t.username}`);
    }

    /* Seed a demo student */
    const existStudent = await User.findOne({ username: 'chioma' });
    if (!existStudent) {
      const hashed = await bcrypt.hash('Student@1', 10);
      const s = await User.create({
        firstName:'Chioma', lastName:'Okonkwo', username:'chioma',
        password:hashed, email:'chioma@school.ng',
        role:'student', class:'SSS 2', isActive:true
      });
      await Fee.create({ student: s._id, total: 85000, paid: 85000, status: 'paid' });
      console.log('✅ Demo student: chioma / Student@1');
    }

    console.log('\n✅ Seeding complete!');
    console.log('Login credentials:');
    console.log('  Admin:   admin / Admin@123');
    console.log('  Teacher: teacher1 / Teacher@1');
    console.log('  Student: chioma / Student@1');
    mongoose.disconnect();
  })
  .catch(err => { console.error('❌ Error:', err.message); process.exit(1); });