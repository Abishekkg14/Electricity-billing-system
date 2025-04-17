const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const mongoURI = 'mongodb://127.0.0.1:27017/electricitybilling';
        console.log('Attempting to connect to MongoDB...');
        
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log(`MongoDB connected successfully to ${mongoURI}`);
    } catch (error) {
        console.error('MongoDB connection error details:', {
            message: error.message,
            code: error.code,
            name: error.name
        });
        process.exit(1);
    }
};

module.exports = connectDB;
