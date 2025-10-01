const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // Import the sequelize instance
// const User = require('./User'); // Import the User model

const Department = sequelize.define('Department', {
    department_id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
        unique: true
    },
    department_name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },

}, {
    tableName: 'department', // The name of the table in your database
    timestamps: false,
});


module.exports = Department;
