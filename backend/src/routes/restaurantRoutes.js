const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/restaurantController');
const { protect, requireRole } = require('../middleware/auth');

router.get('/nearby', ctrl.nearby);
router.get('/mine', protect, requireRole('restaurant', 'admin'), ctrl.myRestaurants);
router.get('/:id', ctrl.getOne);
router.post('/', protect, requireRole('restaurant', 'admin'), ctrl.create);
router.patch('/:id', protect, requireRole('restaurant', 'admin'), ctrl.update);

router.post('/:id/menu-items', protect, requireRole('restaurant', 'admin'), ctrl.addMenuItem);
router.patch('/menu-items/:itemId/toggle', protect, requireRole('restaurant', 'admin'), ctrl.toggleMenuItemAvailability);

module.exports = router;
