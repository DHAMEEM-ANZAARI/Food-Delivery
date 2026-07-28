const { sequelize, Order, Review, Restaurant, User } = require('../models');

// Simple keyword bank used to nudge users toward descriptive reviews.
// A production system would swap this for an NLP/embedding-based service.
const DESCRIPTIVE_KEYWORDS = [
  'fresh', 'delicious', 'flavorful', 'crispy', 'tender', 'fast', 'friendly',
  'packaging', 'portion', 'spicy', 'authentic', 'value', 'presentation', 'hot', 'clean',
];

function scoreReview(text) {
  if (!text) return 0;
  const words = text.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const lower = text.toLowerCase();
  const keywordHits = DESCRIPTIVE_KEYWORDS.filter((k) => lower.includes(k)).length;

  // Base points for effort, bonus for descriptive keyword density
  let points = Math.min(wordCount, 100) * 0.5; // up to 50 pts for length
  points += keywordHits * 5; // up to ~70 pts for descriptive keywords
  return Math.round(points);
}

// GET /api/reviews/suggestions?restaurantId=1
// AI-assistance-layer stand-in: suggests keywords based on cuisine to lower
// the cognitive friction of writing a detailed review.
exports.suggestKeywords = async (req, res) => {
  const { restaurantId } = req.query;
  const restaurant = await Restaurant.findByPk(restaurantId);
  const base = DESCRIPTIVE_KEYWORDS.slice(0, 8);
  const cuisineHint = restaurant?.cuisine ? [restaurant.cuisine.toLowerCase()] : [];
  res.json({ suggestions: [...cuisineHint, ...base] });
};

exports.createReview = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { orderId, rating, reviewText } = req.body;
    if (!orderId || !rating) throw new Error('orderId and rating are required');

    const order = await Order.findByPk(orderId, { transaction: t });
    if (!order) throw new Error('Order not found');
    if (order.customerId !== req.user.id) throw new Error('Not your order');
    if (order.status !== 'DELIVERED') throw new Error('Order must be delivered before reviewing');

    const existing = await Review.findOne({ where: { orderId }, transaction: t });
    if (existing) throw new Error('Review already submitted for this order');

    const rewardPoints = scoreReview(reviewText);

    const review = await Review.create({
      orderId,
      customerId: req.user.id,
      restaurantId: order.restaurantId,
      rating,
      reviewText,
      rewardPoints,
    }, { transaction: t });

    // Update restaurant aggregate rating
    const restaurant = await Restaurant.findByPk(order.restaurantId, { transaction: t });
    const newCount = restaurant.ratingCount + 1;
    const newAvg = ((restaurant.avgRating * restaurant.ratingCount) + Number(rating)) / newCount;
    await restaurant.update({ ratingCount: newCount, avgRating: newAvg.toFixed(2) }, { transaction: t });

    // Award loyalty points to the user
    const user = await User.findByPk(req.user.id, { transaction: t });
    await user.update({ loyaltyPoints: user.loyaltyPoints + rewardPoints }, { transaction: t });

    await t.commit();
    res.status(201).json({ review, rewardPoints, totalLoyaltyPoints: user.loyaltyPoints + rewardPoints });
  } catch (err) {
    await t.rollback();
    res.status(400).json({ message: err.message });
  }
};

exports.restaurantReviews = async (req, res) => {
  const reviews = await Review.findAll({
    where: { restaurantId: req.params.restaurantId },
    include: [{ model: User, as: 'customer', attributes: ['id', 'name'] }],
    order: [['createdAt', 'DESC']],
  });
  res.json(reviews);
};
