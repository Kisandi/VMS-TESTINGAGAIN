const express = require('express');
const router = express.Router();
const { endVisit, extendStay } = require('../controllers/visitController');

/**
 * @swagger
 * tags:
 *   name: Visit
 *   description: API for managing visits
 */

/**
 * @swagger
 * /api/v1/visit/end-visit:
 *   post:
 *     summary: End a visitor's visit
 *     tags: [Visit]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - visitorId
 *             properties:
 *               visitorId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Visit ended successfully
 */
router.post('/end-visit', endVisit);

/**
 * @swagger
 * /api/v1/visit/extend-stay:
 *   post:
 *     summary: Extend a visitor's stay
 *     tags: [Visit]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - visitorId
 *               - newEndTime
 *             properties:
 *               visitorId:
 *                 type: integer
 *               newEndTime:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Stay extended successfully
 */
router.post('/extend-stay', extendStay);

module.exports = router;
