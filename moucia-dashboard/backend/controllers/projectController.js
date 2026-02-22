const Project = require('../models/Project');
const Notification = require('../models/Notification');

// Create a new project
exports.createProject = async (req, res) => {
    try {
        const { title, description, category, team, status, dueDate, deliverableDate } = req.body;

        const project = await Project.create({
            title,
            description,
            category,
            team,
            status,
            dueDate,
            deliverableDate
        });

        await project.populate('team', 'name role email');

        // Send notifications to all team members
        if (team && Array.isArray(team)) {
            const notifications = team.map(userId => ({
                userId,
                title: 'Added to Project',
                message: `You have been assigned to project: "${title}"`,
                type: 'Project' // Changed from 'Task' to 'Project' as per instruction context
            }));
            await Notification.insertMany(notifications);
        }

        res.status(201).json({ message: 'Project created successfully', project });
    } catch (error) {
        console.error('Create Project Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Get all projects
exports.getAllProjects = async (req, res) => {
    try {
        const projects = await Project.find()
            .populate('team', 'name role email')
            .sort({ createdAt: -1 });

        res.status(200).json({ projects });
    } catch (error) {
        console.error('Get Projects Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Update project
exports.updateProject = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const project = await Project.findByIdAndUpdate(id, updates, { new: true })
            .populate('team', 'name role email');

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        res.status(200).json({ message: 'Project updated successfully', project });
    } catch (error) {
        console.error('Update Project Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Delete project
exports.deleteProject = async (req, res) => {
    try {
        const { id } = req.params;
        const project = await Project.findByIdAndDelete(id);

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        res.status(200).json({ message: 'Project deleted successfully' });
    } catch (error) {
        console.error('Delete Project Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};
