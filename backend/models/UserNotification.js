const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/db.js'); // Import the sequelize instance

const UserNotification = sequelize.define('UserNotification', {
    sender_user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    token_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    department_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    user_type_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    notification_id: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    checkin_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    visitor_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    reciever_user_id: {
        type: DataTypes.INTEGER,
    },
    notification_status: {
        type: DataTypes.STRING,
    }
}, {
    tableName: 'user_notification', // The name of the table in your database
});

module.exports = UserNotification;