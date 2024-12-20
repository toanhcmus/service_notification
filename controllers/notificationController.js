const pool = require('../config/db');

// Tạo thông báo
exports.createNotification = async (req, res, next) => {
  const { sender_id, content, type, receiver_ids } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO notifications (sender_id, content, type, receiver_ids) VALUES ($1, $2, $3, $4) RETURNING *',
      [sender_id, content, type, receiver_ids]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// Lấy thông báo của người dùng
exports.getNotificationsForUser = async (req, res, next) => {
  const { userId } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM notifications WHERE $1 = ANY(receiver_ids) ORDER BY created_at DESC',
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

// Đánh dấu thông báo đã đọc
exports.markNotificationAsRead = async (req, res, next) => {
  const { id } = req.params;
  try {
    await pool.query('UPDATE notifications SET is_read = TRUE WHERE id = $1', [id]);
    res.sendStatus(200);
  } catch (err) {
    next(err);
  }
};
