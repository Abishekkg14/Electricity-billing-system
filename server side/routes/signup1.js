const express = require('express');
const bcrypt = require('bcrypt');
const User = require('./models/user'); // Correct path

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
        res.json({ message: 'User signed up successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Error signing up user' });
    }
});

module.exports = router;
