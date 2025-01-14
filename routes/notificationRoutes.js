const express = require('express');
const {
  createNotification,
} = require('../controllers/notificationController');

const router = express.Router();

// Tạo thông báo mới
router.post('/', createNotification);

module.exports = router;
