import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/api';
import { useCart } from '../context/CartContext.jsx';

export default function RestaurantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [restaurant, setRestaurant] = useState(null);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    api.get(`/restaurants/${id}`).then((res) => setRestaurant(res.data));
    api.get(`/reviews/restaurant/${id}`).then((res) => setReviews(res.data));
  }, [id]);

  if (!restaurant) return <div className="container">Loading...</div>;

  return (
    <div className="container">
      <button className="secondary" onClick={() => navigate(-1)}>&larr; Back</button>
      <h2>{restaurant.name}</h2>
      <p className="muted">{restaurant.cuisine} · {restaurant.address}</p>
      <p>⭐ {Number(restaurant.avgRating).toFixed(1)} ({restaurant.ratingCount} reviews)</p>
      <p>{restaurant.description}</p>

      <h3>Menu</h3>
      <div className="grid">
        {restaurant.menuItems?.map((item) => (
          <div className="card" key={item.id}>
            <h4>{item.name}</h4>
            <p className="muted">{item.description}</p>
            <p>₹{Number(item.price).toFixed(2)}</p>
            {item.isAvailable ? (
              <button
                onClick={() =>
                  addItem(restaurant.id, restaurant.name, {
                    menuItemId: item.id,
                    name: item.name,
                    price: Number(item.price),
                  })
                }
              >
                Add to cart
              </button>
            ) : (
              <span className="badge">Unavailable</span>
            )}
          </div>
        ))}
      </div>

      <h3>Reviews</h3>
      {reviews.length === 0 && <p className="muted">No reviews yet.</p>}
      {reviews.map((r) => (
        <div className="card" key={r.id}>
          <strong>{r.customer?.name}</strong> — ⭐ {r.rating}
          <p>{r.reviewText}</p>
          <span className="muted">Earned {r.rewardPoints} loyalty points for this review</span>
        </div>
      ))}
    </div>
  );
}
