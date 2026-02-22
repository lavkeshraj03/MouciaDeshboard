const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const express = require('express');
const http = require('http');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();
const server = http.createServer(app);

// =====================
// CORS FIX (PRODUCTION SAFE)
// =====================
app.use(cors({
    origin: [
        "http://localhost:3000",
        "https://moucia-deshboard-w3zt.vercel.app"
    ],
    credentials: true,
    optionsSuccessStatus: 200
}));

app.use(express.json());

// =====================
// ROUTES
// =====================
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/session', require('./routes/sessionRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/task', require('./routes/taskRoutes'));
app.use('/api/report', require('./routes/dailyReportRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

// =====================
// CRON JOBS
// =====================
const initCronJobs = require('./cron/dailyReset');
initCronJobs();

// =====================
// HEALTH CHECK
// =====================
app.get('/api/health', (req, res) => {
    const mongoose = require('mongoose');
    res.status(200).json({
        status: 'ok',
        message: 'Moucia Backend API is fully operational',
        database: mongoose.connection.readyState === 1 ? 'Connected to Atlas' : 'Disconnected'
    });
});

// =====================
// BASIC ROUTE
// =====================
app.get('/', (req, res) => {
    res.send('Moucia Backend API is running...');
});

// =====================
// SOCKET INIT
// =====================
const { initSocket } = require('./config/socket');
initSocket(server);

const PORT = process.env.PORT || 5000;

// =====================
// START SERVER AFTER DB CONNECT
// =====================
connectDB()
    .then(() => {
        server.listen(PORT, () =>
            console.log(`[System] Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`)
        );
    })
    .catch(err => {
        console.error('Failed to connect to database at startup:', err);
        process.exit(1);
    });

// =====================
// GRACEFUL SHUTDOWN
// =====================
process.on('SIGINT', async () => {
    console.log('SIGINT signal received: closing HTTP server and Database connection...');
    server.close(() => {
        console.log('HTTP server closed.');
    });

    const mongoose = require('mongoose');
    if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
        console.log('MongoDB connection securely closed.');
    }

    process.exit(0);
});