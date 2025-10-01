const express = require('express');
const router = express.Router();
const {
    getUserTypes,
    getUserTypeById,
    createUserType,
    updateUserType,
    deleteUserType
} = require("../controllers/userTypeController");

/**
 * @swagger
 * tags:
 *   name: UserTypes
 *   description: Routes for managing user types
 */

/**
 * @swagger
 * /api/v1/userTypes:
 *   get:
 *     summary: Get all user types
 *     tags: [UserTypes]
 *     responses:
 *       200:
 *         description: List of user types
 */
router.get('/', getUserTypes);

/**
 * @swagger
 * /api/v1/userTypes/{user_type_id}:
 *   get:
 *     summary: Get user type by ID
 *     tags: [UserTypes]
 *     parameters:
 *       - in: path
 *         name: user_type_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User type details
 */
router.get('/:user_type_id', getUserTypeById);

/**
 * @swagger
 * /api/v1/userTypes:
 *   post:
 *     summary: Create a new user type
 *     tags: [UserTypes]
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
 *         description: User type created
 */
router.post('/', createUserType);

/**
 * @swagger
 * /api/v1/userTypes/{user_type_id}:
 *   put:
 *     summary: Update a user type
 *     tags: [UserTypes]
 *     parameters:
 *       - in: path
 *         name: user_type_id
 *         required: true
 *         schema:
 *           type: string
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
 *         description: User type updated
 */
router.put('/:user_type_id', updateUserType);

/**
 * @swagger
 * /api/v1/userTypes/{user_type_id}:
 *   delete:
 *     summary: Delete a user type
 *     tags: [UserTypes]
 *     parameters:
 *       - in: path
 *         name: user_type_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User type deleted
 */
router.delete('/:user_type_id', deleteUserType);

module.exports = router;
