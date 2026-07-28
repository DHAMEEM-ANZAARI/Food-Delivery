const { sequelize, Order, OrderItem, MenuItem, Restaurant } = require('../models');

// POST /api/orders
// body: { restaurantId, items: [{ menuItemId, quantity }], orderType, reservationTime, partySize }
exports.createOrder = async (req, res) => {
  const { restaurantId, items, orderType, reservationTime, partySize } = req.body;
  if (!restaurantId || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'restaurantId and items[] are required' });
  }

  const t = await sequelize.transaction();
  try {
    const restaurant = await Restaurant.findByPk(restaurantId, { transaction: t });
    if (!restaurant) throw new Error('Restaurant not found');

    // Enforce single-restaurant cart integrity: all menu items must belong to this restaurant
    const menuItems = await MenuItem.findAll({
      where: { id: items.map((i) => i.menuItemId), restaurantId },
      transaction: t,
    });
    if (menuItems.length !== items.length) {
      throw new Error('One or more items do not belong to this restaurant, or do not exist');
    }

    let total = 0;
    const priceMap = {};
    menuItems.forEach((m) => { priceMap[m.id] = parseFloat(m.price); });
    items.forEach((i) => { total += priceMap[i.menuItemId] * i.quantity; });

    const order = await Order.create({
      customerId: req.user.id,
      restaurantId,
      orderType: orderType || 'DELIVERY',
      totalAmount: total,
      reservationTime: reservationTime || null,
      partySize: partySize || null,
      status: 'PLACED',
    }, { transaction: t });

    await OrderItem.bulkCreate(
      items.map((i) => ({
        orderId: order.id,
        menuItemId: i.menuItemId,
        quantity: i.quantity,
        unitPrice: priceMap[i.menuItemId],
      })),
      { transaction: t }
    );

    await t.commit();

    const fullOrder = await Order.findByPk(order.id, {
      include: [{ model: OrderItem, as: 'items', include: [{ model: MenuItem, as: 'menuItem' }] }],
    });

    // Real-time notification to the restaurant's dashboard room
    const io = req.app.get('io');
    io.to(`restaurant_${restaurantId}`).emit('order:new', fullOrder);

    res.status(201).json(fullOrder);
  } catch (err) {
    await t.rollback();
    res.status(400).json({ message: err.message });
  }
};

// PATCH /api/orders/:id/status  { status }
const VALID_TRANSITIONS = {
  PLACED: ['ACCEPTED', 'CANCELLED'],
  ACCEPTED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['COURIER_ASSIGNED', 'CANCELLED'],
  COURIER_ASSIGNED: ['IN_TRANSIT'],
  IN_TRANSIT: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const allowed = VALID_TRANSITIONS[order.status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: `Cannot transition from ${order.status} to ${status}` });
    }

    order.status = status;
    await order.save();

    const io = req.app.get('io');
    // Push to consumer, merchant, and courier views alike
    io.to(`order_${order.id}`).emit('order:status', { orderId: order.id, status });
    io.to(`restaurant_${order.restaurantId}`).emit('order:status', { orderId: order.id, status });

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getOne = async (req, res) => {
  const order = await Order.findByPk(req.params.id, {
    include: [
      { model: OrderItem, as: 'items', include: [{ model: MenuItem, as: 'menuItem' }] },
      { model: Restaurant, as: 'restaurant' },
    ],
  });
  if (!order) return res.status(404).json({ message: 'Order not found' });
  res.json(order);
};

exports.myOrders = async (req, res) => {
  const orders = await Order.findAll({
    where: { customerId: req.user.id },
    include: [{ model: Restaurant, as: 'restaurant' }],
    order: [['createdAt', 'DESC']],
  });
  res.json(orders);
};

// Merchant dashboard: orders for a given restaurant owned by the logged-in user
exports.restaurantOrders = async (req, res) => {
  const restaurant = await Restaurant.findByPk(req.params.restaurantId);
  if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });
  if (restaurant.ownerId !== req.user.id) return res.status(403).json({ message: 'Not your restaurant' });

  const orders = await Order.findAll({
    where: { restaurantId: restaurant.id },
    include: [{ model: OrderItem, as: 'items', include: [{ model: MenuItem, as: 'menuItem' }] }],
    order: [['createdAt', 'DESC']],
  });
  res.json(orders);
};
