const express = require('express');
const router = express.Router();
const {
    getDepartment,
    getDepartmentById,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    exportAllDepartments,
    generateDepartmentIdHandler,
    getUsersForDepartment
} = require("../controllers/departmentController");

/**
 * @swagger
 * tags:
 *   name: Departments
 *   description: API endpoints for managing departments
 */

/**
 * @swagger
 * /api/v1/department/exportAllDepartments:
 *   get:
 *     summary: Export all departments
 *     tags: [Departments]
 *     responses:
 *       200:
 *         description: CSV or JSON of all departments
 */
router.get('/exportAllDepartments', exportAllDepartments);

/**
 * @swagger
 * /api/v1/department:
 *   get:
 *     summary: Get all departments
 *     tags: [Departments]
 *     responses:
 *       200:
 *         description: List of departments
 */
router.get('', getDepartment);

/**
 * @swagger
 * /api/v1/department/generate-department-id:
 *   get:
 *     summary: Generate a new department ID
 *     tags: [Departments]
 *     responses:
 *       200:
 *         description: Generated department ID
 */
router.get('/generate-department-id', generateDepartmentIdHandler);

/**
 * @swagger
 * /api/v1/department/{department_id}/users:
 *   get:
 *     summary: Get all users for a specific department
 *     tags: [Departments]
 *     parameters:
 *       - in: path
 *         name: department_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Department ID
 *     responses:
 *       200:
 *         description: List of users for the department
 */
router.get('/:department_id/users', getUsersForDepartment);

/**
 * @swagger
 * /api/v1/department/{department_id}:
 *   get:
 *     summary: Get department by ID
 *     tags: [Departments]
 *     parameters:
 *       - in: path
 *         name: department_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Department ID
 *     responses:
 *       200:
 *         description: Department data
 */
router.get('/:department_id', getDepartmentById);

/**
 * @swagger
 * /api/v1/department:
 *   post:
 *     summary: Create a new department
 *     tags: [Departments]
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
 *                 description: Name of the department
 *     responses:
 *       201:
 *         description: Department created successfully
 */
router.post('/', createDepartment);

/**
 * @swagger
 * /api/v1/department/{department_id}:
 *   put:
 *     summary: Update an existing department
 *     tags: [Departments]
 *     parameters:
 *       - in: path
 *         name: department_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Department ID
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
 *         description: Department updated successfully
 */
router.put('/:department_id', updateDepartment);

/**
 * @swagger
 * /api/v1/department/{department_id}:
 *   delete:
 *     summary: Delete a department
 *     tags: [Departments]
 *     parameters:
 *       - in: path
 *         name: department_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Department ID
 *     responses:
 *       200:
 *         description: Department deleted successfully
 */
router.delete('/:department_id', deleteDepartment);

module.exports = router;
