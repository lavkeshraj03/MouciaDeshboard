const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const User = require('./models/User');
const Task = require('./models/Task');
const Attendance = require('./models/Attendance');
const DailyReport = require('./models/DailyReport');
const connectDB = require('./config/db');

const seedUsers = async () => {
    try {
        await connectDB();

        // Clear existing data
        console.log('Clearing existing data...');
        await User.deleteMany({});
        await Task.deleteMany({});
        await Attendance.deleteMany({});
        await DailyReport.deleteMany({});

        const saltRounds = 10;

        const users = [
            {
                userId: 'MOU-ADM-001',
                name: 'Moucia Admin',
                email: 'mouciadev@moucia.com',
                password: await bcrypt.hash('mouciadev@#2026#@', saltRounds),
                role: 'Admin'
            },
            {
                userId: 'MOU-EMP-001',
                name: 'Roshan Kumar',
                email: 'roshankumar@moucia.com',
                password: await bcrypt.hash('rkmd#@2026', saltRounds),
                role: 'Tester'
            },
            {
                userId: 'MOU-EMP-002',
                name: 'Nishesh Raghav',
                email: 'nisheshraghav@moucia.com',
                password: await bcrypt.hash('nrmd#@2026', saltRounds),
                role: 'UI/UX'
            },
            {
                userId: 'MOU-EMP-003',
                name: 'Govind Sarswat',
                email: 'govindsaraswat@moucia.com',
                password: await bcrypt.hash('gsmd#@2026', saltRounds),
                role: 'Sales'
            },
            {
                userId: 'MOU-EMP-004',
                name: 'Lavkesh Rajput',
                email: 'lavkeshrajput@moucia.com',
                password: await bcrypt.hash('lrmd#@2026', saltRounds),
                role: 'Developer'
            }
        ];

        console.log('Seeding official users...');
        await User.insertMany(users);
        console.log('Official Moucia team seeded successfully!');

        process.exit();
    } catch (error) {
        console.error('Error seeding users:', error);
        process.exit(1);
    }
};

seedUsers();
