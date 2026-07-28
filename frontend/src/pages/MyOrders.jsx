import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';

export default function MyOrders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    api.get('/orders/mine').then((res) => setOrders(res.data));
  }, []);

  return (
    <div className="container">
      <h2>My Orders</h2>
      {orders.length === 0 && <p className="muted">No orders yet.</p>}
      {orders.map((o) => (
        <div key={o.id} className="card">
          <strong>{o.restaurant?.name}</strong>
          <p className="muted">₹{Number(o.totalAmount).toFixed(2)} · <span className="badge">{o.status}</span></p>
          <Link to={`/orders/${o.id}/track`}>Track order &rarr;</Link>
        </div>
      ))}
    </div>
  );
}
