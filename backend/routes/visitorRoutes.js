const express = require('express');
const router = express.Router();
const {
    getVisitor,
    getVisitorById,
    createVisitor,
    updateVisitor,
    deleteVisitor,
    generateVisitorIdHandler,
    getPastVisits,
    checkEmailExists,
    checkIdNumberExists,
    getBlacklistedVisitors,
    toggleBlacklistStatus
} = require("../controllers/visitorController");

const visitorController = require('../controllers/authController');
const { validateCreateVisitor } = require('../validators/visitorValidator');
const { loginLimiter } = require('../utils/rateLimiter');

/**
 * @swagger
 * tags:
 *   name: Visitor
 *   description: API for managing visitors
 */





/**
 * @swagger
 * /api/v1/visitor/check-email:
 *   get:
 *     summary: Check if email exists
 *     tags: [Visitor]
 *     parameters:
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Email existence result
 */
router.get('/check-email', checkEmailExists);

/**
 * @swagger
 * /api/v1/visitor/check-idnumber:
 *   get:
 *     summary: Check if ID number exists
 *     tags: [Visitor]
 *     parameters:
 *       - in: query
 *         name: idNumber
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: ID number existence result
 */
router.get('/check-idnumber', checkIdNumberExists);

/**
 * @swagger
 * /api/v1/visitor/blacklisted:
 *   get:
 *     summary: Get all blacklisted visitors
 *     tags: [Visitor]
 *     responses:
 *       200:
 *         description: List of blacklisted visitors
 */
router.get('/blacklisted', getBlacklistedVisitors);

/**
 * @swagger
 * /api/v1/visitor/{visitor_id}/blacklist:
 *   patch:
 *     summary: Toggle blacklist status for a visitor
 *     tags: [Visitor]
 *     parameters:
 *       - in: path
 *         name: visitor_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Blacklist status toggled
 */
router.patch('/:visitor_id/blacklist', toggleBlacklistStatus);

/**
 * @swagger
 * /api/v1/visitor/generate-visitor-id:
 *   get:
 *     summary: Generate a new visitor ID
 *     tags: [Visitor]
 *     responses:
 *       200:
 *         description: Generated visitor ID
 */
router.get('/generate-visitor-id', generateVisitorIdHandler);

/**
 * @swagger
 * /api/v1/visitor/past-visits:
 *   get:
 *     summary: Get past visits of visitors
 *     tags: [Visitor]
 *     responses:
 *       200:
 *         description: Past visits data
 */
router.get('/past-visits', getPastVisits);

/**
 * @swagger
 * /api/v1/visitor:
 *   get:
 *     summary: Get all visitors
 *     tags: [Visitor]
 *     responses:
 *       200:
 *         description: List of all visitors
 */
router.get('/', getVisitor);

/**
 * @swagger
 * /api/v1/visitor/{visitor_id}:
 *   get:
 *     summary: Get visitor by ID
 *     tags: [Visitor]
 *     parameters:
 *       - in: path
 *         name: visitor_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Visitor data
 */
router.get('/:visitor_id', getVisitorById);

/**
 * @swagger
 * /api/v1/visitor:
 *   post:
 *     summary: Create a new visitor
 *     tags: [Visitor]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               contact_number:
 *                 type: string
 *               id_number:
 *                 type: string
 *     responses:
 *       201:
 *         description: Visitor created
 */
router.post('/', validateCreateVisitor, createVisitor);

/**
 * @swagger
 * /api/v1/visitor/{visitor_id}:
 *   put:
 *     summary: Update visitor information
 *     tags: [Visitor]
 *     parameters:
 *       - in: path
 *         name: visitor_id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               contact_number:
 *                 type: string
 *               id_number:
 *                 type: string
 *     responses:
 *       200:
 *         description: Visitor updated
 */
router.put('/:visitor_id', updateVisitor);

/**
 * @swagger
 * /api/v1/visitor/{visitor_id}:
 *   delete:
 *     summary: Delete a visitor
 *     tags: [Visitor]
 *     parameters:
 *       - in: path
 *         name: visitor_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Visitor deleted
 */
router.delete('/:visitor_id', deleteVisitor);


/**
 * @swagger
 * /api/v1/visitor/send-otp:
 *   post:
 *     summary: Send OTP to visitor
 *     tags: [Visitor]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contact_number
 *             properties:
 *               contact_number:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP sent
 */
router.post('/send-otp', visitorController.sendOtp);

/**
 * @swagger
 * /api/v1/visitor/verify-otp:
 *   post:
 *     summary: Verify visitor OTP
 *     tags: [Visitor]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contact_number
 *               - otp
 *             properties:
 *               contact_number:
 *                 type: string
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP verified successfully
 */
router.post('/verify-otp', loginLimiter, visitorController.verifyOtp);

module.exports = router;
