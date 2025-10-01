const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/db.js'); // Import the sequelize instance

const RestrictedAccessAttempt = sequelize.define('RestrictedAccessAttempt', {
    attempt_id: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    timestamp: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    access_point: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
    }
}, {
    timestamps: false,
    tableName: 'restricted_access_attempt', // The name of the table in your database
});

module.exports = RestrictedAccessAttempt;