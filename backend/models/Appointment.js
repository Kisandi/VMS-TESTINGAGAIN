const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.js');

const Appointment = sequelize.define('Appointment', {
    appointment_id: {
        type: DataTypes.STRING(45),
        primaryKey: true,
        allowNull: false,
        unique: true,
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    requested_date_time: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    purpose: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    duration: {
        type: DataTypes.STRING(45),
        allowNull: false,
    },
    approval_status: {
        type: DataTypes.STRING(15),
        allowNull: false,
        defaultValue: 'pending',
    },
    comment: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    end_time: {
        type: DataTypes.TIME,
        allowNull: true,
    },
    department_id: {
        type: DataTypes.STRING(10),
        allowNull: true,
        references: {
            model: 'department',
            key: 'department_id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },
    visitor_id: {
        type: DataTypes.STRING(45),
        allowNull: true,
        references: {
            model: 'visitor',
            key: 'visitor_id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },
    token_id: {
        type: DataTypes.STRING(45), // match RFIDToken
        allowNull: true,
        references: {
            model: 'rfid_token', // exact table name
            key: 'token_id',
        },
        onUpdate: 'NO ACTION',
        onDelete: 'NO ACTION'
    },
    user_id: {
        type: DataTypes.STRING(45),
        allowNull: true,
        references: {
            model: 'user',
            key: 'user_id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    },

}, {
    tableName: 'appointment',
    timestamps: false,
});

module.exports = Appointment;
