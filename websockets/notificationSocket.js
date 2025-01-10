const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const activeConnections = new Map();

const notificationWebSocket = (server) => {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', async (ws, req) => {
    const token = req.url.split('?token=')[1]; // Token được gửi kèm trong URL
    console.log(token);
    if (!token) {
      ws.close(4001, 'Authentication token required');
      return;
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.id;
      console.log(userId);

      const userExists = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
      if (userExists.rows.length === 0) {
        ws.close(4001, 'User not found');
        return;
      }

      // Lưu kết nối WebSocket
      activeConnections.set(userId, ws);
      console.log(`🟢 User ${userId} connected to Notification WebSocket`);

      // Gửi thông báo "pending" cho user
      const pendingNotifications = await pool.query(
        `SELECT 
           n.id AS notification_id, 
           n.title, 
           n.content, 
           n.type 
         FROM user_notifications un
         JOIN notifications n ON un.notification_id = n.id
         WHERE un.user_id = $1 AND un.status = $2`,
        [userId, 'pending']
      );

      for (const notification of pendingNotifications.rows) {
        ws.send(JSON.stringify(notification));
      }

      // Đánh dấu các thông báo là "delivered"
      await pool.query(
        'UPDATE user_notifications SET status = $1 WHERE user_id = $2 AND status = $3',
        ['delivered', userId, 'pending']
      );

      ws.on('close', () => {
        activeConnections.delete(userId);
        console.log(`🔴 User ${userId} disconnected`);
      });

    } catch (error) {
      ws.close(4001, 'Invalid or expired token');
    }
  });
};

// Gửi thông báo qua WebSocket
const sendNotificationToUser = async (userId, notification) => {
  const ws = activeConnections.get(userId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(notification));
    console.log(`📩 Notification sent to User ${userId}`);
    return true;
  } else {
    console.log(`❌ Failed to send notification, User ${userId} is not connected`);

    if (!notification.notification_id) {
      console.error('Notification ID is missing. Cannot save to user_notifications.');
      return false;
    }

    // Lưu trạng thái "pending" vào bảng `user_notifications`
    await pool.query(
      'INSERT INTO user_notifications (user_id, notification_id, status) VALUES ($1, $2, $3)',
      [userId, notification.notification_id, 'pending']
    );
    return false;
  }
};


module.exports = { notificationWebSocket, sendNotificationToUser };
