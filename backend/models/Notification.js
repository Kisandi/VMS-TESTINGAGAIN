const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // Import the sequelize instance

const Notification = sequelize.define('Notification', {
    notification_id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
        unique: true,
    },
    notification_type: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    content: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false, // Default value for read status
    },
    timestamp: {
        type: DataTypes.DATE,
        allowNull: true
    }


}, {
    timestamps: true,
    tableName: 'notification', // The name of the table in your database
});

module.exports = Notification;
