const express = require('express');
const {
    getAppointment,
    getAppointmentById,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    getAppointmentByStatus,
    getAppointmentByStatusForVisitor
} = require("../controllers/appointmentController");

const appointmentValidator = require("../validators/appointmentValidator");
const validateRequest = require("../middlewares/validateRequest");

const router = express.Router();

/**
 * @swagger
 * /api/v1/appointment:
 *   get:
 *     summary: Get all appointments
 *     tags: [Appointment]
 *     responses:
 *       200:
 *         description: List of all appointments
 */
router.get('/', getAppointment);

/**
 * @swagger
 * /api/v1/appointment/status:
 *   get:
 *     summary: Get appointments by status
 *     tags: [Appointment]
 *     responses:
 *       200:
 *         description: List of appointments filtered by status
 */
router.get('/status', getAppointmentByStatus);

/**
 * @swagger
 * /api/v1/appointment/status-by-visitor:
 *   get:
 *     summary: Get appointments by status for a visitor
 *     tags: [Appointment]
 *     responses:
 *       200:
 *         description: List of appointments filtered by status for a specific visitor
 */
router.get('/status-by-visitor', getAppointmentByStatusForVisitor);

/**
 * @swagger
 * /api/v1/appointment/{appointment_id}:
 *   get:
 *     summary: Get an appointment by ID
 *     tags: [Appointment]
 *     parameters:
 *       - in: path
 *         name: appointment_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Appointment ID
 *     responses:
 *       200:
 *         description: Appointment details
 *       404:
 *         description: Appointment not found
 */
router.get('/:appointment_id', getAppointmentById);

/**
 * @swagger
 * /api/v1/appointment:
 *   post:
 *     summary: Create a new appointment
 *     tags: [Appointment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               visitorId:
 *                 type: integer
 *               purpose:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               time:
 *                 type: string
 *               duration:
 *                 type: integer
 *               department:
 *                 type: string
 *               host:
 *                 type: string
 *     responses:
 *       201:
 *         description: Appointment created successfully
 */
router.post('/', appointmentValidator(), validateRequest, createAppointment);

/**
 * @swagger
 * /api/v1/appointment/{appointment_id}:
 *   put:
 *     summary: Update an existing appointment
 *     tags: [Appointment]
 *     parameters:
 *       - in: path
 *         name: appointment_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Appointment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               visitorId:
 *                 type: integer
 *               purpose:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               time:
 *                 type: string
 *               duration:
 *                 type: integer
 *               department:
 *                 type: string
 *               host:
 *                 type: string
 *     responses:
 *       200:
 *         description: Appointment updated successfully
 */
router.put('/:appointment_id', appointmentValidator(), validateRequest, updateAppointment);

/**
 * @swagger
 * /api/v1/appointment/{appointment_id}:
 *   delete:
 *     summary: Delete an appointment
 *     tags: [Appointment]
 *     parameters:
 *       - in: path
 *         name: appointment_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Appointment ID
 *     responses:
 *       200:
 *         description: Appointment deleted successfully
 *       404:
 *         description: Appointment not found
 */
router.delete('/:appointment_id', deleteAppointment);

module.exports = router;
