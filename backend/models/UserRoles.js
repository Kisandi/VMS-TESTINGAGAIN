const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const UserRoles = sequelize.define('UserRoles', {
    user_id: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
        references: {
            model: 'users',  // make sure this matches your User table name
            key: 'user_id',
        },
    },
    user_type_id: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
        references: {
            model: 'user_types',  // make sure this matches your UserType table name
            key: 'user_type_id',
        },
    },
}, {
    tableName: 'user_roles',
    timestamps: false,
});

module.exports = UserRoles;
