const sequelize = require('../config/db');
const User = require('./User');
const Restaurant = require('./Restaurant');
const MenuItem = require('./MenuItem');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const Review = require('./Review');

// Associations
User.hasMany(Restaurant, { foreignKey: 'ownerId' });
Restaurant.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

Restaurant.hasMany(MenuItem, { foreignKey: 'restaurantId', as: 'menuItems' });
MenuItem.belongsTo(Restaurant, { foreignKey: 'restaurantId' });

User.hasMany(Order, { foreignKey: 'customerId' });
Order.belongsTo(User, { foreignKey: 'customerId', as: 'customer' });

Restaurant.hasMany(Order, { foreignKey: 'restaurantId' });
Order.belongsTo(Restaurant, { foreignKey: 'restaurantId', as: 'restaurant' });

Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId' });

MenuItem.hasMany(OrderItem, { foreignKey: 'menuItemId' });
OrderItem.belongsTo(MenuItem, { foreignKey: 'menuItemId', as: 'menuItem' });

Order.hasOne(Review, { foreignKey: 'orderId', as: 'review' });
Review.belongsTo(Order, { foreignKey: 'orderId' });

Restaurant.hasMany(Review, { foreignKey: 'restaurantId' });
Review.belongsTo(Restaurant, { foreignKey: 'restaurantId' });

User.hasMany(Review, { foreignKey: 'customerId' });
Review.belongsTo(User, { foreignKey: 'customerId', as: 'customer' });

module.exports = {
  sequelize,
  User,
  Restaurant,
  MenuItem,
  Order,
  OrderItem,
  Review,
};
