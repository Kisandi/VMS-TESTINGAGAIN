// models/User.js
const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
  user_id: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true,
    autoIncrement: false,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: false,
  },
  first_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  last_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  contact: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  position: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  reset_password_token: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  reset_password_expires: {
    type: DataTypes.DATE,
    allowNull: true,
  },


},{
  tableName: 'user',
      timestamps: false,
    hooks: {
  beforeCreate: async (user) => {
    if (user.password) {
      user.password = await bcrypt.hash(user.password, 10);
    }
  }
}
});

module.exports = User;
