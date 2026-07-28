require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');

const sequelize = require('./config/db');
require('./models'); // load associations

const initSocket = require('./socket');

const authRoutes = require('./routes/authRoutes');
const restaurantRoutes = require('./routes/restaurantRoutes');
const orderRoutes = require('./routes/orderRoutes');
const reviewRoutes = require('./routes/reviewRoutes');

const app = express();
const server = http.createServer(app);

const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
app.use(cors({ origin: clientOrigin }));
app.use(express.json());

const io = initSocket(server, clientOrigin);
app.set('io', io);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);

// Central error handler (fallback)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await sequelize.authenticate();
    console.log('MySQL connection established.');

    // Creates/updates tables to match the models above (includes the SPATIAL POINT column).
    await sequelize.sync({ alter: true });
    console.log('Database synced.');

    server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  } catch (err) {
    console.error('Unable to start server:', err);
    process.exit(1);
  }
}

start();
