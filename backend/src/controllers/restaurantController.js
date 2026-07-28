const { QueryTypes } = require('sequelize');
const sequelize = require('../config/db');
const { Restaurant, MenuItem } = require('../models');

// GET /api/restaurants/nearby?lat=..&lng=..&radiusKm=5&cuisine=..&page=1&limit=10
// Uses MySQL's native ST_Distance_Sphere for geospatial proximity search,
// equivalent in purpose to MongoDB's $geoNear aggregation stage.
exports.nearby = async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    const radiusKm = parseFloat(req.query.radiusKm) || 5;
    const cuisine = req.query.cuisine;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ message: 'lat and lng query params are required' });
    }

    let cuisineFilter = '';
    const replacements = { lat, lng, radiusMeters: radiusKm * 1000, limit, offset };
    if (cuisine) {
      cuisineFilter = 'AND cuisine = :cuisine';
      replacements.cuisine = cuisine;
    }

    const rows = await sequelize.query(
      `
      SELECT
        id, name, cuisine, description, address, avg_rating AS avgRating,
        rating_count AS ratingCount, is_open AS isOpen,
        ST_X(location) AS lng, ST_Y(location) AS lat,
        ST_Distance_Sphere(location, POINT(:lng, :lat)) AS distanceMeters
      FROM restaurants
      WHERE ST_Distance_Sphere(location, POINT(:lng, :lat)) <= :radiusMeters
      ${cuisineFilter}
      ORDER BY distanceMeters ASC, avg_rating DESC
      LIMIT :limit OFFSET :offset
      `,
      { replacements, type: QueryTypes.SELECT }
    );

    res.json({
      page,
      limit,
      count: rows.length,
      restaurants: rows.map((r) => ({
        ...r,
        distanceKm: Number((r.distanceMeters / 1000).toFixed(2)),
      })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, cuisine, description, address, lat, lng } = req.body;
    if (!name || lat == null || lng == null) {
      return res.status(400).json({ message: 'name, lat, lng are required' });
    }
    const restaurant = await Restaurant.create({
      ownerId: req.user.id,
      name,
      cuisine,
      description,
      address,
      location: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
    });
    res.status(201).json(restaurant);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getOne = async (req, res) => {
  const restaurant = await Restaurant.findByPk(req.params.id, {
    include: [{ model: MenuItem, as: 'menuItems' }],
  });
  if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });
  res.json(restaurant);
};

exports.update = async (req, res) => {
  const restaurant = await Restaurant.findByPk(req.params.id);
  if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });
  if (restaurant.ownerId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not your restaurant' });
  }
  const { name, cuisine, description, address, isOpen } = req.body;
  await restaurant.update({ name, cuisine, description, address, isOpen });
  res.json(restaurant);
};

// Merchant dashboard: list restaurants owned by the logged-in user
exports.myRestaurants = async (req, res) => {
  const restaurants = await Restaurant.findAll({ where: { ownerId: req.user.id } });
  res.json(restaurants);
};

// --- Menu items ---
exports.addMenuItem = async (req, res) => {
  const restaurant = await Restaurant.findByPk(req.params.id);
  if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });
  if (restaurant.ownerId !== req.user.id) return res.status(403).json({ message: 'Not your restaurant' });

  const { name, description, price } = req.body;
  const item = await MenuItem.create({ restaurantId: restaurant.id, name, description, price });
  res.status(201).json(item);
};

exports.toggleMenuItemAvailability = async (req, res) => {
  const item = await MenuItem.findByPk(req.params.itemId, { include: [{ model: Restaurant }] });
  if (!item) return res.status(404).json({ message: 'Menu item not found' });
  if (item.Restaurant.ownerId !== req.user.id) return res.status(403).json({ message: 'Not your restaurant' });

  item.isAvailable = !item.isAvailable;
  await item.save();
  res.json(item);
};
