const express = require('express');
const {
    getBlacklistedVisitors,
    toggleBlacklist
} = require("../controllers/blacklistController");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Blacklist
 *   description: Admin blacklist management endpoints
 */

/**
 * @swagger
 * /api/v1/admin/blacklist:
 *   get:
 *     summary: Get all blacklisted visitors
 *     tags: [Blacklist]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of records per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for visitor name, NIC, email, or contact
 *     responses:
 *       200:
 *         description: List of blacklisted visitors
 */
router.get('/', getBlacklistedVisitors);

/**
 * @swagger
 * /api/v1/admin/blacklist/{visitor_id}:
 *   patch:
 *     summary: Toggle blacklist status for a visitor
 *     tags: [Blacklist]
 *     parameters:
 *       - in: path
 *         name: visitor_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Visitor ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               blacklist_status:
 *                 type: string
 *                 enum: [yes, no]
 *               reason:
 *                 type: string
 *                 description: Reason for blacklisting
 *     responses:
 *       200:
 *         description: Blacklist status updated
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Visitor not found
 */
router.patch('/:visitor_id', toggleBlacklist);

module.exports = router;
