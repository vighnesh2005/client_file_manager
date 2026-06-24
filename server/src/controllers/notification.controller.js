import Notification from '../models/Notification.model.js';

export const getNotifications = async (req, res) => {
  const userId = req.user._id;
  const notifications = await Notification.find({ userId, isRead: { $ne: true } })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
  res.json({ success: true, data: notifications });
};

export const getNotificationCount = async (req, res) => {
  const userId = req.user._id;
  const count = await Notification.countDocuments({ userId, isRead: { $ne: true } });
  res.json({ success: true, data: { count } });
};

export const deleteNotification = async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;
  const notification = await Notification.findOneAndDelete({ _id: id, userId });
  if (!notification) throw new AppError('Notification not found', 404);
  res.json({ success: true, message: 'Notification dismissed' });
};
