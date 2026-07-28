import React, { useEffect, useState } from 'react';
import api from '../api/api';
import socket from '../api/socket';

const NEXT_STATUS = {
  PLACED: 'ACCEPTED',
  ACCEPTED: 'PREPARING',
  PREPARING: 'COURIER_ASSIGNED',
  COURIER_ASSIGNED: 'IN_TRANSIT',
  IN_TRANSIT: 'DELIVERED',
};

export default function MerchantDashboard() {
  const [restaurants, setRestaurants] = useState([]);
  const [selected, setSelected] = useState(null);
  const [orders, setOrders] = useState([]);
  const [newRestaurant, setNewRestaurant] = useState({ name: '', cuisine: '', address: '', lat: '', lng: '' });
  const [newItem, setNewItem] = useState({ name: '', description: '', price: '' });

  useEffect(() => { loadRestaurants(); }, []);

  useEffect(() => {
    if (!selected) return;
    api.get(`/orders/restaurant/${selected.id}`).then((res) => setOrders(res.data));
    socket.emit('join:restaurant', selected.id);

    const onNew = (order) => setOrders((prev) => [order, ...prev]);
    const onStatus = ({ orderId, status }) =>
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));

    socket.on('order:new', onNew);
    socket.on('order:status', onStatus);
    return () => {
      socket.off('order:new', onNew);
      socket.off('order:status', onStatus);
    };
  }, [selected]);

  async function loadRestaurants() {
    const res = await api.get('/restaurants/mine');
    setRestaurants(res.data);
    if (res.data.length > 0) setSelected(res.data[0]);
  }

  async function createRestaurant(e) {
    e.preventDefault();
    const res = await api.post('/restaurants', {
      ...newRestaurant,
      lat: parseFloat(newRestaurant.lat),
      lng: parseFloat(newRestaurant.lng),
    });
    setNewRestaurant({ name: '', cuisine: '', address: '', lat: '', lng: '' });
    await loadRestaurants();
    setSelected(res.data);
  }

  async function addMenuItem(e) {
    e.preventDefault();
    await api.post(`/restaurants/${selected.id}/menu-items`, newItem);
    setNewItem({ name: '', description: '', price: '' });
    const res = await api.get(`/restaurants/${selected.id}`);
    setSelected(res.data);
  }

  async function advanceStatus(order) {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    await api.patch(`/orders/${order.id}/status`, { status: next });
  }

  return (
    <div className="container">
      <h2>Merchant Dashboard</h2>

      {restaurants.length > 1 && (
        <div className="card">
          <label>Select restaurant</label>
          <select
            value={selected?.id || ''}
            onChange={(e) => setSelected(restaurants.find((r) => r.id === Number(e.target.value)))}
          >
            {restaurants.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
      )}

      {!selected && (
        <div className="card">
          <h3>Register your restaurant</h3>
          <form onSubmit={createRestaurant}>
            <label>Name</label>
            <input value={newRestaurant.name} onChange={(e) => setNewRestaurant({ ...newRestaurant, name: e.target.value })} required />
            <label>Cuisine</label>
            <input value={newRestaurant.cuisine} onChange={(e) => setNewRestaurant({ ...newRestaurant, cuisine: e.target.value })} />
            <label>Address</label>
            <input value={newRestaurant.address} onChange={(e) => setNewRestaurant({ ...newRestaurant, address: e.target.value })} />
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label>Latitude</label>
                <input value={newRestaurant.lat} onChange={(e) => setNewRestaurant({ ...newRestaurant, lat: e.target.value })} required />
              </div>
              <div style={{ flex: 1 }}>
                <label>Longitude</label>
                <input value={newRestaurant.lng} onChange={(e) => setNewRestaurant({ ...newRestaurant, lng: e.target.value })} required />
              </div>
            </div>
            <button type="submit">Create restaurant</button>
          </form>
        </div>
      )}

      {selected && (
        <>
          <div className="card">
            <h3>Menu — {selected.name}</h3>
            <div className="grid">
              {selected.menuItems?.map((item) => (
                <div key={item.id} className="card">
                  <strong>{item.name}</strong> — ₹{Number(item.price).toFixed(2)}
                  <p className="muted">{item.isAvailable ? 'Available' : 'Unavailable'}</p>
                </div>
              ))}
            </div>
            <form onSubmit={addMenuItem} style={{ marginTop: 12 }}>
              <label>New item name</label>
              <input value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} required />
              <label>Description</label>
              <input value={newItem.description} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} />
              <label>Price</label>
              <input type="number" step="0.01" value={newItem.price} onChange={(e) => setNewItem({ ...newItem, price: e.target.value })} required />
              <button type="submit">Add menu item</button>
            </form>
          </div>

          <div className="card">
            <h3>Incoming Orders (live)</h3>
            {orders.length === 0 && <p className="muted">No orders yet.</p>}
            {orders.map((o) => (
              <div key={o.id} className="card">
                <strong>Order #{o.id}</strong> — <span className="badge">{o.status}</span>
                <p>₹{Number(o.totalAmount).toFixed(2)}</p>
                <ul>
                  {o.items?.map((it) => (
                    <li key={it.id}>{it.quantity} × {it.menuItem?.name}</li>
                  ))}
                </ul>
                {NEXT_STATUS[o.status] && (
                  <button onClick={() => advanceStatus(o)}>
                    Mark as {NEXT_STATUS[o.status].replace('_', ' ')}
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
