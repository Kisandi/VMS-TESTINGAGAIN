const { Op, literal } = require('sequelize');
const dayjs = require('dayjs');
const {
    CheckinCheckout,
    Visitor,
    Appointment,
    RFIDToken,
    Department ,
    User,
    Notification,
    UserNotification,
    UserType,
    Location
} = require('../models');


// Get all currently checked-in visitors (no checkout_time)
// Used in Receptionist Dashboard -> Visitors -> Current Visitors
const getCurrentVisitors = async (req, res) => {
    try {
        const data = await CheckinCheckout.findAll({
            where: {
                [Op.or]: [
      { checkout_time: null },
      { checkout_time: "" }
    ]
            },
            include: [
                {
                    model: Visitor,
                    attributes: ['visitor_id', 'first_name', 'last_name', 'nic']
                },
                {
                    model: Appointment,  // Include Appointment directly
                    as: 'appointment',   // Use the alias if you defined one in your associations
                    include: [
                        { model: Department,
                            as: 'Department',
                            attributes: ['department_id', 'department_name']
                        },
                        { model: User,
                        as:'user',
                            attributes: ['user_id', 'first_name', 'last_name']
                        } // Host
                    ]
                },
                {
                    model: RFIDToken,
                    as: 'rfid_token',
                    include: [
                        {
                            model: Visitor,
                            attributes: ['visitor_id', 'first_name']
                        },
                        {
                            model: Appointment,
                            as: 'appointment',
                            include: [
                                { model: Department,
                                    as: 'Department',
                                    attributes: ['department_id', 'department_name']
                                },
                                { model: User ,
                                    as: 'user',
                                    attributes: ['user_id', 'first_name', 'last_name']
                                }, // Host
                            ]
                        }
                    ]
                }
            ],
            order: [['checkin_time', 'DESC']]
        });

        res.status(200).json({
            success: true,
            message: 'Currently checked-in visitors fetched successfully',
            data,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Error fetching current visitors',
            error: err.message
        });
    }
};



// UPCOMING VISITORS
const getUpcomingVisitors = async (req, res) => {
    try {
        const todayStart = dayjs().startOf('day').toDate();
        const todayEnd = dayjs().endOf('day').toDate();

        console.log('todayStart', todayStart);
        console.log('todayEnd', todayEnd);


        const data = await Appointment.findAll({
            where: {
                approval_status: 'approved',
                requested_date_time: {
                    [Op.between]: [todayStart, todayEnd],
                }
            },
            include: [
                { model: Visitor, attributes: ['first_name', 'last_name', 'nic'] },
                { model: User, as: 'user',attributes: ['first_name', 'last_name'] },
                { model: Department, as: 'Department', attributes: ['department_name'] },
                {
                    model: CheckinCheckout,
                    as: 'checkinCheckout',
                    required: false,  // LEFT JOIN so we include appointments with no checkin record
                    where: {
                        checkin_time: null,
                        checkout_time: null,
                    },
                    attributes: []
                }
            ],
            having: literal('COUNT(`checkinCheckout`.`checkin_id`) > 0'), // Has at least one matching record with null times
            group: ['Appointment.appointment_id'],
            order: [['requested_date_time', 'ASC']],
        });
        console.log('record', data.map(d => d.requested_date_time));
        if (!data.length) {
            return res.status(404).json({ success: false, message: 'No upcoming visitors found for today' });
        }
        console.log("Fetched appointments:", JSON.stringify(data, null, 2));

        res.status(200).json({
            success: true,
            message: 'Upcoming visitors fetched successfully',
            data,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error fetching upcoming visitors', err });
    }
};

// PAST VISITORS
// USED IN VISITOR'S PAST VISITS TAB
// USED IN RECEPTIONIST'S PAST VISITS TAB
const getPastVisitors = async (req, res) => {
    try {
        const { visitor_id, search = '', page = 1, limit = 10 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        const whereClause = {
            checkout_time: { [Op.not]: null }
        };

        if (visitor_id) {
            whereClause.visitor_id = visitor_id;
        }

        const result = await CheckinCheckout.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: Appointment,
                    as: 'appointment',
                    attributes: ['purpose', 'duration', 'requested_date_time', 'end_time', 'comment', 'user_id',  'department_id'],
                    include: [
                        {
                            model: Department,
                            as: 'Department',
                            attributes: ['department_id','department_name']
                        },
                        {
                            model: User,
                            attributes: ['user_id','first_name', 'last_name', 'position', 'email'],
                        },
                        {
                            model: Location,
                            attributes: ['location_id','location']
                        }
                    ]
                },
                {
                    model: Visitor,
                    attributes: ['first_name', 'last_name']
                }
            ],
            offset,
            limit: parseInt(limit),
            order: [['checkout_time', 'DESC']],
            distinct: true
        });

        const filtered = result.rows.filter(record => {
            const appointment = record.Appointment;
            const user = appointment?.User;
            const department = appointment?.Department;

            const hostName = `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.toLowerCase();
            const departmentName = `${department?.department_name ?? ''}`.toLowerCase();
            const purpose = `${appointment?.purpose ?? ''}`.toLowerCase();

            return (
                hostName.includes(search.toLowerCase()) ||
                departmentName.includes(search.toLowerCase()) ||
                purpose.includes(search.toLowerCase())
            );
        });

        res.status(200).json({
            success: true,
            message: 'Past visitors fetched successfully',
            totalRecords: result.count,
            data: filtered
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Error fetching past visitors',
            error: err.message
        });
    }
};

const checkInByRFID = async (req, res) => {
    try {
        const token = await RFIDToken.findOne({ where: { token_id: req.body.rfid } });
        if (!token) return res.status(404).json({ success: false, message: 'RFID not recognized' });

        const appointment = await Appointment.findByPk(token.appointment_id);
        const visitor = await Visitor.findByPk(token.visitor_id);
        if (!appointment || appointment.approval_status !== 'approved') {
            return res.status(403).json({ success: false, message: 'No valid appointment' });
        }

        // Create checkin record
        await CheckinCheckout.create({
            visitor_id: visitor.id,
            appointment_id: appointment.id,
            checkin_time: new Date(),
            checkout_time: null
        });

        // Notify host
        const notificationHost = await Notification.create({
            message: `Your visitor ${visitor.first_name} checked in.`,
            created_at: new Date(),
        });
        await UserNotification.create({ user_id: appointment.host_id, notification_id: notificationHost.id, read: false });

        // Notify admin and receptionist
        const staff = await User.findAll({
            include: [{ model: UserType, where: { name: ['admin', 'receptionist'] } }],
        });
        for (const user of staff) {
            const notify = await Notification.create({
                message: `Visitor ${visitor.first_name} checked in.`,
                created_at: new Date(),
            });
            await UserNotification.create({ user_id: user.id, notification_id: notify.id, read: false });
        }

        res.status(200).json({ success: true, message: 'Check-in successful' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error during check-in', error: err.message });
    }
};

const checkOutByRFID = async (req, res) => {
    try {
        const { rfid } = req.body;
        if (!rfid) {
            return res.status(400).json({ success: false, message: 'RFID is required' });
        }
        const token = await RFIDToken.findOne({ where: { token_id: rfid } });
        if (!token) return res.status(404).json({ success: false, message: 'Invalid RFID' });

        //const visitor = await Visitor.findByPk(token.visitor_id);

        const checkin = await CheckinCheckout.findOne({
            where: {
                token_id: rfid,
                checkout_time: null,
            },
            order: [['checkin_time', 'DESC']],
        });

        if (!checkin) return res.status(404).json({ success: false, message: 'No active check-in found' });

        const now = new Date();
        checkin.checkout_time = now;
        await checkin.save();
        return res.status(200).json({ success: true, message: 'Check-out successful' });



        // Overstay check
        const appointment = await Appointment.findByPk(token.appointment_id);

        let durationMinutes = 0;
        const hMatch = appointment.duration.match(/(\d+)h/);
        const mMatch = appointment.duration.match(/(\d+)m/);
        if (hMatch) durationMinutes += parseInt(hMatch[1]) * 60;
        if (mMatch) durationMinutes += parseInt(mMatch[1]);

        const expectedCheckout = dayjs(checkin.checkin_time).add(durationMinutes, 'minute');
        if (dayjs(now).isAfter(expectedCheckout)) {
            const notifyOverstay = await Notification.create({
                message: `Visitor ${visitor.first_name} overstayed.`,
                created_at: new Date(),
            });
            await UserNotification.create({ user_id: appointment.host_id, notification_id: notifyOverstay.id, read: false });
        }

        // Notify admin and receptionist of checkout
        // const staff = await User.findAll({
        //     include: [{ model: UserType, where: { name: ['admin', 'receptionist'] } }],
        // });
        // for (const user of staff) {
        //     const notify = await Notification.create({
        //         message: `Visitor ${visitor.first_name} checked out.`,
        //         created_at: new Date(),
        //     });
        //     await UserNotification.create({ user_id: user.id, notification_id: notify.id, read: false });
        //     }
        //
        //     res.status(200).json({ success: true, message: 'Check-out successful' });
            } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error during check-out', error: err.message });
            }
};

const getCheckInOut = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const data = await CheckinCheckout.findAndCountAll({
            offset,
            limit,
            order: [['checkin_id', 'ASC']],
            include: [
                {
                    model: Appointment,
                    as: 'appointment', // use the alias if defined in associations
                    attributes: ['comment', 'purpose', 'requested_date_time'],
                    include: [
                        {
                            model: User,
                            as: 'user', // use the alias if defined in associations
                            attributes: ['user_id', 'first_name', 'last_name']
                        }
                    ]
                }
            ]
        });

        if (!data) {
            return res.status(404).send({
                success: false,
                message: 'No such checkin'
            });
        }

        res.status(200).send({
            success: true,
            message: 'Checkin fetched successfully',
            totalCheckin: data.count,
            data: data.rows
        });
    } catch (err) {
        console.log(err);
        res.status(500).send({
            success: false,
            message: 'Error getting checkin',
            err
        });
    }
};



// GET VISITOR BY ID
const getCheckInOutById = async (req, res) => {
    try {
        const checkinId = req.params.checkin_id;
        // console.log("Visitor ID from params:", visitorId);
        if (!checkinId){
            return res.status(404).send({
                success: false,
                message: 'No such checkin'
            });
        }

        // const data = await db.query(' SELECT * FROM visitor WHERE id ='+visitorId)

     //   const data = await db.query('SELECT * FROM checkin_checkout WHERE checkin_id=?', [checkinId]);

        const data = await CheckinCheckout.findAll({
            where: {checkin_id: checkinId}
        });


        console.log("Query result:", data);
        if (!data || data.length === 0){
            return res.status(404).send({
                success: false,
                message: 'No such checkin'
            });
        }
        res.status(200).send({
            success: true,
            message: 'checkin successfully',
            data: data[0],
        });
    }catch (err){
        console.log(err)
        res.status(500).send({
            success: false,
            message: 'Error getting checkin by id',
        });
    }
};

// controllers/checkInOutController.js
const endMeetingManually = async (req, res) => {
    const { tokenId } = req.body;

    try {
        const checkin = await CheckinCheckout.findOne({
            where: {
                token_id: tokenId,
                checkout_time: null
            }
        });

        if (!checkin) {
            return res.status(404).json({ success: false, message: 'Check-in not found or already ended.' });
        }

        checkin.manually_ended = true;
        await checkin.save();

        res.status(200).json({ success: true, message: 'Meeting marked as ended manually.' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Internal error.' });
    }
};

const extendStay = async (req, res) => {
    try {
        const { tokenId, additionalMinutes } = req.body;

        if (!tokenId || !additionalMinutes) {
            return res.status(400).json({ success: false, message: "tokenId and additionalMinutes are required" });
        }

        // 1. Find RFID token
        const token = await RFIDToken.findOne({ where: { token_id: tokenId } });
        if (!token) {
            return res.status(404).json({ success: false, message: "Token not found" });
        }

        // 2. Find active check-in linked to this token
        const checkin = await CheckinCheckout.findOne({
            where: {
                token_id: tokenId,
                checkout_time: null // means still inside
            }
        });

        if (!checkin) {
            return res.status(404).json({ success: false, message: "Active check-in not found" });
        }

        // 3. Calculate new checkout time
        const currentEndTime = checkin.expected_checkout_time || new Date();
        const newEndTime = new Date(currentEndTime.getTime() + additionalMinutes * 60000);

        // 4. Save to DB
        checkin.expected_checkout_time = newEndTime;
        await checkin.save();

        return res.json({
            success: true,
            message: "Stay extended successfully",
            newEndTime
        });
    } catch (err) {
        console.error("Extend stay error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

// CREATE DEPARTMENT
const createCheckInOut = async (req, res) => {
    try{
        const {checkin_id, checkin_time, checkout_time} = req.body
        if(!checkin_id || !checkin_time || !checkout_time){
            return res.status(500).send({
                success: false,
                message: 'Missing required fields: checkin_id, checkin_time, or checkout_time',
            })
        }

       // const data = await db.query('INSERT INTO checkin_checkout (checkin_id, checkin_time, checkout_time, token_id, visitor_id ) VALUES (?, ?, ?, ?, ?)',[checkin_id, checkin_time, checkout_time, token_id, visitor_id ])

        const data = await CheckinCheckout.create({
            checkin_id,
            checkin_time,
            checkout_time,
        })


        if (!data){
            return res.status(400).send({
                success: false,
                message: 'Error creating checkin',
            })
        }
        res.status(201).send({
            success: true,
            message: 'Checkin successfully',
        })
    }catch (err){
        console.log(err)
        res.status(500).send({
            success: false,
            message: 'Error creating checkin',
            err
        })
    }
}



// UPDATE DEPARTMENT
const updateCheckInOut = async (req, res) => {
    try{
        const checkinId = req.params.checkin_id;
        if(!checkinId){
            return res.status(404).send({
                success: false,
                message: 'No such checkin'
            })
        }
        const {checkin_time, checkout_time} = req.body


        const data = await CheckinCheckout.update(
            {checkin_time, checkout_time},
            {
                where: {
                    checkin_id: checkinId,
                }
            }
        )

        if (!data){
            return res.status(500).send({
                success: false,
                message: 'Error updating checkin',
            })
        }
        res.status(200).send({
            success: true,
            message: 'Checkin successfully',
        })
    }catch(err){
        console.log(err)
        res.status(500).send({
            success: false,
            message: 'Error updating checkin',
            err
        })
    }
}


// DELETE DEPARTMENT
const deleteCheckInOut= async (req, res) => {
    try{
        const checkinId = req.params.checkin_id;
        if(!checkinId){
            return res.status(400).send({
                success: false,
                message: 'No such checkin'
            })
        }
      //  await db.query('DELETE FROM checkin_checkout WHERE check_in=?', [checkinId])

        await CheckinCheckout.destroy({
            where: {
                checkin_id: checkinId,
            }
        })

        res.status(200).send({
            success: true,
            message: 'checkin successfully',
        })
    }catch (err){
        console.log(err)
        res.status(500).send({
            success: false,
            message: 'Error deleting checkin',
            err
        })
    }
}

module.exports = {getCheckInOut, getCheckInOutById, createCheckInOut, updateCheckInOut, deleteCheckInOut  , getCurrentVisitors, getUpcomingVisitors, getPastVisitors, checkInByRFID, checkOutByRFID, endMeetingManually, extendStay};