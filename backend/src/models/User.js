const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
  name: { type: DataTypes.STRING(100), allowNull: false },
  email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
  password: { type: DataTypes.STRING(255), allowNull: false },
  role: {
    type: DataTypes.ENUM('customer', 'restaurant', 'courier', 'admin'),
    defaultValue: 'customer',
  },
  loyaltyPoints: { type: DataTypes.INTEGER, defaultValue: 0, field: 'loyalty_points' },
}, {
  tableName: 'users',
  underscored: true,
});

module.exports = User;
