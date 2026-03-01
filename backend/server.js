require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { exec } = require('child_process');
const authRoutes = require('./routes/auth');
const scanRoutes = require('./routes/scans');
const vulnRoutes = require('./routes/vulnerabilities');
const groupRoutes = require('./routes/groups');
const Scan = require('./models/Scan');
const { authMiddleware } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// ========== MONGODB CONNECTION ==========
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => {
        console.error('❌ MongoDB Connection Error:', err.message);
        console.log('⚠️  Server will run without DB. Auth features will not work.');
    });

// ========== ROUTES ==========
app.use('/api/auth', authRoutes);
app.use('/api/scans', scanRoutes);
app.use('/api/vulnerabilities', vulnRoutes);
app.use('/api/groups', groupRoutes);

// ========== NMAP SCAN API (Protected — requires login) ==========
app.post('/api/scan', authMiddleware, async (req, res) => {
    const { targetIp, scanType } = req.body;

    // --- INPUT VALIDATION (Security) ---
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!targetIp || (!ipRegex.test(targetIp) && !domainRegex.test(targetIp))) {
        return res.status(400).json({
            success: false,
            error: 'Invalid target. Use IP (e.g. 192.168.1.1) or domain (e.g. scanme.nmap.org)'
        });
    }

    // Block dangerous characters (command injection prevention)
    if (/[;&|`$(){}]/.test(targetIp)) {
        return res.status(400).json({
            success: false,
            error: 'Invalid characters in target IP'
        });
    }

    // --- SCAN TYPE SELECT ---
    let nmapCommand;
    switch (scanType) {
        case 'quick':
            nmapCommand = `nmap -T4 -F ${targetIp}`;
            break;
        case 'full':
            nmapCommand = `nmap -T4 -p- ${targetIp}`;
            break;
        case 'vuln':
            nmapCommand = `nmap --script vuln ${targetIp}`;
            break;
        case 'os':
            nmapCommand = `nmap -O ${targetIp}`;
            break;
        case 'service':
            nmapCommand = `nmap -sV ${targetIp}`;
            break;
        default:
            nmapCommand = `nmap -T4 -F ${targetIp}`;
    }

    console.log(`[SCAN] User: ${req.user.email} | Running: ${nmapCommand}`);

    // --- EXECUTE NMAP ---
    exec(nmapCommand, { timeout: 120000 }, (error, stdout, stderr) => {
        if (error) {
            console.error(`[ERROR] ${error.message}`);
            return res.status(500).json({
                success: false,
                error: `Scan failed: ${error.message}`,
                raw: stderr
            });
        }

        // --- PARSE NMAP OUTPUT ---
        const parsedResult = parseNmapOutput(stdout);

        // --- SAVE TO DATABASE ---
        Scan.create({
            target: targetIp,
            scanType: scanType || 'quick',
            raw: stdout,
            parsed: parsedResult,
            user: req.user.id
        }).catch(dbErr => {
            console.error('[DB] Failed to save scan:', dbErr.message);
        });

        res.json({
            success: true,
            target: targetIp,
            scanType: scanType || 'quick',
            raw: stdout,
            parsed: parsedResult,
            timestamp: new Date().toISOString(),
            scannedBy: req.user.email
        });
    });
});

// ========== NMAP OUTPUT PARSER ==========
function parseNmapOutput(output) {
    const lines = output.split('\n');
    const ports = [];
    let hostStatus = 'unknown';
    let osGuess = '';
    let scanTime = '';

    for (const line of lines) {
        if (line.includes('Host is up')) {
            hostStatus = 'up';
            const latencyMatch = line.match(/\(([\d.]+)s latency\)/);
            if (latencyMatch) {
                hostStatus = `up (${latencyMatch[1]}s latency)`;
            }
        }
        if (line.includes('Host seems down') || line.includes('host down')) {
            hostStatus = 'down';
        }
        const portMatch = line.match(/^(\d+)\/(tcp|udp)\s+(open|closed|filtered)\s+(.*)$/);
        if (portMatch) {
            ports.push({
                port: parseInt(portMatch[1]),
                protocol: portMatch[2],
                state: portMatch[3],
                service: portMatch[4].trim()
            });
        }
        if (line.includes('OS details:') || line.includes('Running:')) {
            osGuess = line.trim();
        }
        if (line.includes('Nmap done:')) {
            scanTime = line.trim();
        }
    }

    return {
        hostStatus,
        totalPorts: ports.length,
        openPorts: ports.filter(p => p.state === 'open').length,
        closedPorts: ports.filter(p => p.state === 'closed').length,
        filteredPorts: ports.filter(p => p.state === 'filtered').length,
        ports,
        osGuess,
        scanTime
    };
}

// ========== HEALTH CHECK ==========
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'SecureiX Backend Running 🛡️' });
});

// ========== START SERVER ==========
app.listen(PORT, () => {
    console.log(`\n🛡️  SecureiX Backend running on http://localhost:${PORT}`);
    console.log(`📡 Nmap API:  POST http://localhost:${PORT}/api/scan`);
    console.log(`🔐 Auth API:  POST http://localhost:${PORT}/api/auth/signup`);
    console.log(`🔐 Auth API:  POST http://localhost:${PORT}/api/auth/login`);
    console.log(`❤️  Health:    GET  http://localhost:${PORT}/api/health\n`);
});
