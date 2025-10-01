const express = require('express');
const {
    getPermission,
    getPermissionById,
    createPermission,
    updatePermission,
    deletePermission,
} = require("../controllers/permissionController");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Permission
 *   description: Manage permissions
 */

/**
 * @swagger
 * /api/v1/permission:
 *   get:
 *     summary: Get all permissions
 *     tags: [Permission]
 *     responses:
 *       200:
 *         description: List of permissions
 */
router.get('/', getPermission);

/**
 * @swagger
 * /api/v1/permission/{permission_id}:
 *   get:
 *     summary: Get a permission by ID
 *     tags: [Permission]
 *     parameters:
 *       - in: path
 *         name: permission_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Permission ID
 *     responses:
 *       200:
 *         description: Permission details
 */
router.get('/:permission_id', getPermissionById);

/**
 * @swagger
 * /api/v1/permission:
 *   post:
 *     summary: Create a new permission
 *     tags: [Permission]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - permission_name
 *             properties:
 *               permission_name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Permission created successfully
 */
router.post('/', createPermission);

/**
 * @swagger
 * /api/v1/permission/{permission_id}:
 *   put:
 *     summary: Update a permission
 *     tags: [Permission]
 *     parameters:
 *       - in: path
 *         name: permission_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Permission ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               permission_name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Permission updated successfully
 */
router.put('/:permission_id', updatePermission);

/**
 * @swagger
 * /api/v1/permission/{permission_id}:
 *   delete:
 *     summary: Delete a permission
 *     tags: [Permission]
 *     parameters:
 *       - in: path
 *         name: permission_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Permission ID
 *     responses:
 *       200:
 *         description: Permission deleted successfully
 */
router.delete('/:permission_id', deletePermission);

module.exports = router;
