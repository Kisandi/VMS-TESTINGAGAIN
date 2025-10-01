const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/db.js'); // Import the sequelize instance

const PermissionHasUser = sequelize.define('PermissionHasUser', {
    permission_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    user_id: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    department_id: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    user_type_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    location_id: {
        type: DataTypes.STRING,
        allowNull: true,
    }
}, {
    timestamps: false,
    tableName: 'Permission_has_User', // The name of the table in your database
});

module.exports = PermissionHasUser;