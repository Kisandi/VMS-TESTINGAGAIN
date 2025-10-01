const express = require('express');
const router = express.Router();
const {
    getLocation,
    getLocationById,
    createLocation,
    updateLocation,
    deleteLocation,
    accessLocation,
    getAvailableLocations
} = require("../controllers/locationController");

/**
 * @swagger
 * tags:
 *   name: Locations
 *   description: API endpoints for managing locations
 */

/**
 * @swagger
 * /api/v1/location/available:
 *   get:
 *     summary: Get all available locations
 *     tags: [Locations]
 *     responses:
 *       200:
 *         description: List of available locations
 */
router.get('/available', getAvailableLocations);

/**
 * @swagger
 * /api/v1/location/access-location:
 *   post:
 *     summary: Record an access attempt for a location
 *     tags: [Locations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - visitorId
 *               - locationId
 *             properties:
 *               visitorId:
 *                 type: integer
 *               locationId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Access attempt recorded
 */
router.post('/access-location', accessLocation);

/**
 * @swagger
 * /api/v1/location:
 *   get:
 *     summary: Get all locations
 *     tags: [Locations]
 *     responses:
 *       200:
 *         description: List of locations
 */
router.get('/', getLocation);

/**
 * @swagger
 * /api/v1/location/{location_id}:
 *   get:
 *     summary: Get a location by ID
 *     tags: [Locations]
 *     parameters:
 *       - in: path
 *         name: location_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Location ID
 *     responses:
 *       200:
 *         description: Location details
 */
router.get('/:location_id', getLocationById);

/**
 * @swagger
 * /api/v1/location:
 *   post:
 *     summary: Create a new location
 *     tags: [Locations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Location created successfully
 */
router.post('/', createLocation);

/**
 * @swagger
 * /api/v1/location/{location_id}:
 *   put:
 *     summary: Update an existing location
 *     tags: [Locations]
 *     parameters:
 *       - in: path
 *         name: location_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Location ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Location updated successfully
 */
router.put('/:location_id', updateLocation);

/**
 * @swagger
 * /api/v1/location/{location_id}:
 *   delete:
 *     summary: Delete a location
 *     tags: [Locations]
 *     parameters:
 *       - in: path
 *         name: location_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Location ID
 *     responses:
 *       200:
 *         description: Location deleted successfully
 */
router.delete('/:location_id', deleteLocation);

module.exports = router;
