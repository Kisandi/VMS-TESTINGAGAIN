const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/db.js'); // Import the sequelize instance

const VisitorRestriction = sequelize.define('VisitorRestriction', {
    token_id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
    },
    restricted_attempt_id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
    },
    visitor_id: {
        type: DataTypes.STRING,
        allowNull: false,
    }
}, {
    timestamps: false, // Disable automatic timestamps if not needed
    tableName: 'visitor_restriction', // The name of the table in your database
});

module.exports = VisitorRestriction;