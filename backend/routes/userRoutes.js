const express = require('express');
const router = express.Router();
const {
    getUser, getUserById, createUser, updateUser, deleteUser, loginUser,
    exportAllHosts, generatuserIdHandler, getHosts, getPositionsByUserType
} = require("../controllers/userController");

const { verifyToken } = require('./authRoutes');
const { loginLimiter } = require('../utils/rateLimiter');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Routes for managing users
 */

/**
 * @swagger
 * /api/v1/user/login:
 *   post:
 *     summary: Login a user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post('/login', loginLimiter, loginUser);

/**
 * @swagger
 * /api/v1/user/exportAllHosts:
 *   get:
 *     summary: Export all hosts
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of all hosts
 */
router.get('/exportAllHosts', exportAllHosts);

/**
 * @swagger
 * /api/v1/user/adminDashboard:
 *   get:
 *     summary: Access admin dashboard (protected)
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Admin dashboard info
 *       403:
 *         description: Access denied
 */
router.get('/adminDashboard', verifyToken, (req, res) => {
    if (req.user.user_type_id !== 'UTI03') {
        return res.status(403).json({ success: false, message: 'Access denied. Please contact administrator.' });
    }
    res.json({ success: true, message: 'Welcome to Admin Dashboard', user: req.user });
});

/**
 * @swagger
 * /api/v1/user/user-positions:
 *   get:
 *     summary: Get positions by user type
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of positions
 */
router.get('/user-positions', getPositionsByUserType);

/**
 * @swagger
 * /api/v1/user/hosts:
 *   get:
 *     summary: Get all hosts
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of hosts
 */
router.get('/hosts', getHosts);

/**
 * @swagger
 * /api/v1/user:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of users
 */
router.get('/', getUser);

/**
 * @swagger
 * /api/v1/user/generate-user-id:
 *   get:
 *     summary: Generate a new user ID
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Generated user ID
 */
router.get('/generate-user-id', generatuserIdHandler);

/**
 * @swagger
 * /api/v1/user/{user_id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User details
 */
router.get('/:user_id', getUserById);

/**
 * @swagger
 * /api/v1/user:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created
 */
router.post('/', createUser);

/**
 * @swagger
 * /api/v1/user/{user_id}:
 *   put:
 *     summary: Update a user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: user_id
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
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated
 */
router.put('/:user_id', updateUser);

/**
 * @swagger
 * /api/v1/user/{user_id}:
 *   delete:
 *     summary: Delete a user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted
 */
router.delete('/:user_id', deleteUser);

module.exports = router;
