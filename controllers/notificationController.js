const pool = require('../config/db');
const { sendNotificationToUser } = require('../websockets/notificationSocket');
const axios = require('axios');


const getUsersByRoles = async (roles) => {
  try {
    const response = await axios.post('http://localhost:1001/unauthen/getAccountsByRoles', { roles });
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching users by roles:', error.message);
    throw new Error('Unable to fetch users by roles');
  }
};

const getAllUsers = async () => {
  try {
    const response = await axios.get('http://localhost:1001/unauthen/getAllAccounts');
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching all users:', error.message);
    throw new Error('Unable to fetch all users');
  }
};

exports.createNotification = async (req, res, next) => {
  const { sender_id, content, type, title, receiver_ids, roles } = req.body;

  try {
    // Lưu thông báo vào bảng `notifications`
    const notificationResult = await pool.query(
      'INSERT INTO notifications (sender_id, content, type, title) VALUES ($1, $2, $3, $4) RETURNING id',
      [sender_id, content, type, title]
    );

    const notification_id = notificationResult.rows[0].id;
    let finalReceiverIds = new Set();

    // Nếu `receiver_ids` có trong request, thêm vào danh sách
    if (receiver_ids && receiver_ids.length > 0) {
      receiver_ids.forEach(id => finalReceiverIds.add(id));
    }

    if (roles && roles.length > 0) {
      try {
        const usersByRoles = await getUsersByRoles(roles);
        usersByRoles.forEach(user => finalReceiverIds.add(user.id));
      } catch (error) {
        return res.status(500).json({ error: 'Failed to fetch users by roles' });
      }
    }
    
    // Nếu không có `receiver_ids` và `roles`, gọi API lấy tất cả user
    if (finalReceiverIds.size === 0) {
      try {
        const allUsers = await getAllUsers();
        allUsers.forEach(user => finalReceiverIds.add(user.id));
      } catch (error) {
        return res.status(500).json({ error: 'Failed to fetch all users' });
      }
    }

    // Gửi thông báo đến từng người nhận
    const failedReceivers = [];
    for (const userId of finalReceiverIds) {
      const notification = {
        notification_id,
        title,
        content,
        type,
        created_at: new Date(),
      };

      const sent = await sendNotificationToUser(userId, notification);
      if (!sent) failedReceivers.push(userId);
    }

    res.status(201).json({
      message: 'Notification processed successfully',
      failedReceivers,
    });
  } catch (err) {
    next(err);
  }
};

