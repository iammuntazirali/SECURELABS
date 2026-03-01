const express = require('express');
const Vulnerability = require('../models/Vulnerability');
const { authMiddleware, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

//--- submit vulnerability ---//
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { attackType, severity, description, target } = req.body;

        const vuln = await Vulnerability.create({
            attackType,
            severity,
            description,
            target,
            user: req.user.id,
            group: req.user.group || ''
        });

        res.status(201).json({
            success: true,
            message: 'Vulnerability submitted for review',
            vulnerability: vuln
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

//--- get my vulnerabilities ---//
router.get('/mine', authMiddleware, async (req, res) => {
    try {
        const vulns = await Vulnerability.find({ user: req.user.id })
            .sort({ createdAt: -1 });
        res.json({ success: true, vulnerabilities: vulns });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

//--- get all vulnerabilities ---//
router.get('/', authMiddleware, authorizeRoles('ta', 'faculty'), async (req, res) => {
    try {
        const vulns = await Vulnerability.find()
            .populate('user', 'name email role')
            .sort({ createdAt: -1 });
        res.json({ success: true, vulnerabilities: vulns });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

//--- review vulnerability ---//
router.patch('/:id/review', authMiddleware, authorizeRoles('ta', 'faculty'), async (req, res) => {
    try {
        const { status } = req.body; // 'Accepted' or 'Rejected'
        const vuln = await Vulnerability.findByIdAndUpdate(
            req.params.id,
            { status, reviewedBy: req.user.id },
            { new: true }
        );
        if (!vuln) return res.status(404).json({ success: false, error: 'Not found' });
        res.json({ success: true, vulnerability: vuln });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
