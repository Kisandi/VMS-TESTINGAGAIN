const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/db.js'); // Import the sequelize instance

const UserType = sequelize.define('UserType', {
    user_type_id: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    user_type: {
        type: DataTypes.STRING,
        allowNull: false,
    }
}, {
    timestamps: false,
    tableName: 'User_Type', // The name of the table in your database
});

module.exports = UserType;