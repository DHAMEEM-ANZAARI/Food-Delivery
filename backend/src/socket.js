const { Server } = require('socket.io');

function initSocket(httpServer, clientOrigin) {
  const io = new Server(httpServer, {
    cors: { origin: clientOrigin, methods: ['GET', 'POST', 'PATCH'] },
  });

  io.on('connection', (socket) => {
    // Client joins rooms so it only receives updates relevant to it:
    // - order_<id> for a consumer tracking a specific order
    // - restaurant_<id> for a merchant dashboard receiving new orders / status changes
    socket.on('join:order', (orderId) => socket.join(`order_${orderId}`));
    socket.on('join:restaurant', (restaurantId) => socket.join(`restaurant_${restaurantId}`));

    socket.on('courier:location', ({ orderId, lat, lng }) => {
      io.to(`order_${orderId}`).emit('courier:location', { orderId, lat, lng });
    });

    socket.on('disconnect', () => {});
  });

  return io;
}

module.exports = initSocket;
