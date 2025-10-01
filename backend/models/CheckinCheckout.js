const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // Import the sequelize instance

const CheckinCheckout = sequelize.define('CheckinCheckout', {
    checkin_id: {
        type: DataTypes.UUID,
        primaryKey: true,
          defaultValue: DataTypes.UUIDV4
    },
    token_id: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    appointment_id: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    checkin_time: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    checkout_time: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    manually_ended: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        defaultValue: null
    }


}, {
    timestamps: false,
    tableName: 'checkin_checkout', // The name of the table in your database
});

module.exports = CheckinCheckout;
