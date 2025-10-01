const express = require('express');
const router = express.Router();
const {
    getNotification,
    getNotificationById,
    createNotification,
    updateNotification,
    deleteNotification,
    getLiveNotifications,
    markAllAsRead,
    markAsRead
} = require("../controllers/notificationController");

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: API endpoints for managing notifications
 */

/**
 * @swagger
 * /api/v1/notification/live:
 *   get:
 *     summary: Get live notifications
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: List of live notifications
 */
router.get('/live', getLiveNotifications);

/**
 * @swagger
 * /api/v1/notification:
 *   get:
 *     summary: Get all notifications
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: List of notifications
 */
router.get('/', getNotification);

/**
 * @swagger
 * /api/v1/notification/{notification_id}:
 *   get:
 *     summary: Get a notification by ID
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: notification_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification details
 */
router.get('/:notification_id', getNotificationById);

/**
 * @swagger
 * /api/v1/notification/markAsRead/{notification_id}:
 *   patch:
 *     summary: Mark a notification as read
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: notification_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification marked as read
 */
router.patch('/markAsRead/:notification_id', markAsRead);

/**
 * @swagger
 * /api/v1/notification/markAllAsRead:
 *   post:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */
router.post('/markAllAsRead', markAllAsRead);

/**
 * @swagger
 * /api/v1/notification:
 *   post:
 *     summary: Create a new notification
 *     tags: [Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - message
 *             properties:
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               visitorId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Notification created successfully
 */
router.post('/', createNotification);

/**
 * @swagger
 * /api/v1/notification/{notification_id}:
 *   put:
 *     summary: Update an existing notification
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: notification_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Notification ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Notification updated successfully
 */
router.put('/:notification_id', updateNotification);

/**
 * @swagger
 * /api/v1/notification/{notification_id}:
 *   delete:
 *     summary: Delete a notification
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: notification_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification deleted successfully
 */
router.delete('/:notification_id', deleteNotification);

module.exports = router;
