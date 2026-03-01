const express = require('express');
const Group = require('../models/Group');
const { authMiddleware, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

//--- get all groups ---//
router.get('/', authMiddleware, async (req, res) => {
    try {
        const groups = await Group.find()
            .populate('assignedTA', 'name email')
            .sort({ groupId: 1 });
        res.json({ success: true, groups });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

//--- create group ---//
router.post('/', authMiddleware, authorizeRoles('faculty'), async (req, res) => {
    try {
        const { groupId, lead, members, target, assignedTA } = req.body;
        const group = await Group.create({ groupId, lead, members, target, assignedTA });
        res.status(201).json({ success: true, group });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

//--- grade group ---//
router.patch('/:id/grade', authMiddleware, authorizeRoles('ta', 'faculty'), async (req, res) => {
    try {
        const { score, feedback } = req.body;
        const group = await Group.findByIdAndUpdate(
            req.params.id,
            { score, feedback },
            { new: true }
        );
        if (!group) return res.status(404).json({ success: false, error: 'Group not found' });
        res.json({ success: true, message: `Grade saved for ${group.groupId}`, group });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

//--- assign ta to group ---//
router.patch('/:id/assign-ta', authMiddleware, authorizeRoles('faculty'), async (req, res) => {
    try {
        const { taId } = req.body;
        const group = await Group.findByIdAndUpdate(
            req.params.id,
            { assignedTA: taId },
            { new: true }
        ).populate('assignedTA', 'name email');
        if (!group) return res.status(404).json({ success: false, error: 'Group not found' });
        res.json({ success: true, group });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

//--- seed default groups ---//
router.post('/seed', authMiddleware, authorizeRoles('faculty'), async (req, res) => {
    try {
        const existing = await Group.countDocuments();
        if (existing > 0) {
            return res.json({ success: true, message: `${existing} groups already exist. Skipping seed.` });
        }

        const defaultGroups = [
            { groupId: 'G-01', lead: 'Ayush', members: ['Ayush', 'Ravi', 'Sneha'], target: '192.168.1.10', status: 'Active' },
            { groupId: 'G-02', lead: 'Rahul', members: ['Rahul', 'Priya', 'Amit'], target: '192.168.1.15', status: 'Active' },
            { groupId: 'G-03', lead: 'Sneha', members: ['Sneha', 'Karan', 'Neha'], target: '192.168.1.22', status: 'Idle' },
            { groupId: 'G-04', lead: 'Amit', members: ['Amit', 'Pooja', 'Arjun'], target: '192.168.1.9', status: 'Active' },
        ];

        await Group.insertMany(defaultGroups);
        res.status(201).json({ success: true, message: '4 default groups seeded' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
