const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcrypt');

// Load env
dotenv.config({ path: path.resolve(__dirname, '.env') });

const User = require('./models/User');
const Task = require('./models/Task');
const Attendance = require('./models/Attendance');
const DailyReport = require('./models/DailyReport');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/moucia_dashboard');
        console.log('MongoDB Connected for seeding...');
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

const seedData = async () => {
    try {
        await connectDB();

        // Clear existing data
        await User.deleteMany();
        await Task.deleteMany();
        await Attendance.deleteMany();
        await DailyReport.deleteMany();

        console.log('Deleted existing users, tasks, attendance and reports...');

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);

        // Create Users
        const admin = await User.create({
            name: 'Admin User',
            email: 'admin@moucia.com',
            password: hashedPassword,
            role: 'Admin'
        });

        const emp1 = await User.create({
            name: 'John Doe',
            email: 'john@moucia.com',
            password: hashedPassword,
            role: 'Developer',
            isOnline: true,
            todayWorkedSeconds: 21600 // 6h
        });

        const emp2 = await User.create({
            name: 'Jane Smith',
            email: 'jane@moucia.com',
            password: hashedPassword,
            role: 'Designer',
            isOnline: true,
            todayWorkedSeconds: 14400 // 4h
        });

        const emp3 = await User.create({
            name: 'Mike Ross',
            email: 'mike@moucia.com',
            password: hashedPassword,
            role: 'Staff',
            isOnline: false,
            todayWorkedSeconds: 0
        });

        console.log('Users created...');

        // Create Tasks
        const today = new Date();
        const tasks = [
            {
                title: 'System Architecture Design',
                description: 'Finalize the backend microservices architecture.',
                assignedTo: emp1._id,
                status: 'In Progress',
                priority: 'High',
                dueDate: new Date(today.getTime() + 86400000 * 2)
            },
            {
                title: 'UI Component Library',
                description: 'Build the core reusable UI components.',
                assignedTo: emp2._id,
                status: 'In Progress',
                priority: 'High',
                dueDate: new Date(today.getTime() + 86400000 * 3)
            },
            {
                title: 'Database Migration',
                description: 'Migrate legacy data to the new schema.',
                assignedTo: emp1._id,
                status: 'Pending',
                priority: 'Medium',
                dueDate: new Date(today.getTime() + 86400000 * 5)
            },
            {
                title: 'Market Research',
                description: 'Analyze competitor dashboard features.',
                assignedTo: emp3._id,
                status: 'Pending',
                priority: 'Low',
                dueDate: new Date(today.getTime() + 86400000 * 7)
            }
        ];

        await Task.insertMany(tasks);
        console.log('Tasks seeded...');

        // Create Attendance records (past 7 days)
        const attendanceRecords = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateString = date.toISOString().split('T')[0];

            attendanceRecords.push({
                userId: emp1._id,
                date: dateString,
                totalWorkedSeconds: i === 0 ? 21600 : 28800,
                status: 'Present',
                completedShift: i !== 0
            });

            attendanceRecords.push({
                userId: emp2._id,
                date: dateString,
                totalWorkedSeconds: i === 0 ? 14400 : 25200,
                status: i === 0 ? 'Half Day' : 'Present',
                completedShift: i !== 0
            });
        }

        await Attendance.insertMany(attendanceRecords);
        console.log('Attendance seeded...');

        // Create Daily Reports
        const reports = [
            {
                userId: emp1._id,
                achievements: 'Mapped the entire backend service layer and implemented task governance.',
                challenges: 'Deployment port conflicts on the staging server.',
                tomorrowPlan: 'Finalize Admin Analytics and Employee performance tracking.',
                date: new Date().toISOString().split('T')[0]
            }
        ];

        await DailyReport.insertMany(reports);
        console.log('Daily Reports seeded!');

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedData();
