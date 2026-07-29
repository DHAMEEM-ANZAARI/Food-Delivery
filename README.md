<<<<<<< HEAD
# Integrated Food Delivery & Dine-Out Platform

## 1. Prerequisites

- Node.js 18+ (check with `node -v`)
- MySQL 8.0+ running locally (or a remote instance) — MySQL 8 is required for
  `ST_Distance_Sphere` and modern spatial support.
- npm

---

## 2. Set up the database

let Sequelize create everything (easiest):
 Just create an empty database:
   ```sql
   CREATE DATABASE food_delivery CHARACTER SET utf8mb4;
   ```

---

## 3. Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` and fill in your MySQL credentials:
```
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=food_delivery
DB_USER=root
DB_PASSWORD=yourpassword
JWT_SECRET=some_long_random_string
CLIENT_ORIGIN=http://localhost:5173
```

Start the server:
```bash
npm run dev
```
You should see:
```
MySQL connection established.
Database synced.
Server running on http://localhost:5000
```

(Optional but recommended) Seed sample data — one restaurant owner, one
customer, two restaurants, and a few menu items:
```bash
npm run seed
```
This prints two demo logins (password `password123` for both):
- `owner@spicehub.test` — restaurant partner
- `customer@test.com` — customer

---

## 4. Frontend setup

Open a **second terminal**:

```bash
cd frontend
npm install
cp .env.example .env
```

The default `.env` values already point at `http://localhost:5000`, so you
usually don't need to change anything.

Start the dev server:
```bash
npm run dev
```

Visit **http://localhost:5173**.

---

## 5. Project structure

```
backend/
  src/
    config/db.js            Sequelize + MySQL connection
    models/                 Sequelize models (User, Restaurant, MenuItem, Order, OrderItem, Review)
    controllers/             Route handlers / business logic
    routes/                  Express routers
    middleware/auth.js       JWT auth + role-based access control
    socket.js                Socket.io room-based real-time events
    server.js                App entry point
    seed.js                  Sample data loader
  sql/schema.sql             Manual schema (optional, mirrors the Sequelize models)
frontend/
  src/
    api/                     Axios client + Socket.io client
    context/                 AuthContext, CartContext
    pages/                   Login, Register, Restaurants, RestaurantDetail,
                              Cart, MyOrders, OrderTracking, MerchantDashboard
```

## 6. API quick reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | – | Create account |
| POST | `/api/auth/login` | – | Login, returns JWT |
| GET  | `/api/restaurants/nearby?lat=&lng=&radiusKm=&cuisine=` | – | Geospatial search |
| GET  | `/api/restaurants/:id` | – | Restaurant + menu |
| POST | `/api/restaurants` | restaurant | Create restaurant |
| POST | `/api/restaurants/:id/menu-items` | restaurant (owner) | Add menu item |
| POST | `/api/orders` | customer | Place order (atomic transaction) |
| PATCH | `/api/orders/:id/status` | restaurant/courier | Advance order status (emits Socket.io event) |
| GET  | `/api/orders/mine` | any | Customer's order history |
| POST | `/api/reviews` | customer | Submit review (scored + loyalty points awarded) |

## 7. Notes on the MySQL geospatial approach

`restaurants.location` is a native `POINT` column with a `SPATIAL INDEX`.
Nearby search runs:
```sql
SELECT *, ST_Distance_Sphere(location, POINT(:lng, :lat)) AS distanceMeters
FROM restaurants
WHERE ST_Distance_Sphere(location, POINT(:lng, :lat)) <= :radiusMeters
ORDER BY distanceMeters ASC, avg_rating DESC
```
