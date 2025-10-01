const express = require('express');
const router = express.Router();
const { accessLocation, getAccessLogs } = require('../controllers/accessController');

/**
 * @swagger
 * /api/v1/access:
 *   get:
 *     summary: Get all access logs
 *     description: Fetches a list of access logs including visitor, location, status, and timestamp.
 *     tags: [Access]
 *     responses:
 *       200:
 *         description: List of access logs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   visitorId:
 *                     type: integer
 *                   location:
 *                     type: string
 *                   status:
 *                     type: string
 *                     example: allowed
 *                   timestamp:
 *                     type: string
 *                     format: date-time
 */
router.get('/', getAccessLogs);

/**
 * @swagger
 * /api/v1/access:
 *   post:
 *     summary: Record a visitor access attempt
 *     description: Logs a visitor's attempt to access a location.
 *     tags: [Access]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - visitorId
 *               - location
 *             properties:
 *               visitorId:
 *                 type: integer
 *                 description: ID of the visitor
 *               location:
 *                 type: string
 *                 description: The location being accessed
 *               status:
 *                 type: string
 *                 description: Access status (optional, defaults handled in controller)
 *                 example: allowed
 *     responses:
 *       201:
 *         description: Access attempt recorded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 accessId:
 *                   type: integer
 *       400:
 *         description: Invalid request data
 */
router.post('/', accessLocation);

module.exports = router;
