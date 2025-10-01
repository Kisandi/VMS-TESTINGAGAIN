const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // Import the sequelize instance

const Blacklist = sequelize.define('Blacklist', {
    blacklist_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        notNull: true,
        unique: true,
    },
    blocked_at: {
        type: DataTypes.DATE,
        notnull: true,
    },
    blocked_by_user_id: {
        type: DataTypes.INTEGER,
        notnull: true,
    },
    reason: {
        type: DataTypes.STRING,
    },
}, {
    tableName: 'blacklist', // The name of the table in your database
    timestamps: false,
});

module.exports = Blacklist;
