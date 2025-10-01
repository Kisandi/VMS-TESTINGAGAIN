const express = require('express');
const router = express.Router();
const {
     getRfid,
     getRfidById,
     createRfid,
     updateRfid,
     deleteRfid
} = require("../controllers/rfidTokenController");

/**
 * @swagger
 * tags:
 *   name: RFID
 *   description: Routes for managing RFID tokens
 */

/**
 * @swagger
 * /api/v1/rfid:
 *   get:
 *     summary: Get all RFID tokens
 *     tags: [RFID]
 *     responses:
 *       200:
 *         description: List of RFID tokens
 */
router.get('/', getRfid);

/**
 * @swagger
 * /api/v1/rfid/{token_id}:
 *   get:
 *     summary: Get RFID token by ID
 *     tags: [RFID]
 *     parameters:
 *       - in: path
 *         name: token_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the RFID token
 *     responses:
 *       200:
 *         description: RFID token data
 */
router.get('/:token_id', getRfidById);

/**
 * @swagger
 * /api/v1/rfid:
 *   post:
 *     summary: Create a new RFID token
 *     tags: [RFID]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - visitorId
 *             properties:
 *               token:
 *                 type: string
 *               visitorId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: RFID token created
 */
router.post('/', createRfid);

/**
 * @swagger
 * /api/v1/rfid/{token_id}:
 *   put:
 *     summary: Update an existing RFID token
 *     tags: [RFID]
 *     parameters:
 *       - in: path
 *         name: token_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the RFID token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *               visitorId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: RFID token updated
 */
router.put('/:token_id', updateRfid);

/**
 * @swagger
 * /api/v1/rfid/{token_id}:
 *   delete:
 *     summary: Delete an RFID token
 *     tags: [RFID]
 *     parameters:
 *       - in: path
 *         name: token_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the RFID token
 *     responses:
 *       200:
 *         description: RFID token deleted
 */
router.delete('/:token_id', deleteRfid);

module.exports = router;
