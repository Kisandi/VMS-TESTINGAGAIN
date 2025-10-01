const express = require('express');
const router = express.Router();
const {
    getRestrictedNotification,
    createRestrictedNotification
} = require("../controllers/restrictedNotificationController");

/**
 * @swagger
 * tags:
 *   name: RestrictedNotification
 *   description: Routes for restricted notifications
 */

/**
 * @swagger
 * /api/v1/restrictedNotification:
 *   get:
 *     summary: Get all restricted notifications
 *     tags: [RestrictedNotification]
 *     responses:
 *       200:
 *         description: List of restricted notifications
 */
router.get('/', getRestrictedNotification);

/**
 * @swagger
 * /api/v1/restrictedNotification:
 *   post:
 *     summary: Create a new restricted notification
 *     tags: [RestrictedNotification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - visitorId
 *               - message
 *             properties:
 *               visitorId:
 *                 type: integer
 *               message:
 *                 type: string
 *     responses:
 *       201:
 *         description: Restricted notification created
 */
router.post('/', createRestrictedNotification);

module.exports = router;
