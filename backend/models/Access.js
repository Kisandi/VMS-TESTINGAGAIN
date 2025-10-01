const {  DataTypes } = require('sequelize');
const sequelize = require('../config/db.js'); // Import the sequelize instance

const Access = sequelize.define('Access', {
    access_log_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        unique: true,
        allowNull: false,
    },

    visitor_id: {
        type: DataTypes.STRING(10),
        allowNull: false,
    },
    token_id: {
        type: DataTypes.STRING(10),
        allowNull: false,
    },
    location_id: {
        type: DataTypes.STRING(10),
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM('allowed', 'restricted'),
        allowNull: false,
    }

}, {
    tableName: 'access_log', // The name of the table in your database
    timestamps: true,
});

module.exports = Access;
