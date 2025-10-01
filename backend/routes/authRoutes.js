const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const Visitor = require('../models/visitor');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const { forgotPasswordLimiter, loginLimiter } = require('../utils/rateLimiter');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '1h';

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication endpoints
 */

/**
 * @swagger
 * /api/v1/auth/send-otp:
 *   post:
 *     summary: Send OTP to visitor
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP sent successfully
 */
router.post("/send-otp", authController.sendOtp);

/**
 * @swagger
 * /api/v1/auth/verify-otp:
 *   post:
 *     summary: Verify OTP for visitor
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone:
 *                 type: string
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP verified successfully
 */
router.post('/verify-otp', authController.verifyOtp);

/**
 * @swagger
 * /api/v1/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Password reset email sent
 */
router.post('/forgot-password', forgotPasswordLimiter, authController.forgotPassword);

/**
 * @swagger
 * /api/v1/auth/reset-password/{token}:
 *   post:
 *     summary: Reset password
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Password reset successfully
 */
router.post('/reset-password/:token', authController.resetPassword);

/**
 * @swagger
 * /api/v1/auth/check-phone:
 *   post:
 *     summary: Check if a phone number exists
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Phone number exists
 *       404:
 *         description: Phone number not registered
 */
router.post('/check-phone', loginLimiter, async (req, res) => {
    const { phone } = req.body;

    if (!phone) {
        return res.status(400).json({ message: 'Phone number is required' });
    }

    try {
        const visitor = await Visitor.findOne({ where: { contact_number: phone } });
        if (!visitor) return res.status(404).json({ message: 'Phone number is not registered' });

        return res.status(200).json({ message: 'Phone number exists', visitor_id: visitor.visitor_id, contact_number: visitor.contact_number });
    } catch (error) {
        console.error('DB error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/v1/auth/login-phone:
 *   post:
 *     summary: Login using phone number
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       404:
 *         description: Phone number not registered
 */
router.post('/login-phone', async (req, res) => {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ message: "Phone number is required." });

    try {
        const visitor = await Visitor.findOne({ where: { contact_number: phone } });
        if (!visitor) return res.status(404).json({ message: "Phone number not registered." });

        const token = jwt.sign({ id: visitor.visitor_id, role: 'visitor' }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        res.json({ message: 'Login successful.', token });
    } catch (error) {
        console.error("DB error:", error);
        res.status(500).json({ message: "Server error." });
    }
});

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Login using email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid email or password
 */
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ where: { email } });
        if (!user) return res.status(401).json({ success: false, message: 'Invalid email or password' });

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) return res.status(401).json({ success: false, message: 'Invalid email or password' });

        const payload = { id: user.id, email: user.email, user_type_id: user.user_type_id };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

        res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 3600000 });
        res.json({ success: true, user: { id: user.id, email: user.email, user_type_id: user.user_type_id } });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ success: true, message: 'Logged out successfully' });
});

// Middleware to verify token
function verifyToken(req, res, next) {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ success: false, message: 'No token provided' });

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ success: false, message: 'Invalid token' });
        req.user = decoded;
        next();
    });
}

module.exports = router;
module.exports.verifyToken = verifyToken;
