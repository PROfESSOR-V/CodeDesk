import asyncHandler from 'express-async-handler';
import { supabaseAdmin } from '../utils/supabaseClient.js';

// @desc    Get all notes for a user
// @route   GET /api/notes
// @access  Private
export const getNotes = asyncHandler(async (req, res) => {
    const { data, error } = await supabaseAdmin
        .from('notes')
        .select('*')
        .eq('user_id', req.user.id)
        .order('updated_at', { ascending: false });

    if (error) {
        res.status(400);
        throw new Error(error.message);
    }
    res.json(data);
});

// @desc    Create a new note
// @route   POST /api/notes
// @access  Private
export const createNote = asyncHandler(async (req, res) => {
    const { title, content } = req.body;
    if (!title && !content) {
        res.status(400);
        throw new Error('Note cannot be empty.');
    }

    const { data, error } = await supabaseAdmin
        .from('notes')
        .insert([{ user_id: req.user.id, title, content, updated_at: new Date().toISOString() }])
        .select()
        .single();

    if (error) {
        res.status(400);
        throw new Error(error.message);
    }
    res.status(201).json(data);
});

// @desc    Update an existing note
// @route   PUT /api/notes/:id
// @access  Private
export const updateNote = asyncHandler(async (req, res) => {
    const { title, content } = req.body;
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
        .from('notes')
        .update({ title, content, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', req.user.id) // Ensure user can only update their own note
        .select()
        .single();

    if (error) {
        res.status(400);
        throw new Error(error.message);
    }
    res.json(data);
});

// @desc    Delete a note
// @route   DELETE /api/notes/:id
// @access  Private
export const deleteNote = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const { error } = await supabaseAdmin
        .from('notes')
        .delete()
        .eq('id', id)
        .eq('user_id', req.user.id); // Ensure user can only delete their own note

    if (error) {
        res.status(400);
        throw new Error(error.message);
    }
    res.json({ message: 'Note removed' });
});
