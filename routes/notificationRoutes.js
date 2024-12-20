const express = require('express');
const {
  createNotification,
  getNotificationsForUser,
  markNotificationAsRead,
} = require('../controllers/notificationController');

const router = express.Router();

// Tạo thông báo mới
router.post('/', createNotification);

// Lấy thông báo của người dùng
router.get('/:userId', getNotificationsForUser);

// Đánh dấu thông báo đã đọc
router.put('/:id/read', markNotificationAsRead);

module.exports = router;
