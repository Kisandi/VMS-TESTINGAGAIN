const { Op } = require('sequelize');
const dayjs = require('dayjs');
const {
    CheckinCheckout,
    Visitor,
    Appointment,
    RFIDToken,
    Department,
    User,
    Location,
    Access
} = require('../models');

// Get visitors (current, upcoming, past) by logged-in host
const getVisitorsByHost = async (req, res) => {
    try {
        const hostId = req.params.user_id;
        const { type } = req.query;

        if (!['current', 'upcoming', 'past'].includes(type)) {
            return res.status(400).json({ success: false, message: 'Invalid type' });
        }

        let visitors = [];

        if (type === 'upcoming') {
            const todayStart = dayjs().startOf('day').toDate();
            const todayEnd = dayjs().endOf('day').toDate();

            visitors = await Appointment.findAll({
                where: {
                    user_id: hostId,
                    approval_status: 'approved',
                    requested_date_time: {
                        [Op.between]: [todayStart, todayEnd],
                    },
                },
                attributes: [
                    'appointment_id',
                    'purpose',
                    'requested_date_time',
                    'duration',
                    'visitor_id',
                    'department_id'
                ],
                include: [
                    { model: Visitor , as: 'Visitor' },
                    { model: Department,
                        as: 'Department'
                    },
                    {
                        model: CheckinCheckout,
                        as: 'checkinCheckout',
                        required: true,
                        where: {
                            checkin_time: null,
                            checkout_time: null
                        }
                    }
                ]
            });
        }

        if (type === 'current') {
            visitors = await CheckinCheckout.findAll({
                where: { checkout_time: null },
                attributes: [
                    'checkin_id',
                    'token_id',
                    'checkin_time',
                    'checkout_time',
                    'manually_ended',
                ],
                include: [
                    { model: Visitor, as: 'Visitor' },
                    {
                        model: Appointment,
                        as: 'appointment',
                        where: { user_id: hostId },
                        include: [
                            { model: Department, as: 'Department' },
                            { model: User , as: 'user' },
                            { model: Location , as: 'Location'}
                        ]
                    },
                    {
                        model: RFIDToken,
                        as: 'rfid_token',
                        include: [
                            {
                                model: Appointment,
                                as: 'appointment',
                                where: { user_id: hostId },
                                include: [User]
                            }
                        ]
                    },
                    {
                        model: Access,
                        as: 'accesses',
                        where: { status: 'allowed' },
                        include: [{ model: Location, as: 'location', attributes: ['location_id','location'] }],
                        separate: true,
                        limit: 1,
                        order: [['createdAt', 'DESC']]
                    }
                ]
            });
        }

        if (type === 'past') {
            visitors = await CheckinCheckout.findAll({
                where: { checkout_time: { [Op.ne]: null } },
                attributes: [
                    'checkin_id',
                    'token_id',
                    'checkin_time',
                    'checkout_time',
                    'manually_ended',

                ],
                include: [
                    { model: Visitor },
                    {
                        model: Appointment,
                        as: 'appointment',
                        where: { user_id: hostId },
                        include: [
                            { model: Department, as: 'Department' },
                            { model: User },
                            { model: Location , as: 'Location'}
                        ]
                    }
                ],
                order: [['checkout_time', 'DESC']]
            });
        }

        res.status(200).json({
            success: true,
            message: `${type} visitors for host fetched successfully`,
            data: visitors
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Error fetching host visitors',
            error: err.message
        });
    }
};

module.exports = { getVisitorsByHost };
