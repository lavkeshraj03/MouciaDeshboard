require('dotenv').config({ path: './moucia-dashboard/backend/.env' });
const mongoose = require('mongoose');
const User = require('./moucia-dashboard/backend/models/User');

async function test() {
    try {
        console.log('Connecting to:', process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected!');
        
        let users = await User.find({});
        console.log('Found users:', users.length);
        
        process.exit(0);
    } catch (e) {
        console.error('Crash:', e);
        process.exit(1);
    }
}
test();
