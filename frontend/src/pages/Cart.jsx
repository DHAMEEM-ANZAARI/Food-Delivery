import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Cart() {
  const { items, restaurantId, restaurantName, updateQuantity, total, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [placing, setPlacing] = useState(false);

  async function checkout() {
    if (!user) { navigate('/login'); return; }
    setError('');
    setPlacing(true);
    try {
      const res = await api.post('/orders', {
        restaurantId,
        orderType: 'DELIVERY',
        items: items.map((i) => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
      });
      clearCart();
      navigate(`/orders/${res.data.id}/track`);
    } catch (err) {
      setError(err.response?.data?.message || 'Checkout failed');
    } finally {
      setPlacing(false);
    }
  }

  if (items.length === 0) {
    return <div className="container"><h2>Your cart is empty</h2></div>;
  }

  return (
    <div className="container">
      <h2>Cart — {restaurantName}</h2>
      {error && <div className="error">{error}</div>}
      {items.map((i) => (
        <div key={i.menuItemId} className="card" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <strong>{i.name}</strong>
            <p className="muted">₹{i.price.toFixed(2)} each</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className="secondary" onClick={() => updateQuantity(i.menuItemId, i.quantity - 1)}>-</button>
            <span>{i.quantity}</span>
            <button className="secondary" onClick={() => updateQuantity(i.menuItemId, i.quantity + 1)}>+</button>
          </div>
        </div>
      ))}
      <h3>Total: ₹{total.toFixed(2)}</h3>
      <button onClick={checkout} disabled={placing}>{placing ? 'Placing order...' : 'Checkout'}</button>
    </div>
  );
}
