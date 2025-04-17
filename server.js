const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
// Removed bodyParser since express.json() is used instead
const connectDB = require('./config/db');
const User = require('./models/User');
const cors = require('cors');
const path = require('path');
const app = express();

mongoose.set('strictQuery', true); // Fix deprecation warning

// Define /api/test-server endpoint ONLY ONCE, before ANY middleware
app.get('/api/test-server', (req, res) => {
    console.log('API test server endpoint hit');
    res.header('Access-Control-Allow-Origin', '*');
    res.json({
        status: 'success',
        message: 'Server is running and reachable',
        timestamp: new Date().toISOString(),
        serverUptime: process.uptime()
    });
});

// Add debug route BEFORE any middleware
app.get('/debug-paths', (req, res) => {
    console.log('Debug paths endpoint accessed');
    const publicPath = path.join(__dirname, 'public');
    const loginPath = path.join(publicPath, 'login.html');
    const exists = require('fs').existsSync(loginPath);
    
    console.log('Debug information:', {
        publicPath,
        loginPath,
        exists
    });

    res.json({
        success: true,
        publicPath,
        loginPath,
        exists,
        serverTime: new Date().toISOString()
    });
});

// Connect to MongoDB
connectDB();

// Serve static files from the frontend folder
app.use('/frontend', express.static(path.join(__dirname, 'frontend')));

// Use Express JSON middleware and allow all origins
app.use(express.json());
app.use(express.urlencoded({ extended: true }));  // Added to support URL-encoded payloads
app.use(cors());  // Relaxed CORS configuration

// Add this debug middleware to track file requests (if needed)
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - Request: ${req.method} ${req.path}`);
    next();
});

// Serve static files from the public folder
app.use(express.static(path.join(__dirname, 'public')));

// Add simple console logging
app.use((req, res, next) => {
    console.log('Accessing:', req.url);
    next();
});

// Ensure the root route serves the index.html page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Remove the /login route
// app.get('/login', (req, res) => {
//     res.sendFile(path.join(__dirname, 'public', 'login.html'));
// });

// Add debugging middleware
app.use((req, res, next) => {
    console.log(`Accessing: ${req.path}`);
    console.log(`Full path: ${path.join(__dirname, 'public', req.path)}`);
    next();
});

// Update signup endpoint
app.post('/api/signup', async (req, res) => {
    console.log('Received signup payload:', req.body);
    
    // Destructure and trim values on the server side too.
    let { username, email, password } = req.body;
    username = username ? username.trim() : '';
    email = email ? email.trim() : '';
    password = password ? password.trim() : '';
    
    console.log('After trimming:', { username, email, password });
    
    if (!username || !email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }
    
    try {
        // ...existing code to check for existing user and create new user...
        let existingUser = await User.findOne({ 
            $or: [{ email }, { username }] 
        });
        
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email or username' });
        }
        
        const user = new User({
            username,
            email,
            password: await bcrypt.hash(password, 10)
        });
        
        await user.save();
        console.log('User created successfully:', { username, email });
        res.status(201).json({ message: 'User created successfully', userId: user._id });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ 
            message: 'Server error during signup',
            error: error.message 
        });
    }
});

// Update login POST endpoint
app.post('/api/login', async (req, res) => {
    try {
        console.log('Login request received:', req.body); // Debug log

        const { username, password } = req.body;
        if (!username || !password) {
            console.log('Missing username or password'); // Debug log
            return res.status(400).json({ message: 'Username and password are required' });
        }

        const user = await User.findOne({ username });
        if (!user) {
            console.log('User not found:', username); // Debug log
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            console.log('Invalid password for user:', username); // Debug log
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        console.log('Login successful for user:', username); // Debug log
        res.json({
            success: true,
            message: 'Login successful',
            username: user.username
        });
    } catch (error) {
        console.error('Login error:', error); // Debug log
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Add this new endpoint after existing endpoints
app.get('/api/verify/:email', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email });
        if (user) {
            // Send back safe user data (excluding password)
            res.json({
                username: user.username,
                email: user.email,
                createdAt: user.createdAt
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Ensure this endpoint is properly defined and accessible
app.get('/api/users', async (req, res) => {
    try {
        // Ensure the User model is properly imported at the top of the file
        const users = await User.find({}, { password: 0 }); // Exclude passwords
        res.json(users);
        console.log(`Retrieved ${users.length} users at ${new Date().toISOString()}`);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ 
            message: 'Server error fetching users', 
            error: error.message 
        });
    }
});

// Add before app.listen
app.get('/api/admin/verify-db', async (req, res) => {
    try {
        const dbStatus = await mongoose.connection.db.stats();
        const usersCount = await User.countDocuments();
        const latestUsers = await User.find({}, { password: 0 }).sort({ createdAt: -1 }).limit(5);
        
        res.json({
            dbStatus: {
                database: dbStatus.db,
                collections: dbStatus.collections,
                totalDocuments: dbStatus.objects
            },
            usersStatus: {
                totalUsers: usersCount,
                latestUsers: latestUsers
            }
        });
    } catch (error) {
        res.status(500).json({ 
            error: 'Database verification failed',
            details: error.message 
        });
    }
});

// Replace or update the existing test-db endpoint
app.get('/api/test-db', async (req, res) => {
    try {
        const dbInfo = {
            isConnected: mongoose.connection.readyState === 1,
            dbName: mongoose.connection.name || 'Not connected',
            host: mongoose.connection.host || 'Not connected',
            port: mongoose.connection.port || 'Not connected',
            collections: [],
            status: 'Server and Database are running',
            serverUptime: process.uptime(),
            mongooseVersion: mongoose.version
        };

        if (dbInfo.isConnected) {
            const collections = await mongoose.connection.db.listCollections().toArray();
            dbInfo.collections = collections.map(c => c.name);
            
            // Get users count
            const usersCount = await User.countDocuments();
            dbInfo.usersCount = usersCount;
        }

        res.json({
            success: true,
            connectionInfo: dbInfo
        });
    } catch (error) {
        console.error('Database test error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Add this new endpoint before app.listen
app.get('/api/check-user', async (req, res) => {
    try {
        const { search } = req.query;
        
        if (!search) {
            return res.status(400).json({ message: 'Search term required' });
        }

        const user = await User.findOne({
            $or: [
                { username: search },
                { email: search }
            ]
        });

        if (user) {
            res.json({
                exists: true,
                message: `User exists with ${user.email === search ? 'this email' : 'this username'}`
            });
        } else {
            res.json({
                exists: false,
                message: 'Username and email are available'
            });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});