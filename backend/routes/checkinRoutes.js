// backend/routes/checkinRoutes.js
const express = require('express');
const router = express.Router();
const { checkInVisitor, checkOutVisitor } = require('../services/visitorService');

/**
 * @swagger
 * tags:
 *   name: Checkin
 *   description: Visitor check-in and check-out using token or appointment
 */

/**
 * @swagger
 * /api/v1/checkin/checkin:
 *   post:
 *     summary: Check in a visitor
 *     tags: [Checkin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - appointmentId
 *             properties:
 *               appointmentId:
 *                 type: integer
 *                 description: The appointment ID of the visitor
 *     responses:
 *       200:
 *         description: Visitor successfully checked in
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 checkin:
 *                   type: object
 *                   description: Check-in record details
 *                 token:
 *                   type: string
 *                   description: Token generated for visitor
 *       400:
 *         description: Bad request or error message
 */
router.post('/checkin', async (req, res) => {
    try {
        const { appointmentId } = req.body;
        const result = await checkInVisitor(appointmentId);
        res.json({ success: true, checkin: result.checkin, token: result.token });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/v1/checkin/checkout:
 *   post:
 *     summary: Check out a visitor
 *     tags: [Checkin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tokenId
 *             properties:
 *               tokenId:
 *                 type: string
 *                 description: Token ID assigned to the visitor at check-in
 *     responses:
 *       200:
 *         description: Visitor successfully checked out
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 checkout:
 *                   type: object
 *                   description: Check-out record details
 *       400:
 *         description: Bad request or error message
 */
router.post('/checkout', async (req, res) => {
    try {
        const { tokenId } = req.body;
        const checkOutRecord = await checkOutVisitor(tokenId);
        res.json({ success: true, checkout: checkOutRecord });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
