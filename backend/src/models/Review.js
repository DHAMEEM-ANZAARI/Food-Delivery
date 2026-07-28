const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Review = sequelize.define('Review', {
  orderId: { type: DataTypes.INTEGER, allowNull: false, field: 'order_id' },
  customerId: { type: DataTypes.INTEGER, allowNull: false, field: 'customer_id' },
  restaurantId: { type: DataTypes.INTEGER, allowNull: false, field: 'restaurant_id' },
  rating: { type: DataTypes.TINYINT, allowNull: false },
  reviewText: { type: DataTypes.TEXT, field: 'review_text' },
  rewardPoints: { type: DataTypes.INTEGER, defaultValue: 0, field: 'reward_points' },
}, {
  tableName: 'reviews',
  underscored: true,
  updatedAt: false,
});

module.exports = Review;
