import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['new_request', 'new_response'],
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  link: {
    type: String,
    default: '',
  },
  isRead: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
