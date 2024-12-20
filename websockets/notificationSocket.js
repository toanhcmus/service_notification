const WebSocket = require('ws');

// Lưu các kết nối WebSocket
const activeConnections = new Map();

const notificationWebSocket = (server) => {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', (ws, req) => {
    const userId = req.url.split('?userId=')[1]; // Lấy userId từ query string
    if (userId) {
      activeConnections.set(userId, ws);

      console.log(`🟢 User ${userId} connected to Notification WebSocket`);

      ws.on('close', () => {
        activeConnections.delete(userId);
        console.log(`🔴 User ${userId} disconnected`);
      });
    }
  });
};

// Gửi thông báo qua WebSocket
const sendNotificationToUser = (userId, notification) => {
  const ws = activeConnections.get(userId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(notification));
  }
};

module.exports = { notificationWebSocket, sendNotificationToUser };
