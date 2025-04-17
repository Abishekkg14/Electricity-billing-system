const express = require('express');
const bcrypt = require('bcrypt');
const User = require('./user');

const router = express.Router();

router.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
        username,
        email,
        password: hashedPassword
    });

    try {
        await newUser.save();
        res.json({ message: 'Signup successful' });
    } catch (error) {
        res.status(500).json({ message: 'Signup failed', error: error.message });
    }
});

module.exports = router;
