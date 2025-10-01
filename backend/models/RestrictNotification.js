const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/db.js');

const RestrictNotification = sequelize.define('RestrictNotification', {
    restricted_attempt_id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
    },
    notification_id: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
            model: 'notification', // table name (not model name)
            key: 'notification_id',
        },
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION',
    }
}, {
    timestamps: false,
    tableName: 'restricted_notification',
    id: false,
});

module.exports = RestrictNotification;
