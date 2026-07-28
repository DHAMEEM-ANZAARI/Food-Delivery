const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Order = sequelize.define('Order', {
  customerId: { type: DataTypes.INTEGER, allowNull: false, field: 'customer_id' },
  restaurantId: { type: DataTypes.INTEGER, allowNull: false, field: 'restaurant_id' },
  status: {
    type: DataTypes.ENUM(
      'PLACED', 'ACCEPTED', 'PREPARING', 'COURIER_ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'
    ),
    defaultValue: 'PLACED',
  },
  orderType: {
    type: DataTypes.ENUM('DELIVERY', 'RESERVATION'),
    defaultValue: 'DELIVERY',
    field: 'order_type',
  },
  totalAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, field: 'total_amount' },
  reservationTime: { type: DataTypes.DATE, allowNull: true, field: 'reservation_time' },
  partySize: { type: DataTypes.INTEGER, allowNull: true, field: 'party_size' },
}, {
  tableName: 'orders',
  underscored: true,
});

module.exports = Order;
