import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'customer' });
  const [error, setError] = useState('');

  function update(field, value) { setForm((f) => ({ ...f, [field]: value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await register(form.name, form.email, form.password, form.role);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  }

  return (
    <div className="container" style={{ maxWidth: 400 }}>
      <h2>Register</h2>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit} className="card">
        <label>Name</label>
        <input value={form.name} onChange={(e) => update('name', e.target.value)} required />
        <label>Email</label>
        <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required />
        <label>Password</label>
        <input type="password" value={form.password} onChange={(e) => update('password', e.target.value)} required />
        <label>Account type</label>
        <select value={form.role} onChange={(e) => update('role', e.target.value)}>
          <option value="customer">Customer</option>
          <option value="restaurant">Restaurant Partner</option>
          <option value="courier">Delivery Courier</option>
        </select>
        <button type="submit">Create account</button>
      </form>
    </div>
  );
}
