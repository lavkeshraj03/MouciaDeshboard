const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Login User
exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }

        const user = await User.findOne({ email }).populate('reportingTo', 'name');
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate token
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' } // Auto logout on token expiry
        );

        res.status(200).json({
            token,
            user: {
                id: user._id,
                userId: user.userId,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                joiningDate: user.joiningDate,
                reportingTo: user.reportingTo ? user.reportingTo.name : 'Admin Manager',
                workLocation: user.workLocation,
                isActive: user.isActive,
                isOnline: user.isOnline,
                todayWorkedSeconds: user.todayWorkedSeconds,
                profilePicture: user.profilePicture || ''
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Quick util to create first admin (can be removed/disabled in prod)
exports.setupAdmin = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        user = await User.create({
            userId: 'ADMIN-01', // Satisfy required Mongoose validation
            name,
            email,
            password: hashedPassword,
            role: 'Admin' // Force admin role for setup
        });
        res.status(201).json({ message: 'Admin created successfully', user: { id: user._id, email: user.email } });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// Get current user profile
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password').populate('reportingTo', 'name');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({
            user: {
                id: user._id,
                userId: user.userId,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                joiningDate: user.joiningDate,
                reportingTo: user.reportingTo ? user.reportingTo.name : 'Admin Manager',
                workLocation: user.workLocation,
                isActive: user.isActive,
                isOnline: user.isOnline,
                todayWorkedSeconds: user.todayWorkedSeconds
            }
        });
    } catch (error) {
        console.error('Get Me Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Update Profile Image
exports.updateProfileImage = async (req, res) => {
    try {
        const { profilePicture } = req.body;

        if (!profilePicture) {
            return res.status(400).json({ message: 'No image provided' });
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { profilePicture },
            { new: true }
        ).select('-password').populate('reportingTo', 'name');

        res.status(200).json({
            message: 'Profile image updated successfully',
            user: {
                id: user._id,
                userId: user.userId,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                joiningDate: user.joiningDate,
                reportingTo: user.reportingTo ? user.reportingTo.name : 'Admin Manager',
                workLocation: user.workLocation,
                isActive: user.isActive,
                isOnline: user.isOnline,
                todayWorkedSeconds: user.todayWorkedSeconds,
                profilePicture: user.profilePicture
            }
        });
    } catch (error) {
        console.error('Profile Image Update Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};
