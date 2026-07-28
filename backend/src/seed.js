require('dotenv').config();
const bcrypt = require('bcryptjs');
const sequelize = require('./config/db');
const { User, Restaurant, MenuItem } = require('./models');

async function seed() {
  await sequelize.sync({ alter: true });

  const password = await bcrypt.hash('password123', 10);

  const [owner] = await User.findOrCreate({
    where: { email: 'owner@spicehub.test' },
    defaults: { name: 'Spice Hub Owner', password, role: 'restaurant' },
  });

  const [customer] = await User.findOrCreate({
    where: { email: 'customer@test.com' },
    defaults: { name: 'Test Customer', password, role: 'customer' },
  });

  const [r1] = await Restaurant.findOrCreate({
    where: { name: 'Spice Hub' },
    defaults: {
      ownerId: owner.id,
      cuisine: 'South Indian',
      description: 'Authentic South Indian meals and tiffin.',
      address: 'Salem, Tamil Nadu',
      location: { type: 'Point', coordinates: [78.1460, 11.6643] }, // lng, lat (Salem)
    },
  });

  const [r2] = await Restaurant.findOrCreate({
    where: { name: 'Urban Bites' },
    defaults: {
      ownerId: owner.id,
      cuisine: 'Continental',
      description: 'Burgers, pasta, and wraps.',
      address: 'Salem, Tamil Nadu',
      location: { type: 'Point', coordinates: [78.1600, 11.6700] },
    },
  });

  await MenuItem.findOrCreate({
    where: { name: 'Masala Dosa', restaurantId: r1.id },
    defaults: { restaurantId: r1.id, description: 'Crispy rice crepe with potato filling', price: 60 },
  });
  await MenuItem.findOrCreate({
    where: { name: 'Idli Sambar (4 pcs)', restaurantId: r1.id },
    defaults: { restaurantId: r1.id, description: 'Steamed rice cakes with sambar', price: 50 },
  });
  await MenuItem.findOrCreate({
    where: { name: 'Classic Cheeseburger', restaurantId: r2.id },
    defaults: { restaurantId: r2.id, description: 'Beef-free patty, cheddar, house sauce', price: 150 },
  });

  console.log('Seed complete.');
  console.log('Restaurant owner login: owner@spicehub.test / password123');
  console.log('Customer login: customer@test.com / password123');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
