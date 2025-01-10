const pool = require('../config/db');
const { sendNotificationToUser } = require('../websockets/notificationSocket');

exports.createNotification = async (req, res, next) => {
  const { sender_id, content, type, title } = req.body; // Giả sử 'title' bị sai chính tả, cần sửa lại
  console.log(sender_id);
  console.log(content);
  console.log(type);
  console.log(title);
  try {
    // Lưu thông báo vào bảng `notifications` trước
    const notificationResult = await pool.query(
      'INSERT INTO notifications (sender_id, content, type, title) VALUES ($1, $2, $3, $4) RETURNING id',
      [sender_id, content, type, title]
    );

    const notification_id = notificationResult.rows[0].id;
    console.log(notification_id);

    // Lấy danh sách user từ DB
    const usersResult = await pool.query('SELECT id FROM users');
    const receiver_ids = usersResult.rows.map(user => user.id);
    console.log(receiver_ids);

    const failedReceivers = [];
    for (const userId of receiver_ids) {
      const notification = {
        notification_id, // Bổ sung ID thông báo
        title: title,
        content,
        type,
        created_at: new Date(),
      };

      const sent = await sendNotificationToUser(userId, notification);
      if (!sent) {
        failedReceivers.push(userId); // Lưu lại những user không nhận được
      }
    }

    res.status(201).json({
      message: 'Notification processed successfully',
      failedReceivers,
    });
  } catch (err) {
    next(err);
  }
};
