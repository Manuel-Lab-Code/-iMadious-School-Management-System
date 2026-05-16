const bcrypt = require('bcryptjs');

const pwd = 'Admin@123456';
const hash = '$2b$10$q7ewvinNjnJk3Q2EVc6OweNSgIEqh.VQVQi2UXEP9TEBG/jLapyfq';

bcrypt.compare(pwd, hash, (err, isMatch) => {
    console.log('Password matches:', isMatch);
    if (err) console.log('Error:', err);
    process.exit(0);
});
