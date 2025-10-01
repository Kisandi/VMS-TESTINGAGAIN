const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // Import the sequelize instance

const Permission = sequelize.define('Permission', {
    permission_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        notnull: true,
        autoIncrement: true,
    },
    permission_name: {
        type: DataTypes.STRING,
        notNull: true,
    },
    created_at: {
        type: DataTypes.DATE,
        notnull: true,
    },
    updated_at: {
        type: DataTypes.DATE,

    },
}, {
    timestamps: false,
    tableName: 'permission', // The name of the table in your database
});

module.exports = Permission;
