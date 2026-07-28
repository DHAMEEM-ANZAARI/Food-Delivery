const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const OrderItem = sequelize.define('OrderItem', {
  orderId: { type: DataTypes.INTEGER, allowNull: false, field: 'order_id' },
  menuItemId: { type: DataTypes.INTEGER, allowNull: false, field: 'menu_item_id' },
  quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  unitPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false, field: 'unit_price' },
}, {
  tableName: 'order_items',
  underscored: true,
  timestamps: false,
});

module.exports = OrderItem;
