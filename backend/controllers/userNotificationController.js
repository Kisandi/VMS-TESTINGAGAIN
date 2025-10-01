const { UserNotification, } = require('../models');

const getUserNotification = async (req, res) => {
    try {
        // const data = await Appointment.findAll();
        // res.json(data);

        const page = parseInt(req.query.page) || 1; // default page = 1
        const limit = parseInt(req.query.limit) || 2; // default limit = 2
        const offset = (page - 1) * limit;

        const data = await UserNotification.findAndCountAll({
            offset: offset,
            limit: limit,
            order: [['sender_user_id', 'ASC']],
        });

        res.json({
            success: true,
            currentPage: page,
            totalPages: Math.ceil(data.count / limit),
            totalRecords: data.count,
            userNotification: data.rows,
        });

        if (!data){
            return res.status(404).send({
                success: false,
                message: 'No such user notification'
            })
        }
        res.status(200).send({
            success: true,
            message: 'User Notification successfully',
            totalAppointment: data[0].length,
            data: data[0],
        })
    }catch(err) {
        console.log(err)
        res.status(500).send({
            success: false,
            message: 'Error getting user notification',
            err
        })
    }
};




// CREATE DEPARTMENT
const createUserNotification = async (req, res) => {
    try{
        const {sender_user_id, reciever_user_id, notification_status} = req.body
        if(!sender_user_id || !reciever_user_id || !notification_status){
            return res.status(500).send({
                success: false,
                message: 'Error creating user notification',
            })
        }

        //  const data = await db.query('INSERT INTO appointment (appointment_id, created_at, requested_date_time, purpose, duration, approval_status, visitor_id) VALUES (?, ?, ?, ?, ?, ?, ?)',[appointment_id, created_at, requested_date_time, purpose, duration, approval_status, visitor_id])

        const data = await UserNotification.create({
            sender_user_id,
            reciever_user_id,

        })

        if (!data){
            return res.status(400).send({
                success: false,
                message: 'Error creating user notification',
            })
        }
        res.status(201).send({
            success: true,
            message: 'User Notification successfully',
        })
    }catch (err){
        console.log(err)
        res.status(500).send({
            success: false,
            message: 'Error creating user notification',
            err
        })
    }
    }
module.exports = {getUserNotification, createUserNotification  };