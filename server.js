const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const notificationRoutes = require('./routes/notificationRoutes');
const { notificationWebSocket } = require('./websockets/notificationSocket');

// Load biến môi trường
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/notifications', notificationRoutes);

// Tạo server HTTP và tích hợp WebSocket
const server = http.createServer(app);
notificationWebSocket(server);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({ error: err.message });
});

// Khởi động server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 Notification Service is running on http://localhost:${PORT}`);
});
