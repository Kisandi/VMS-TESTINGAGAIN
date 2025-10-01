const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: User
 *   description: Role-based access routes
 */

/**
 * @swagger
 * /api/v1/user/admin/visitors:
 *   get:
 *     summary: Get all visitors (admin only)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of visitors
 */
router.get('/admin/visitors', authenticateToken, authorizeRoles('admin'), (req, res) => {
    res.json({ message: 'Visitors data (admin only)' });
});

/**
 * @swagger
 * /api/v1/user/reception/checkin:
 *   post:
 *     summary: Check-in visitor (admin or receptionist)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Check-in successful
 */
router.post('/reception/checkin', authenticateToken, authorizeRoles('admin', 'receptionist'), (req, res) => {
    res.json({ message: 'Check-in (admin/receptionist)' });
});

/**
 * @swagger
 * /api/v1/user/security/logs:
 *   get:
 *     summary: Get security logs (admin or security)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Security logs
 */
router.get('/security/logs', authenticateToken, authorizeRoles('admin', 'security'), (req, res) => {
    res.json({ message: 'Security logs (admin/security)' });
});

module.exports = router;
