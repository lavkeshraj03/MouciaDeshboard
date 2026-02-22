require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcrypt');

async function test() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        let user = await User.findOne({ email: 'admin@moucia.com' });
        if (!user) {
           const hashedPassword = await bcrypt.hash('password123', 10);
           user = await User.create({
               userId: 'ADMIN-01',
               name: 'Admin',
               email: 'admin@moucia.com', 
               password: hashedPassword, 
               role: 'Admin'
           });
           console.log('Successfully injected Admin directly into Cloud DB:', user.email);
        } else {
           console.log('Admin already exists in DB:', user.email);
        }
        process.exit(0);
    } catch (e) {
        console.error('Validation Crash:', e);
        process.exit(1);
    }
}
test();
