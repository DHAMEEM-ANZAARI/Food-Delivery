const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Restaurant = sequelize.define('Restaurant', {
  ownerId: { type: DataTypes.INTEGER, allowNull: false, field: 'owner_id' },
  name: { type: DataTypes.STRING(150), allowNull: false },
  cuisine: { type: DataTypes.STRING(100) },
  description: { type: DataTypes.TEXT },
  // MySQL native spatial type. We store as POINT(longitude, latitude).
  location: {
    type: DataTypes.GEOMETRY('POINT'),
    allowNull: false,
  },
  address: { type: DataTypes.STRING(255) },
  avgRating: { type: DataTypes.DECIMAL(3, 2), defaultValue: 0, field: 'avg_rating' },
  ratingCount: { type: DataTypes.INTEGER, defaultValue: 0, field: 'rating_count' },
  isOpen: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_open' },
}, {
  tableName: 'restaurants',
  underscored: true,
});

module.exports = Restaurant;
