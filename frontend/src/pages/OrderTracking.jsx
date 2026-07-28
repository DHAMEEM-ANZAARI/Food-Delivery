import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/api';
import socket from '../api/socket';

const STAGES = ['PLACED', 'ACCEPTED', 'PREPARING', 'COURIER_ASSIGNED', 'IN_TRANSIT', 'DELIVERED'];

export default function OrderTracking() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [rewardPoints, setRewardPoints] = useState(null);

  useEffect(() => {
    api.get(`/orders/${id}`).then((res) => setOrder(res.data));

    socket.emit('join:order', id);
    const onStatus = (payload) => {
      if (String(payload.orderId) === String(id)) {
        setOrder((prev) => (prev ? { ...prev, status: payload.status } : prev));
      }
    };
    socket.on('order:status', onStatus);
    return () => socket.off('order:status', onStatus);
  }, [id]);

  useEffect(() => {
    if (order?.status === 'DELIVERED' && order.restaurantId) {
      api.get('/reviews/suggestions', { params: { restaurantId: order.restaurantId } })
        .then((res) => setSuggestions(res.data.suggestions));
    }
  }, [order?.status]);

  async function submitReview(e) {
    e.preventDefault();
    const res = await api.post('/reviews', { orderId: id, rating, reviewText });
    setRewardPoints(res.data.rewardPoints);
    setReviewSubmitted(true);
  }

  if (!order) return <div className="container">Loading...</div>;

  const currentIndex = STAGES.indexOf(order.status);

  return (
    <div className="container">
      <h2>Order #{order.id}</h2>
      <p className="muted">{order.restaurant?.name}</p>

      <div className="card">
        {STAGES.map((stage, idx) => (
          <div key={stage} style={{ opacity: idx <= currentIndex ? 1 : 0.35, marginBottom: 6 }}>
            {idx <= currentIndex ? '✅' : '⬜️'} {stage.replace('_', ' ')}
          </div>
        ))}
        {order.status === 'CANCELLED' && <p className="error">This order was cancelled.</p>}
      </div>

      {order.status === 'DELIVERED' && !reviewSubmitted && (
        <div className="card">
          <h3>Leave a review</h3>
          <p className="muted">
            Suggested keywords to help write a detailed review: {suggestions.join(', ')}
          </p>
          <form onSubmit={submitReview}>
            <label>Rating</label>
            <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
              {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} stars</option>)}
            </select>
            <label>Review</label>
            <textarea rows={4} value={reviewText} onChange={(e) => setReviewText(e.target.value)} />
            <button type="submit">Submit review</button>
          </form>
        </div>
      )}

      {reviewSubmitted && (
        <div className="card">
          🎉 Thanks! You earned <strong>{rewardPoints}</strong> loyalty points for this review.
        </div>
      )}
    </div>
  );
}
