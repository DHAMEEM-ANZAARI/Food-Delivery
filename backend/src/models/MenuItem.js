const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const MenuItem = sequelize.define('MenuItem', {
  restaurantId: { type: DataTypes.INTEGER, allowNull: false, field: 'restaurant_id' },
  name: { type: DataTypes.STRING(150), allowNull: false },
  description: { type: DataTypes.TEXT },
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  isAvailable: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_available' },
}, {
  tableName: 'menu_items',
  underscored: true,
});

module.exports = MenuItem;
