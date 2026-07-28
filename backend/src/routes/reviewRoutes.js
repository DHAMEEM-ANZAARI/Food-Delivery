const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reviewController');
const { protect, requireRole } = require('../middleware/auth');

router.get('/suggestions', protect, ctrl.suggestKeywords);
router.post('/', protect, requireRole('customer'), ctrl.createReview);
router.get('/restaurant/:restaurantId', ctrl.restaurantReviews);

module.exports = router;
