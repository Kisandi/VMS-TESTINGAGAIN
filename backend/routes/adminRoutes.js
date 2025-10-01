const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const dayjs = require('dayjs');

const { Visitor, Appointment, CheckinCheckout } = require('../models');

/**
 * @swagger
 * /api/v1/admin/dashboard-stats:
 *   get:
 *     summary: Get dashboard statistics
 *     description: Fetches summary statistics for admin dashboard including registered visitors, blacklisted visitors, today's approved appointments, and currently checked-in visitors.
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Dashboard statistics successfully retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     registeredVisitors:
 *                       type: integer
 *                       description: Total registered visitors
 *                     blacklistedVisitors:
 *                       type: integer
 *                       description: Total blacklisted visitors
 *                     approvedAppointmentsToday:
 *                       type: integer
 *                       description: Total approved appointments for today
 *                     checkedInVisitors:
 *                       type: integer
 *                       description: Total currently checked-in visitors
 *       500:
 *         description: Failed to fetch dashboard stats
 */
router.get('/dashboard-stats', async (req, res) => {
    try {
        const todayStart = dayjs().startOf('day').toDate();
        const todayEnd = dayjs().endOf('day').toDate();

        const registeredVisitors = await Visitor.count();
        const blacklistedVisitors = await Visitor.count({
            where: { blacklist_status: 'yes' }
        });
        const approvedAppointmentsToday = await Appointment.count({
            where: {
                approval_status: 'approved',
                requested_date_time: { [Op.between]: [todayStart, todayEnd] }
            }
        });
        const checkedInVisitors = await CheckinCheckout.count({
            where: { checkout_time: null }
        });

        res.json({
            success: true,
            data: {
                registeredVisitors,
                blacklistedVisitors,
                approvedAppointmentsToday,
                checkedInVisitors
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats' });
    }
});

module.exports = router;
