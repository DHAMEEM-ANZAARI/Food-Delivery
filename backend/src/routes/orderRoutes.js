const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/orderController');
const { protect, requireRole } = require('../middleware/auth');

router.post('/', protect, requireRole('customer'), ctrl.createOrder);
router.get('/mine', protect, ctrl.myOrders);
router.get('/restaurant/:restaurantId', protect, requireRole('restaurant', 'admin'), ctrl.restaurantOrders);
router.get('/:id', protect, ctrl.getOne);
router.patch('/:id/status', protect, requireRole('restaurant', 'admin', 'courier'), ctrl.updateStatus);

module.exports = router;
