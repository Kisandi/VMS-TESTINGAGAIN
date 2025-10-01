const db = require("../config/db");
const { Notification, Visitor, CheckinCheckout, RestrictedAccessAttempt} = require("../models");
const dayjs = require('dayjs');
const { Op } = require('sequelize');

const { v4: uuidv4 } = require('uuid'); // Import this at the top

const getLiveNotifications = async (req, res) => {
    try {
        const now = dayjs();
        let allNotifications = [];

        const checkins = await CheckinCheckout.findAll({
            include: [{ model: Visitor }],
            where: {
                checkin_time: { [Op.ne]: null }
            },
            order: [['checkin_time', 'DESC']],
            limit: 5
        });

        for (const record of checkins) {
            const name = `${record.Visitor?.first_name || ''} ${record.Visitor?.last_name || ''}`;
            const checkinTime = dayjs(record.checkin_time);
            const duration = record.duration || 30;
            const expectedCheckout = checkinTime.add(duration, 'minute');
            const isOverstayed = now.isAfter(expectedCheckout);

            const type = isOverstayed ? 'overstay' : 'checkin';
            const content = isOverstayed
                ? `⚠️ Visitor ${name} has overstayed.`
                : `✅ Visitor ${name} checked in.`;

            // Check if it already exists
            const existing = await Notification.findOne({
                where: {
                    content,
                    checkin_id: record.checkin_id,
                    visitor_id: record.visitor_id,
                    notification_type: type
                }
            });

            if (!existing) {
                const newNotification = await Notification.create({
                    notification_id: uuidv4(),
                    notification_type: type,
                    content,
                    checkin_id: record.checkin_id,
                    visitor_id: record.visitor_id,
                    timestamp: record.checkin_time,
                    read: false,
                });
                allNotifications.push(newNotification);
            } else if (!existing.read) {
                allNotifications.push(existing);
            }
        }

        const restrictedAttempts = await RestrictedAccessAttempt.findAll({
            order: [['timestamp', 'DESC']],
            limit: 5
        });

        for (const attempt of restrictedAttempts) {
            const content = `🚫 Restricted access attempt at ${attempt.access_point} on ${dayjs(attempt.timestamp).format('YYYY-MM-DD HH:mm:ss')}`;

            const existing = await Notification.findOne({
                where: {
                    content,
                    timestamp: attempt.timestamp,
                    notification_type: 'restricted'
                }
            });

            if (!existing) {
                const newNotification = await Notification.create({
                    notification_id: uuidv4(),
                    notification_type: 'restricted',
                    content,
                    timestamp: attempt.timestamp,
                    read: false
                });
                allNotifications.push(newNotification);
            } else if (!existing.read) {
                allNotifications.push(existing);
            }
        }

        // Return only unread notifications, sorted
        allNotifications = allNotifications
            .filter(note => !note.read)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 20);

        res.status(200).send({
            success: true,
            data: allNotifications
        });
    } catch (err) {
        console.error(err);
        res.status(500).send({
            success: false,
            message: 'Error fetching notifications',
            err
        });
    }
};



const getNotification = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const whereClause = {};
        if (req.query.read === 'false') {
            whereClause.read = false;
        }
        const data = await Notification.findAndCountAll({
            where: whereClause,
            offset,
            limit,
            order: [['notification_id', 'DESC']],
        });

        if (!data || data.count === 0) {
            return res.status(404).send({
                success: false,
                message: 'No notifications found'
            });
        }

        res.status(200).send({
            success: true,
            message: 'Notifications retrieved successfully',
            totalNotification: data.count,
            data: data.rows,
        });
    } catch (err) {
        console.error('Error in getNotification:', err);
        res.status(500).send({
            success: false,
            message: 'Error fetching notifications',
            err
        });
    }
};


// GET VISITOR BY ID
const getNotificationById = async (req, res) => {
    try {
        const notificationId = req.params.notification_id;
        // console.log("Visitor ID from params:", visitorId);
        if (!notificationId){
            return res.status(404).send({
                success: false,
                message: 'No such notification'
            });
        }

        // const data = await db.query(' SELECT * FROM visitor WHERE id ='+visitorId)

    //    const data = await db.query('SELECT * FROM notification WHERE notification_id=?', [notificationid]);

        const data = await Notification.findAll({
            where: {notification_id: notificationId}
        });


        console.log("Query result:", data);
        if (!data || data.length === 0){
            return res.status(404).send({
                success: false,
                message: 'No such notification'
            });
        }
        res.status(200).send({
            success: true,
            message: 'Notification successfully',
            data: data[0],
        });
    }catch (err){
        console.log(err)
        res.status(500).send({
            success: false,
            message: 'Error getting notification by id',
        });
    }
};

// In your notifications controller (e.g., notificationController.js)

const markAsRead = async (req, res) => {
    try {
        const { notification_id } = req.params;

        // Assuming you have a Notification model and a 'read' boolean field
        const notification = await Notification.findOne({ where: { notification_id } });
        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        notification.read = true;
        await notification.save();

        res.json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Optional: mark all as read
const markAllAsRead = async (req, res) => {
    try {
        await Notification.update({ read: true }, { where: { read: false } });
        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};




// CREATE DEPARTMENT
const createNotification = async (req, res) => {
    try{
        const {notification_id, notification_type, content, timestamp} = req.body
        if(!notification_id || !notification_type || !content || !timestamp ){
            return res.status(500).send({
                success: false,
                message: 'Error creating notification',
            })
        }

      //  const data = await db.query('INSERT INTO notification (notification_id, notification_type, content, timestamp, user_id, checkin_id, token_id, visitor_id) VALUES (?, ?, ?, ?, ?, ?, ?)',[notification_id, notification_type, content, timestamp, user_id, checkin_id, token_id, visitor_id])

        const data = await Notification.create({
            notification_id,
            notification_type, content,
            timestamp: new Date()
        })

        if (!data){
            return res.status(400).send({
                success: false,
                message: 'Error creating notification',
            })
        }

        const io = req.app.get('io');
        io.emit('notification', {
            notification_id: data.notification_id,
            notification_type: data.notification_type,
            content: data.content,
            timestamp: data.timestamp,
            read: false
        });



        res.status(201).send({
            success: true,
            message: 'Notification successfully',
        })
    }catch (err){
        console.log(err)
        res.status(500).send({
            success: false,
            message: 'Error creating notification',
            err
        })
    }
}

// UPDATE DEPARTMENT
const updateNotification = async (req, res) => {
    try{
        const notificationId = req.params.notification_id;
        if(!notificationId){
            return res.status(404).send({
                success: false,
                message: 'No such notification'
            })
        }
        const {notification_type, content, timestamp} = req.body
     //   const data = await db.query('UPDATE notification SET notification_type = ? , content = ?, timestamp = ?, user_id = ?, checkin_id = ?, token_id = ?, visitor_id = ? WHERE notification_id = ?', [notification_type, content, timestamp, user_id, checkin_id, token_id, visitor_id, notificationId])

        const data = await Notification.update(
            {notification_type, content, timestamp},
            {
                where: {
                    notification_id: notificationId,
                }
            }
        )

        if (!data){
            return res.status(500).send({
                success: false,
                message: 'Error updating notification',
            })
        }
        res.status(200).send({
            success: true,
            message: 'Notification successfully',
        })
    }catch(err){
        console.log(err)
        res.status(500).send({
            success: false,
            message: 'Error updating notification',
            err
        })
    }
}


// DELETE DEPARTMENT
const deleteNotification = async (req, res) => {
    try{
        const notificationId = req.params.notification_id;
        if(!notificationId){
            return res.status(400).send({
                success: false,
                message: 'No such notification'
            })
        }
       // await db.query('DELETE FROM notification WHERE notification_id=?', [notificationId])

        await Notification.destroy({
            where: {
                notification_id: notificationId,
            }
        })
        res.status(200).send({
            success: true,
            message: 'Notification successfully',
        })
    }catch (err){
        console.log(err)
        res.status(500).send({
            success: false,
            message: 'Error deleting notification',
            err
        })
    }
}

module.exports = {getNotification, getNotificationById, createNotification, updateNotification, deleteNotification , getLiveNotifications , markAllAsRead, markAsRead};