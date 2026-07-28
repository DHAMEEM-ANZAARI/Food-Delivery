import React from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { useCart } from './context/CartContext.jsx';

import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Restaurants from './pages/Restaurants.jsx';
import RestaurantDetail from './pages/RestaurantDetail.jsx';
import Cart from './pages/Cart.jsx';
import MyOrders from './pages/MyOrders.jsx';
import OrderTracking from './pages/OrderTracking.jsx';
import MerchantDashboard from './pages/MerchantDashboard.jsx';

function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="container">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return children;
}

export default function App() {
  const { user, logout } = useAuth();
  const { items } = useCart();

  return (
    <div>
      <nav>
        <Link className="brand" to="/">DA </Link>
        <div className="links">
          <Link to="/">Restaurants</Link>
          <Link to="/cart">Cart ({items.length})</Link>
          {user && <Link to="/my-orders">My Orders</Link>}
          {user && user.role === 'restaurant' && <Link to="/dashboard">Dashboard</Link>}
          {user ? (
            <a href="#" onClick={(e) => { e.preventDefault(); logout(); }}>Logout ({user.name})</a>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Restaurants />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/restaurants/:id" element={<RestaurantDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/my-orders" element={<PrivateRoute><MyOrders /></PrivateRoute>} />
        <Route path="/orders/:id/track" element={<PrivateRoute><OrderTracking /></PrivateRoute>} />
        <Route
          path="/dashboard"
          element={<PrivateRoute roles={['restaurant', 'admin']}><MerchantDashboard /></PrivateRoute>}
        />
      </Routes>
    </div>
  );
}
