import { Router } from 'express';
import { login, changePassword, getMe } from '../controllers/auth.controller.js';
import auth from '../middleware/auth.js';

const router = Router();

router.post('/login', login);
router.put('/change-password', auth, changePassword);
router.get('/me', auth, getMe);

export default router;
