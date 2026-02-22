const Settings = require('../models/Settings');

// Get global settings (creates defaults if none exist)
exports.getSettings = async (req, res) => {
    try {
        let settings = await Settings.findOne();

        if (!settings) {
            settings = await Settings.create({});
        }

        res.status(200).json({ settings });
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Update global settings
exports.updateSettings = async (req, res) => {
    try {
        const updates = req.body;

        let settings = await Settings.findOne();
        if (!settings) {
            settings = await Settings.create(updates);
        } else {
            settings = await Settings.findOneAndUpdate({}, updates, { new: true });
        }

        res.status(200).json({ message: 'Settings updated successfully', settings });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};
