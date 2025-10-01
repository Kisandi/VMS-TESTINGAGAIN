const db = require("../config/db");
const {RestrictNotification, Department} = require("../models");

const getRestrictedNotification = async (req, res) => {
    try {
       // const data = await db.query(`SELECT * FROM restrictednotification`);

        const page = parseInt(req.query.page) || 1; // default page = 1
        const limit = parseInt(req.query.limit) || 2; // default limit = 2
        const offset = (page - 1) * limit;

        const data = await RestrictNotification.findAndCountAll({
            offset: offset,
            limit: limit,
            order: [['restricted_attempt_id', 'ASC']],
        });

        if (!data){
            return res.status(404).send({
                success: false,
                message: 'No such restrictednotification',
            })
        }
        res.status(200).send({
            success: true,
            message: 'restricted notification successfully',
            totalDepartment: data[0].length,
            data: data[0],
        })
    }catch(err) {
        console.log(err)
        res.status(500).send({
            success: false,
            message: 'Error getting Notification',
            err
        })
    }
};


// CREATE RESTRICTED NOTIFICATION
const createRestrictedNotification = async (req, res) => {
    try{
        const {notification_id, restricted_attempt_id} = req.body
        if(!notification_id || !restricted_attempt_id){
            return res.status(500).send({
                success: false,
                message: 'Error creating notification',
            })
        }

      //  const data = await db.query('INSERT INTO restrictednotification (notification_id, restricted_attempt_id) VALUES (?, ?)',[notification_id, restricted_attempt_id])

        const data = await RestrictNotification.create({
            notification_id,
            restricted_attempt_id,
        })

        if (!data){
            return res.status(400).send({
                success: false,
                message: 'Error creating notification',
            })
        }
        res.status(201).send({
            success: true,
            message: 'Notification successfully',
        })
    }catch (err){
        console.log(err)
        res.status(500).send({
            success: false,
            message: 'Error creating department',
            err
        })
    }
}






module.exports = {getRestrictedNotification, createRestrictedNotification };