import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';

// Default fallback coordinates (Salem, Tamil Nadu) used if geolocation is unavailable.
const DEFAULT_COORDS = { lat: 11.6643, lng: 78.1460 };

export default function Restaurants() {
  const [coords, setCoords] = useState(DEFAULT_COORDS);
  const [radiusKm, setRadiusKm] = useState(10);
  const [cuisine, setCuisine] = useState('');
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {} // silently fall back to default coords
      );
    }
  }, []);

  async function search() {
    setLoading(true);
    try {
      const res = await api.get('/restaurants/nearby', {
        params: { lat: coords.lat, lng: coords.lng, radiusKm, cuisine: cuisine || undefined },
      });
      setRestaurants(res.data.restaurants);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { search(); /* eslint-disable-next-line */ }, [coords]);

  return (
    <div className="container">
      <h2>Restaurants near you</h2>
      <div className="card">
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label>Cuisine (optional)</label>
            <input value={cuisine} onChange={(e) => setCuisine(e.target.value)} placeholder="e.g. South Indian" />
          </div>
          <div style={{ flex: 1 }}>
            <label>Radius (km)</label>
            <input type="number" value={radiusKm} onChange={(e) => setRadiusKm(e.target.value)} />
          </div>
        </div>
        <button onClick={search}>Search</button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid">
          {restaurants.map((r) => (
            <Link to={`/restaurants/${r.id}`} key={r.id} className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
              <h3>{r.name}</h3>
              <p className="muted">{r.cuisine} · {r.distanceKm} km away</p>
              <p>⭐ {Number(r.avgRating).toFixed(1)} ({r.ratingCount} reviews)</p>
              {!r.isOpen && <span className="badge">Closed</span>}
            </Link>
          ))}
          {restaurants.length === 0 && <p>No restaurants found in this radius. Try widening the search.</p>}
        </div>
      )}
    </div>
  );
}
