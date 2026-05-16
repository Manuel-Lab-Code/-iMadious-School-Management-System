require('dotenv').config();
const bcrypt = require('bcryptjs');

const password = 'Admin@123456';
const hash = process.env.ADMIN_PASS_HASH;

console.log('Testing bcrypt.compare with values from .env:');
console.log('Password:', password);
console.log('Hash:', hash);
console.log('Hash length:', hash.length);
console.log('Hash starts with $2b$10$:', hash.startsWith('$2b$10$'));

bcrypt.compare(password, hash, (err, isMatch) => {
    console.log('\nResult:');
    console.log('Error:', err);
    console.log('Match:', isMatch);
    process.exit(0);
});
