const { DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // Import the sequelize instance

const Location = sequelize.define('Location', {
    location_id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: true,
    },
    location: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    is_public: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },


}, {
    timestamps: false,
    tableName: 'location', // The name of the table in your database
});

module.exports = Location;
