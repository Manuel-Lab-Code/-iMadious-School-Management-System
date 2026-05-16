/* Debug test for admin password */
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
require('dotenv').config();

router.get('/admin-hash', (req, res) => {
    const password = 'Admin@123456';
    const hash = process.env.ADMIN_PASS_HASH;

    console.log('\n=== DEBUG ADMIN HASH ===');
    console.log('Password:', password);
    console.log('Hash from env:', hash);
    console.log('Hash is string:', typeof hash === 'string');
    console.log('Hash length:', hash?.length);

    if (!hash) {
        return res.json({ error: 'ADMIN_PASS_HASH not set in .env' });
    }

    bcrypt.compare(password, hash, (err, isMatch) => {
        console.log('Bcrypt comparison - Error:', err, 'Match:', isMatch);
        res.json({
            password,
            hash: hash.substring(0, 20) + '...',
            isMatch,
            error: err?.message
        });
    });
});

module.exports = router;
