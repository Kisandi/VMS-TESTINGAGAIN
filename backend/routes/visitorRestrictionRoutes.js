const express = require('express');
const router = express.Router();
const {
   getVisitorRestriction,
   createVisitorRestriction
} = require("../controllers/visitorRestrictionController");

/**
 * @swagger
 * tags:
 *   name: VisitorRestriction
 *   description: Routes for managing visitor restrictions
 */

/**
 * @swagger
 * /api/v1/visitorRestriction:
 *   get:
 *     summary: Get all visitor restrictions
 *     tags: [VisitorRestriction]
 *     responses:
 *       200:
 *         description: List of visitor restrictions
 */
router.get('/', getVisitorRestriction);

/**
 * @swagger
 * /api/v1/visitorRestriction:
 *   post:
 *     summary: Create a new visitor restriction
 *     tags: [VisitorRestriction]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - visitorId
 *               - restrictionReason
 *             properties:
 *               visitorId:
 *                 type: integer
 *               restrictionReason:
 *                 type: string
 *     responses:
 *       201:
 *         description: Visitor restriction created
 */
router.post('/', createVisitorRestriction);

module.exports = router;
