import express from 'express';
import { getNotes, createNote, updateNote, deleteNote } from '../controllers/notesController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes are protected and require a logged-in user
router.use(protect);

router.route('/')
    .get(getNotes)
    .post(createNote);

router.route('/:id')
    .put(updateNote)
    .delete(deleteNote);

export default router;
