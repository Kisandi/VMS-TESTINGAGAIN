const express = require('express');
const {
    getPermissionHasUser,
    createPermissionHasUser,
    deletePermissionHasUser,
} = require("../controllers/permissionHasUserController");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: PermissionHasUser
 *   description: Manage user permissions
 */

/**
 * @swagger
 * /api/v1/permissionHasUser:
 *   get:
 *     summary: Get all permission-user assignments
 *     tags: [PermissionHasUser]
 *     responses:
 *       200:
 *         description: List of permission-user assignments
 */
router.get('/', getPermissionHasUser);

/**
 * @swagger
 * /api/v1/permissionHasUser:
 *   post:
 *     summary: Assign a permission to a user
 *     tags: [PermissionHasUser]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - permission_id
 *               - user_id
 *               - department_id
 *             properties:
 *               permission_id:
 *                 type: integer
 *               user_id:
 *                 type: integer
 *               department_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Permission assigned to user successfully
 */
router.post('/', createPermissionHasUser);

/**
 * @swagger
 * /api/v1/permissionHasUser/{permission_id}/{user_id}:
 *   delete:
 *     summary: Remove a permission from a user
 *     tags: [PermissionHasUser]
 *     parameters:
 *       - in: path
 *         name: permission_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Permission ID
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: Permission removed from user successfully
 */
router.delete('/:permission_id/:user_id', deletePermissionHasUser);

module.exports = router;
