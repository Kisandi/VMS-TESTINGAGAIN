const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Otp = sequelize.define('Otp', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    code: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    visitor_id: {  // or visitor_id, FK to Visitor
        type: DataTypes.STRING,
        allowNull: false,
        references: {
            model: 'visitor',
            key: 'visitor_id'
        }
    },
}, {
    timestamps: true,
    tableName: 'otp',
});

module.exports = Otp;
