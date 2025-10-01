const express = require('express');
const {
    getCheckInOut,
    getCheckInOutById,
    createCheckInOut,
    updateCheckInOut,
    deleteCheckInOut,
    getCurrentVisitors,
    getPastVisitors,
    getUpcomingVisitors,
    checkOutByRFID,
    checkInByRFID,
    endMeetingManually,
    extendStay
} = require("../controllers/checkInOutController");
const { getVisitorsByHost } = require('../controllers/getVisitorsByHost');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: CheckInOut
 *   description: Visitor check-in and check-out management
 */

/**
 * @swagger
 * /api/v1/checkInOut:
 *   get:
 *     summary: Get all check-in/out records
 *     tags: [CheckInOut]
 *     responses:
 *       200:
 *         description: List of check-in/out records
 */
router.get('/', getCheckInOut);

/**
 * @swagger
 * /api/v1/checkInOut/{checkin_id}:
 *   get:
 *     summary: Get a check-in/out record by ID
 *     tags: [CheckInOut]
 *     parameters:
 *       - in: path
 *         name: checkin_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the check-in/out record
 *     responses:
 *       200:
 *         description: Record found
 *       404:
 *         description: Record not found
 */
router.get('/:checkin_id', getCheckInOutById);

/**
 * @swagger
 * /api/v1/checkInOut:
 *   post:
 *     summary: Create a new check-in/out record
 *     tags: [CheckInOut]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               visitorId:
 *                 type: integer
 *               location:
 *                 type: string
 *               checkInTime:
 *                 type: string
 *                 format: date-time
 *               checkOutTime:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Record created
 */
router.post('', createCheckInOut);

/**
 * @swagger
 * /api/v1/checkInOut/{checkin_id}:
 *   put:
 *     summary: Update a check-in/out record
 *     tags: [CheckInOut]
 *     parameters:
 *       - in: path
 *         name: checkin_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the record to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               visitorId:
 *                 type: integer
 *               location:
 *                 type: string
 *               checkInTime:
 *                 type: string
 *                 format: date-time
 *               checkOutTime:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Record updated
 *       404:
 *         description: Record not found
 */
router.put('/:checkin_id', updateCheckInOut);

/**
 * @swagger
 * /api/v1/checkInOut/{checkin_id}:
 *   delete:
 *     summary: Delete a check-in/out record
 *     tags: [CheckInOut]
 *     parameters:
 *       - in: path
 *         name: checkin_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the record to delete
 *     responses:
 *       200:
 *         description: Record deleted
 *       404:
 *         description: Record not found
 */
router.delete('/:checkin_id', deleteCheckInOut);

/**
 * @swagger
 * /api/v1/checkInOut/host/{user_id}:
 *   get:
 *     summary: Get all visitors for a specific host
 *     tags: [CheckInOut]
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Host user ID
 *     responses:
 *       200:
 *         description: List of visitors for the host
 */
router.get('/host/:user_id', getVisitorsByHost);

/**
 * @swagger
 * /api/v1/checkInOut/current:
 *   get:
 *     summary: Get all currently checked-in visitors
 *     tags: [CheckInOut]
 *     responses:
 *       200:
 *         description: List of current visitors
 */
router.get('/current', getCurrentVisitors);

/**
 * @swagger
 * /api/v1/checkInOut/upcoming:
 *   get:
 *     summary: Get upcoming visitors
 *     tags: [CheckInOut]
 *     responses:
 *       200:
 *         description: List of upcoming visitors
 */
router.get('/upcoming', getUpcomingVisitors);

/**
 * @swagger
 * /api/v1/checkInOut/past:
 *   get:
 *     summary: Get past visitors
 *     tags: [CheckInOut]
 *     responses:
 *       200:
 *         description: List of past visitors
 */
router.get('/past', getPastVisitors);

/**
 * @swagger
 * /api/v1/checkInOut/checkin:
 *   post:
 *     summary: Check in a visitor by RFID
 *     tags: [CheckInOut]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rfidToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Visitor checked in
 */
router.post('/checkin', checkInByRFID);

/**
 * @swagger
 * /api/v1/checkInOut/checkout:
 *   post:
 *     summary: Check out a visitor by RFID
 *     tags: [CheckInOut]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rfidToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Visitor checked out
 */
router.post('/checkout', checkOutByRFID);

/**
 * @swagger
 * /api/v1/checkInOut/end-meeting:
 *   post:
 *     summary: End a meeting manually
 *     tags: [CheckInOut]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               checkinId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Meeting ended
 */
router.post('/end-meeting', endMeetingManually);

/**
 * @swagger
 * /api/v1/checkInOut/extend-stay:
 *   post:
 *     summary: Extend a visitor's stay
 *     tags: [CheckInOut]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               checkinId:
 *                 type: string
 *               newCheckoutTime:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Stay extended
 */
router.post('/extend-stay', extendStay);

module.exports = router;
