const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.js'); // Import the sequelize instance

const Visitor = sequelize.define('Visitor', {
    visitor_id: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    first_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    last_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    id_type: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    nic: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    registered_date: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    contact_number: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    blacklist_status: {
        type: DataTypes.STRING,
    },
    address:{
        type: DataTypes.STRING,
    },
    date_of_birth: {
        type: DataTypes.DATE,

    },
    file: {
        type: DataTypes.BLOB, // Use BLOB for file storage
        allowNull: true, // Allow null if no file is uploaded
    }




}, {
    timestamps: false,
    tableName: 'visitor', // The name of the table in your database
});

module.exports = Visitor;