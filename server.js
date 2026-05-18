const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();

const db = require('./config/db');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ message: 'No token provided' });

    jwt.verify(token.split(' ')[1], process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ message: 'Unauthorized' });
        req.userId = decoded.id;
        req.userRole = decoded.role;
        next();
    });
};

const isAdmin = (req, res, next) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'Require Admin Role' });
    next();
};

// ========================
// Authentication API
// ========================
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        // Check if user exists
        const [existing] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existing.length > 0) return res.status(400).json({ message: 'Email already registered' });

        const hashedPassword = await bcrypt.hash(password, 10);
        await db.query('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', 
            [name, email, hashedPassword, 'student']);
        
        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(404).json({ message: 'User not found' });

        const user = users[0];
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return res.status(401).json({ message: 'Invalid password' });

        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.status(200).json({ 
            token, 
            user: { id: user.id, name: user.name, email: user.email, role: user.role } 
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ========================
// Courses API
// ========================
app.get('/api/courses', async (req, res) => {
    try {
        const [courses] = await db.query('SELECT * FROM courses');
        res.status(200).json(courses);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ========================
// Applications API
// ========================
// Student: submit application
app.post('/api/applications', verifyToken, async (req, res) => {
    try {
        if (req.userRole !== 'student') return res.status(403).json({ message: 'Only students can apply' });
        const { course_id } = req.body;

        // Check if already applied
        const [existing] = await db.query('SELECT * FROM applications WHERE user_id = ? AND course_id = ?', [req.userId, course_id]);
        if (existing.length > 0) return res.status(400).json({ message: 'You have already applied for this course' });

        await db.query('INSERT INTO applications (user_id, course_id, status) VALUES (?, ?, ?)', 
            [req.userId, course_id, 'pending']);
        
        res.status(201).json({ message: 'Application submitted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Student: get my applications
app.get('/api/my-applications', verifyToken, async (req, res) => {
    try {
        const [apps] = await db.query(`
            SELECT a.id, a.status, a.submission_date, c.course_name, c.department, c.fees 
            FROM applications a 
            JOIN courses c ON a.course_id = c.id 
            WHERE a.user_id = ?
        `, [req.userId]);
        res.status(200).json(apps);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Admin: get all applications
app.get('/api/admin/applications', verifyToken, isAdmin, async (req, res) => {
    try {
        const [apps] = await db.query(`
            SELECT a.id, a.status, a.submission_date, u.name as student_name, u.email, c.course_name 
            FROM applications a 
            JOIN users u ON a.user_id = u.id 
            JOIN courses c ON a.course_id = c.id
            ORDER BY a.submission_date DESC
        `);
        res.status(200).json(apps);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Admin: update application status
app.put('/api/admin/applications/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        if (!['pending', 'approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }
        await db.query('UPDATE applications SET status = ? WHERE id = ?', [status, req.params.id]);
        res.status(200).json({ message: 'Application status updated' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
