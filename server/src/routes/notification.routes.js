import { Router } from 'express';
import {
  getNotifications,
  getNotificationCount,
  deleteNotification,
} from '../controllers/notification.controller.js';
import auth from '../middleware/auth.js';

const router = Router();

router.use(auth);

router.get('/', getNotifications);
router.get('/count', getNotificationCount);
router.delete('/:id', deleteNotification);

export default router;
