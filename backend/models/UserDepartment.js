// models/User.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const UserDepartment = sequelize.define('UserDepartment', {
    user_id: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    department_id: {
        type: DataTypes.STRING,
        allowNull: true,
    }


},{
    timestamps: false,
    tableName: 'user_department',

});

module.exports = UserDepartment;
