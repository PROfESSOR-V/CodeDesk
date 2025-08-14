// backend/routes/workspaceRoutes.js
import express from 'express';
import { getWorkspaceData, createNote, deleteNote } from '../controllers/workspaceController.js';
import { protect } from '../middleware/authMiddleware.js'; // Assuming an auth middleware exists

const router = express.Router();

// All routes here are protected and require a logged-in user
router.use(protect);

router.route('/')
    .get(getWorkspaceData);

router.route('/notes')
    .post(createNote);

router.route('/notes/:noteId')
    .delete(deleteNote);

export default router;