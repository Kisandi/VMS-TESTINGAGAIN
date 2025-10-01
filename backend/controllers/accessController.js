const { RFIDToken, Location, Appointment, PermissionHasUser, Access, RestrictedAccessAttempt, VisitorRestriction } = require('../models');
const { v4: uuidv4 } = require('uuid');

const accessLocation = async (req, res) => {
    try {
        const { rfid, location_id } = req.body;

        if (!rfid || !location_id) {
            return res.status(400).json({ success: false, message: "rfid and location_id required" });
        }

        const token = await RFIDToken.findOne({ where: { token_id: rfid, status: 'active' } });
        if (!token) {
            return res.status(404).json({ success: false, message: "RFID not recognized or inactive" });
        }

        const location = await Location.findOne({ where: { location_id } });
        if (!location) {
            return res.status(404).json({ success: false, message: "Location not found" });
        }

        let accessStatus = 'restricted';
        let message = '';

        if (location.is_public) {
            accessStatus = 'allowed';
            message = 'Access granted: public location';
        } else {
            const appointment = await Appointment.findOne({
                where: {
                    appointment_id: token.appointment_id,
                    approval_status: 'approved',
                }
            });

            if (appointment && appointment.location_id === location_id) {
                accessStatus = 'allowed';
                message = 'Access granted: appointment location';
            } else {
                // optionally check PermissionHasUser here if you want host-specific permissions
                const hasPermission = await PermissionHasUser.findOne({
                    where: {
                        user_id: token.user_id,
                        location_id
                    }
                });

                if (hasPermission) {
                    accessStatus = 'allowed';
                    message = 'Access granted: host has permission';
                } else {
                    message = 'Access denied and logged';
                }
            }
        }

        // Always log to access_log
        await Access.create({
            visitor_id: token.visitor_id,
            token_id: token.token_id,
            location_id: location.location_id,
            status: accessStatus
        });

        // If restricted, also log to restricted_attempt + visitor_restriction
        if (accessStatus === 'restricted') {
            const attempt_id = uuidv4();
            const timestamp = new Date();

            await RestrictedAccessAttempt.create({
                attempt_id,
                timestamp,
                access_point: location.location,
                status: "denied",
            });

            await VisitorRestriction.create({
                token_id: rfid,
                restricted_attempt_id: attempt_id,
                visitor_id: token.visitor_id,
            });

            return res.status(403).json({ success: false, message });
        }

        return res.status(200).json({ success: true, message });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

const getAccessLogs = async (req, res) => {
    try {
        const accessLogs = await Access.findAll({
            include: [{
                model: Location,
                as: 'location',
                attributes: ['location'], // only fetch location_name
            }],
            order: [['createdAt', 'DESC']], // optional ordering
        });

        // Format to send location_name on top level if you want
        const formatted = accessLogs.map(log => ({
            access_log_id: log.access_log_id,
            visitor_id: log.visitor_id,
            token_id: log.token_id,
            location_id: log.location_id,
            location_name: log.location ? log.location.location : null,
            status: log.status,
            createdAt: log.createdAt,
            updatedAt: log.updatedAt,
        }));
        res.json({ success: true, data: formatted });

    } catch (err) {
        console.error('Access Log Fetch Error:', err);
        res.status(500).json({ error: 'Failed to fetch access logs' });
    }
};


module.exports = { getAccessLogs,accessLocation };
