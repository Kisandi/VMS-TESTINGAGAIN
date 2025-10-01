const { Visitor, Blacklist } = require('../models');
const { Op } = require('sequelize');

// GET all blacklisted visitors with search, pagination & reason/date
const getBlacklistedVisitors = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const offset = (page - 1) * limit;

        const whereClause = {
            blacklist_status: 'yes',
            [Op.or]: [
                { first_name: { [Op.like]: `%${search}%` } },
                { last_name: { [Op.like]: `%${search}%` } },
                { nic: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } },
                { contact_number: { [Op.like]: `%${search}%` } }
            ]
        };

        const { count, rows } = await Visitor.findAndCountAll({
            where: whereClause,
            attributes: [
                'visitor_id',
                'first_name',
                'last_name',
                'nic',
                'email',
                'contact_number',
                'blacklist_status'
            ],
            include: [
                {
                    model: Blacklist,
                    attributes: ['blocked_at', 'reason', 'blocked_by_user_id'],
                    required: false
                }
            ],
            order: [['first_name', 'ASC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        const formattedVisitors = rows.map(v => ({
            visitor_id: v.visitor_id,
            fullName: `${v.first_name} ${v.last_name}`.trim(),
            nic: v.nic,
            email: v.email,
            contact: v.contact_number,
            blacklist_status: v.blacklist_status,
            blocked_at: v.Blacklist?.blocked_at || null,
            reason: v.Blacklist?.reason || null,
            blocked_by_user_id: v.Blacklist?.blocked_by_user_id || null
        }));

        res.status(200).json({
            success: true,
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalRecords: count,
            visitors: formattedVisitors
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Error fetching blacklisted visitors',
            error: err.message
        });
    }
};

// PATCH toggle blacklist status
const toggleBlacklist = async (req, res) => {
    try {
        const visitorId = req.params.visitor_id;
        const { blacklist_status, reason } = req.body;

        if (!visitorId || !['yes', 'no'].includes(blacklist_status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid visitor ID or blacklist status'
            });
        }

        const visitor = await Visitor.findByPk(visitorId);
        if (!visitor) {
            return res.status(404).json({
                success: false,
                message: 'Visitor not found'
            });
        }

        visitor.blacklist_status = blacklist_status;
        await visitor.save();

        if (blacklist_status === 'yes') {
            // Create or update blacklist record
            await Blacklist.upsert({
                visitor_id: visitorId,
                blocked_at: new Date(),
                blocked_by_user_id: req.user?.user_id || null,
                reason: reason || 'Blocked by admin'
            });
        } else {
            // Remove from blacklist table
            await Blacklist.destroy({ where: { visitor_id: visitorId } });
        }

        res.status(200).json({
            success: true,
            message: `Visitor ${blacklist_status === 'yes' ? 'blacklisted' : 'unblocked'} successfully`,
            visitor
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Error updating blacklist status',
            error: err.message
        });
    }
};

module.exports = {
    getBlacklistedVisitors,
    toggleBlacklist
};
