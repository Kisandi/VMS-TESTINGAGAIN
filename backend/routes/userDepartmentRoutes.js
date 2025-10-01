const express = require('express');
const router = express.Router();
const { getAllUserDepartments } = require('../controllers/userDepartmentController');

/**
 * @swagger
 * tags:
 *   name: UserDepartments
 *   description: Routes for managing user-department relations
 */

/**
 * @swagger
 * /api/v1/user-department:
 *   get:
 *     summary: Get all user-department relations
 *     tags: [UserDepartments]
 *     responses:
 *       200:
 *         description: List of user-department relations
 */
router.get('/', getAllUserDepartments);

module.exports = router;
