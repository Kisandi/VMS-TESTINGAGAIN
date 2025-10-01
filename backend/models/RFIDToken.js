const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.js');

const RFIDToken = sequelize.define('RFIDToken', {
    token_id: {
        type: DataTypes.STRING(45), // specify length to match Appointment FK
        primaryKey: true,
        allowNull: false,
    },
    issued_at: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    expired_at: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    status: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    attempt_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    visitor_id: {
        type: DataTypes.STRING(45),
        allowNull: true,
    },
    user_id: {
        type: DataTypes.STRING(45),
        allowNull: true,
    }
}, {
    timestamps: false,
    tableName: 'rfid_token', // exact DB table name
});

module.exports = RFIDToken;
