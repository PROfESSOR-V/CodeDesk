// backend/controllers/workspaceController.js
import { supabase } from '../config/supabaseClient.js';

// Get all notes and saved sheets for the logged-in user
export const getWorkspaceData = async (req, res) => {
    const { user } = req; // Assuming auth middleware attaches user object

    try {
        // Fetch notes
        const { data: notes, error: notesError } = await supabase
            .from('notes')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (notesError) throw notesError;

        // Fetch saved sheets (joining with the sheets table to get details)
        const { data: savedSheets, error: sheetsError } = await supabase
            .from('user_saved_sheets')
            .select(`
                sheet_id,
                saved_at,
                sheets (id, title, description) // Adjust fields as needed
            `)
            .eq('user_id', user.id);

        if (sheetsError) throw sheetsError;

        res.status(200).json({ notes, savedSheets });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Create a new note
export const createNote = async (req, res) => {
    const { user } = req;
    const { content } = req.body;

    if (!content) {
        return res.status(400).json({ error: 'Note content cannot be empty.' });
    }

    try {
        const { data, error } = await supabase
            .from('notes')
            .insert([{ content, user_id: user.id }])
            .select();

        if (error) throw error;

        res.status(201).json(data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete a note
export const deleteNote = async (req, res) => {
    const { user } = req;
    const { noteId } = req.params;

    try {
        const { error } = await supabase
            .from('notes')
            .delete()
            .match({ id: noteId, user_id: user.id }); // Ensures user can only delete their own notes

        if (error) throw error;

        res.status(200).json({ message: 'Note deleted successfully.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};