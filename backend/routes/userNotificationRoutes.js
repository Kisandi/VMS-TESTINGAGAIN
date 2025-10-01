const express = require('express');
const router = express.Router();
const { getUserNotification, createUserNotification } = require("../controllers/userNotificationController");

/**
 * @swagger
 * tags:
 *   name: UserNotifications
 *   description: Routes for managing user notifications
 */

/**
 * @swagger
 * /api/v1/user-notification:
 *   get:
 *     summary: Get all user notifications
 *     tags: [UserNotifications]
 *     responses:
 *       200:
 *         description: List of user notifications
 */
router.get('/', getUserNotification);

/**
 * @swagger
 * /api/v1/user-notification:
 *   post:
 *     summary: Create a new user notification
 *     tags: [UserNotifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - message
 *             properties:
 *               userId:
 *                 type: integer
 *               message:
 *                 type: string
 *     responses:
 *       201:
 *         description: User notification created successfully
 */
router.post('/', createUserNotification);

module.exports = router;
