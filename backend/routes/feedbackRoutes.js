import express from 'express';
const router = express.Router();
import {protect} from '../middleware/authMiddleware.js';
import { getAUserFeedbacks, getUserFeedbacks, userFeedback } from '../controllers/feedbackController.js';

router.post('/',protect, userFeedback);
router.get('/',getUserFeedbacks);
router.get('/getAUserFeedbacks/:userId', getAUserFeedbacks)
export default router;