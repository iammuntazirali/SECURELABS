const express = require('express');
const Scan = require('../models/Scan');
const Vulnerability = require('../models/Vulnerability');
const User = require('../models/User');
const Group = require('../models/Group');
const { authMiddleware, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// ========== GET ANALYTICS (Faculty/TA) ==========
router.get('/', authMiddleware, async (req, res) => {
    try {
        // --- Scans per day (last 7 days) ---
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const scansPerDay = await Scan.aggregate([
            { $match: { createdAt: { $gte: sevenDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // --- Scan type distribution ---
        const scanTypes = await Scan.aggregate([
            { $group: { _id: '$scanType', count: { $sum: 1 } } }
        ]);

        // --- Vulnerability severity distribution ---
        const vulnSeverity = await Vulnerability.aggregate([
            { $group: { _id: '$severity', count: { $sum: 1 } } }
        ]);

        // --- Vulnerability status distribution ---
        const vulnStatus = await Vulnerability.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        // --- Total counts ---
        const totalScans = await Scan.countDocuments();
        const totalVulns = await Vulnerability.countDocuments();
        const totalUsers = await User.countDocuments();
        const totalGroups = await Group.countDocuments();

        // --- Top scanned targets ---
        const topTargets = await Scan.aggregate([
            { $group: { _id: '$target', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        // --- Recent activity (last 10 scans) ---
        const recentScans = await Scan.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .select('target scanType parsed.openPorts createdAt')
            .populate('user', 'name');

        res.json({
            success: true,
            analytics: {
                scansPerDay: scansPerDay.map(s => ({ date: s._id, count: s.count })),
                scanTypes: scanTypes.map(s => ({ type: s._id || 'quick', count: s.count })),
                vulnSeverity: vulnSeverity.map(v => ({ severity: v._id, count: v.count })),
                vulnStatus: vulnStatus.map(v => ({ status: v._id, count: v.count })),
                topTargets: topTargets.map(t => ({ target: t._id, count: t.count })),
                recentScans,
                totals: {
                    scans: totalScans,
                    vulnerabilities: totalVulns,
                    users: totalUsers,
                    groups: totalGroups
                }
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
