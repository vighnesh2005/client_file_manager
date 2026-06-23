import { Router } from 'express';
import { globalSearch } from '../controllers/search.controller.js';
import auth from '../middleware/auth.js';

const router = Router();

router.use(auth);
router.get('/', globalSearch);

export default router;
