const { Op , Sequelize} = require('sequelize');
const { Appointment, Department, Visitor, User, Location} = require('../models');


const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

// Extend with the plugins
dayjs.extend(utc);
dayjs.extend(timezone);



const getAppointment = async (req, res, next) => {
    try {
        const { page = 1, limit = 100, created_at, requested_date_time, visitor_id, search='' } = req.query;

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const where = {};

        if (created_at) where.created_at = created_at;
        if (requested_date_time) where.requested_date_time = requested_date_time;
        if (visitor_id) where.visitor_id = visitor_id;  // <-- Add this line
        if (search) {
            where[Op.or] = [
                { purpose: { [Op.like]: `%${search}%` } },
                { approval_status: { [Op.like]: `%${search}%` } },
                { '$User.first_name$': { [Op.like]: `%${search}%` } },
                { '$User.last_name$': { [Op.like]: `%${search}%` } },
                { '$User.position$': { [Op.like]: `%${search}%` } },
                { '$Department.department_name$': { [Op.like]: `%${search}%` } },
            ];
        }
        const { count, rows } = await Appointment.findAndCountAll({
            where,
            include: [
                {
                    model: User,
                    attributes: ['first_name', 'last_name', 'position'],
                    required: false,
                },
                {
                    model: Department,
                    as: 'Department',
                    attributes: ['department_name'],
                    required: false,
                },
                {
                    model: Visitor,  // ✅ Include this
                    attributes: ['first_name', 'last_name', 'visitor_id'],
                    required: true   // Optional, but safer if you're filtering by visitor_id
                }
            ],
            limit: parseInt(limit),
            offset,
            distinct: true, // Ensure distinct results
        });

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No appointments found with the provided filters.'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Appointments retrieved successfully',
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / parseInt(limit)),
            totalRecords: count,
            appointments: rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Error retrieving appointments',
            error: err.message
        });
    }
};

// GET appointments by status for a specific visitor
// Used in request status of visitor
const getAppointmentByStatusForVisitor = async (req, res) => {
    const {
        approval_status,
        visitor_id,
        search = '',
        date = '',
        page = 1,
        limit = 10
    } = req.query;

    const offset = (page - 1) * limit;

    try {
        const whereClause = {};

        if (approval_status && approval_status !== 'all') {
            whereClause.approval_status = approval_status;
             if (approval_status.toLowerCase() === 'pending') {
        whereClause.token_id = null;
    }
        }


        if (visitor_id) {
            whereClause.visitor_id = visitor_id;
        }

        if (date) {
            const formattedDate = dayjs(date).format('YYYY-MM-DD');
            whereClause[Op.and] = [
                Sequelize.where(
                    Sequelize.fn('DATE', Sequelize.col('Appointment.requested_date_time')),
                    formattedDate
                )
            ];
        }

        if (search) {
            if (!whereClause[Op.and]) whereClause[Op.and] = [];
            whereClause[Op.and].push({
                [Op.or]: [
                    { purpose: { [Op.like]: `%${search}%` } },
                    { approval_status: { [Op.like]: `%${search}%` } },
                    { duration: { [Op.like]: `%${search}%` } },
                    { '$Visitor.first_name$': { [Op.like]: `%${search}%` } },
                    { '$Visitor.last_name$': { [Op.like]: `%${search}%` } },
                    { '$Visitor.nic$': { [Op.like]: `%${search}%` } },
                    { '$User.first_name$': { [Op.like]: `%${search}%` } },
                    { '$User.last_name$': { [Op.like]: `%${search}%` } },
                    { '$User.position$': { [Op.like]: `%${search}%` } },
                    { '$Department.department_name$': { [Op.like]: `%${search}%` } },
                    { '$Location.location$': { [Op.like]: `%${search}%` } }
                ]
            });
        }

        const { rows, count } = await Appointment.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: Visitor,
                    attributes: ['visitor_id', 'first_name', 'last_name', 'nic']
                },
                {
                    model: User,
                    attributes: ['user_id', 'first_name', 'last_name', 'position']
                },
                {
                    model: Location,
                    as: 'Location',
                    attributes: ['location_id', 'location'],
                    required: false
                },
                {
                    model: Department,
                    as: 'Department',
                    attributes: ['department_id', 'department_name'],
                    required: false
                }
            ],
            offset: parseInt(offset),
            limit: parseInt(limit),
            distinct: true,
            order: [['requested_date_time', 'DESC']]
        });

        const formatted = rows.map(appt => {
            const dateObj = dayjs(appt.requested_date_time).tz('Asia/Colombo');
            return {
                appointment_id: appt.appointment_id,
                nic: appt.Visitor?.nic || 'N/A',
                full_name: `${appt.Visitor?.first_name || ''} ${appt.Visitor?.last_name || ''}`.trim(),
                visitor_id: appt.Visitor?.visitor_id || null,
                purpose: appt.purpose,
                date: dateObj.format('YYYY-MM-DD'),
                time: dateObj.format('HH:mm'),
                created_at: appt.created_at,
                requested_date_time: appt.requested_date_time,
                duration: appt.duration,
                host: `${appt.User?.first_name || ''} ${appt.User?.last_name || ''}`.trim(),
                host_position: appt.User?.position || 'N/A',
                user_id: appt.User?.user_id || null,
                end_time: appt.end_time,
                approval_status: appt.approval_status,
                comment: appt.comment || '',
                location: appt.Location?.location || 'N/A',
                department: appt.Department?.department_name || 'N/A',
            };
        });

        res.status(200).json({
            success: true,
            message: 'Appointments fetched successfully',
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalRecords: count,
            data: formatted
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};


// Used in Receptionist's Request tab = Pending Requests
const getAppointmentByStatus = async (req, res) => {
    const { approval_status, user_id, search = '', date = '', page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    try {
        const whereClause = {};

        if (approval_status) {
            whereClause.approval_status = approval_status;
           if (approval_status.toLowerCase() === 'pending') {
        whereClause.token_id = null;
    }
        }

        if (user_id) {
            whereClause.user_id = user_id;
        }

        if (date) {
            const formattedDate = dayjs(date).format('YYYY-MM-DD');
            whereClause[Op.and] = [
                Sequelize.where(
                    Sequelize.fn('DATE', Sequelize.col('Appointment.requested_date_time')),
                    formattedDate
                )
            ];
        }

        if (search) {
            if (!whereClause[Op.and]) whereClause[Op.and] = [];
            whereClause[Op.and].push({
                [Op.or]: [
                    { purpose: { [Op.like]: `%${search}%` } },
                    { approval_status: { [Op.like]: `%${search}%` } },
                    { duration: { [Op.like]: `%${search}%` } },
                    { '$Visitor.first_name$': { [Op.like]: `%${search}%` } },
                    { '$Visitor.last_name$': { [Op.like]: `%${search}%` } },
                    { '$Visitor.nic$': { [Op.like]: `%${search}%` } },
                    { '$User.first_name$': { [Op.like]: `%${search}%` } },
                    { '$User.last_name$': { [Op.like]: `%${search}%` } },
                    { '$Department.department_name$': { [Op.like]: `%${search}%` } },
                    { '$Location.location$': { [Op.like]: `%${search}%` } }
                ]
            });
        }

        const { rows, count } = await Appointment.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: Visitor,
                    attributes: ['visitor_id', 'first_name', 'last_name', 'nic']
                },
                {
                    model: User,
                    attributes: ['user_id', 'first_name', 'last_name', 'position']
                },
                {
                    model: Location,
                    as: 'Location',
                    attributes: ['location_id', 'location'],
                    required: false
                },
                {
                    model: Department,
                    as: 'Department',  // Use the correct alias if defined in your associations
                    attributes: ['department_id', 'department_name'],
                    required: false
                }
            ],
            offset: parseInt(offset),
            limit: parseInt(limit),
            distinct: true,
            order: [['requested_date_time', 'DESC']]
        });

        const now = dayjs().tz('Asia/Colombo');

        const updatedAppointments = await Promise.all(
            rows.map(async (appt) => {
                const requestedTime = dayjs(appt.requested_date_time).tz('Asia/Colombo');
                if (appt.approval_status === 'pending' && requestedTime.isBefore(now)) {
                    appt.approval_status = 'declined';
                    appt.comment = 'Requested date and time has passed';
                    await appt.save();
                }
                return appt;
            })
        );

        const formattedData = updatedAppointments.map(appt => {
            const dateObj = dayjs(appt.requested_date_time).tz('Asia/Colombo');
            return {
                appointment_id: appt.appointment_id,
                nic: appt.Visitor?.nic || 'N/A',
                full_name: `${appt.Visitor?.first_name || ''} ${appt.Visitor?.last_name || ''}`.trim(),
                visitor_id: appt.Visitor?.visitor_id || null,
                purpose: appt.purpose,
                date: dateObj.format('YYYY-MM-DD'),
                time: dateObj.format('HH:mm'),
                created_at: appt.created_at,
                requested_date_time: appt.requested_date_time,
                duration: appt.duration,
                host: `${appt.User?.first_name || ''} ${appt.User?.last_name || ''}`.trim(),
                host_position: appt.User?.position || 'N/A',
                user_id: appt.User?.user_id || null,
                approval_status: appt.approval_status,
                comment: appt.comment || '',
                location: appt.Location?.location || 'N/A',
                department: appt.Department?.department_name || 'N/A',
            };
        });

        res.status(200).json({
            success: true,
            message: 'Appointments fetched successfully',
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalRecords: count,
            data: formattedData
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};



// GET VISITOR BY ID
const getAppointmentById = async (req, res, next) => {
    try {
           const appointmentId = await Appointment.findByPk(req.params.appointment_id);
        if (!appointmentId) {
            return res.status(404).json({ success: false, message: "Appointment not found" });
        }
        res.json({ success: true, data: appointmentId });
    } catch (err) {
        next(err);
    }
};

// CREATE DEPARTMENT
const createAppointment = async (req, res, next) => {

    try {
        // Handle missing foreign keys
        const {
            appointment_id,
            created_at,
            requested_date_time,
            purpose,
            end_time,
            duration,
            approval_status,
            department_id,
            visitor_id,
            token_id,
            user_id
        } = req.body;

        // const localTimezone = 'Asia/Colombo';
        //
        // const createdAtUTC = dayjs.tz(created_at, 'Asia/Colombo').utc().toDate();
        // const requestedDateTimeUTC = dayjs.tz(requested_date_time, 'Asia/Colombo').utc().toDate();



        const newAppointment = await Appointment.create({
            appointment_id,
            created_at,
            requested_date_time,
            purpose,
            end_time,
            duration,
            approval_status,
            department_id: department_id || null,  // Set to null if not provided
            visitor_id: visitor_id || null,        // Set to null if not provided
            token_id: token_id || null,            // Set to null if not provided
            user_id: user_id || null               // Set to null if not provided
        });


        res.status(201).json({ success: true, data: newAppointment, message: 'Appointment created successfully' });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Error creating appointment',
            error: err.message
        });
    }

}

// UPDATE DEPARTMENT
const updateAppointment = async (req, res, next) => {

    try{
    const updated = await Appointment.update(req.body, {
        where: { appointment_id: req.params.appointment_id }
    });

    if (updated[0] === 0) {
        return res.status(404).json({ success: false, message: "Appointment not found or no changes made" });
    }

    res.json({ success: true, message: "Appointment updated successfully" });
} catch (err) {
    next(err);
}
}


// DELETE DEPARTMENT
const deleteAppointment = async (req, res, next) => {

    try {

        // Check if appointment_id is provided in the URL
        const appointmentId = req.params.appointment_id;
        if (!appointmentId) {
            return res.status(400).json({
                success: false,
                message: 'Appointment ID is required to delete the appointment'
            });
        }

        // Attempt to delete the appointment with the provided appointment_id
        const deleted = await Appointment.destroy({
            where: { appointment_id: appointmentId }
        });

        // Check if an appointment was actually deleted
        if (deleted === 0) {
            return res.status(404).json({ success: false, message: "Appointment not found" });
        }

        // If successful, return a success message
        res.json({ success: true, message: "Appointment deleted successfully" });
    } catch (err) {
        next(err);
    }
};

module.exports = {getAppointment, getAppointmentById,  createAppointment, updateAppointment, deleteAppointment, getAppointmentByStatus , getAppointmentByStatusForVisitor };