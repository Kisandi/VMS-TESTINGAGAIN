const express = require('express');
const router = express.Router();
const {
    getRestrictedAttempts,
    getAttemptById,
    createAttempt
} = require("../controllers/restrictedAccessAttemptController");

/**
 * @swagger
 * tags:
 *   name: RestrictedAccessAttempt
 *   description: Routes for restricted access attempts
 */

/**
 * @swagger
 * /api/v1/restrictedAccessAttempt:
 *   get:
 *     summary: Get all restricted access attempts
 *     tags: [RestrictedAccessAttempt]
 *     responses:
 *       200:
 *         description: List of restricted access attempts
 */
router.get('/', getRestrictedAttempts);

/**
 * @swagger
 * /api/v1/restrictedAccessAttempt/{attempt_id}:
 *   get:
 *     summary: Get a restricted access attempt by ID
 *     tags: [RestrictedAccessAttempt]
 *     parameters:
 *       - in: path
 *         name: attempt_id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the access attempt
 *     responses:
 *       200:
 *         description: Restricted access attempt details
 *       404:
 *         description: Attempt not found
 */
router.get('/:attempt_id', getAttemptById);

/**
 * @swagger
 * /api/v1/restrictedAccessAttempt:
 *   post:
 *     summary: Create a new restricted access attempt
 *     tags: [RestrictedAccessAttempt]
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
 *               location:
 *                 type: string
 *     responses:
 *       201:
 *         description: Restricted access attempt created
 */
router.post('/', createAttempt);

module.exports = router;
