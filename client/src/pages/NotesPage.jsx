import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import { FaPlus } from 'react-icons/fa';

const NotesPage = () => {
    const [notes, setNotes] = useState([]);
    const [selectedNote, setSelectedNote] = useState(null);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // This helper can be simplified, but it's fine for now.
    

    const getAuthToken = () => {
        const authDataString = localStorage.getItem('codedesk_auth');
        if (!authDataString) {
            console.error("Auth token not found in localStorage.");
            return null;
        }
        try {
            const authData = JSON.parse(authDataString);
            // This handles both direct access_token and the nested session structure
            const token = authData.access_token || authData.currentSession?.access_token || null;
            if (!token) {
                console.error("Token could not be extracted from stored auth data:", authData);
            }
            return token;
        } catch (e) {
            console.error("Failed to parse auth data from localStorage:", e);
            return null;
        }
    };

    const fetchNotes = async () => {
        setLoading(true);
        const token = getAuthToken();
        if (!token) {
            setLoading(false);
            return;
        }
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/notes`, config);
            // REFINEMENT 1: Ensure the response is always an array to prevent crashes.
            setNotes(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to fetch notes:", error);
            setNotes([]); // Set to empty array on error as well.
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotes();
    }, []);

    const handleSelectNote = (note) => {
        setSelectedNote(note);
        setTitle(note.title || '');
        setContent(note.content || '');
    };

    const handleNewNote = () => {
        setSelectedNote(null);
        setTitle('');
        setContent('');
    };

    const handleSaveNote = async () => {
        if (!title.trim()) {
            alert("Title cannot be empty.");
            return;
        }
        setIsSaving(true);
        const token = getAuthToken();
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const noteData = { title, content };

        try {
            if (selectedNote) {
                // Update existing note
                const { data: updatedNote } = await axios.put(`${import.meta.env.VITE_API_URL}/api/notes/${selectedNote.id}`, noteData, config);
                setNotes(notes.map(n => n.id === updatedNote.id ? updatedNote : n));
                // REFINEMENT 2: Keep the selected note in sync with the server response.
                setSelectedNote(updatedNote); 
            } else {
                // Create new note
                const { data: newNote } = await axios.post(`${import.meta.env.VITE_API_URL}/api/notes`, noteData, config);
                setNotes([newNote, ...notes]);
                setSelectedNote(newNote); // Select the newly created note
            }
        } catch (error) {
            console.error("Failed to save note:", error);
            alert("Could not save note.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteNote = async (noteId) => {
        if (!window.confirm("Are you sure you want to delete this note?")) return;
        
        const token = getAuthToken();
        const config = { headers: { Authorization: `Bearer ${token}` } };

        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/notes/${noteId}`, config);
            handleNewNote(); // Clear the editor
            setNotes(notes.filter(n => n.id !== noteId));
        } catch (error) {
            console.error("Failed to delete note:", error);
            alert("Could not delete note.");
        }
    };

    return (
        <DashboardLayout>
            <div className="flex h-[calc(100vh-4rem)] bg-gray-50">
                {/* Notes List Sidebar */}
                <aside className="w-1/3 max-w-xs bg-white border-r p-4 overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-800">My Notes</h2>
                        <button onClick={handleNewNote} className="p-2 rounded-full text-gray-600 hover:bg-gray-200" title="Create new note">
                            <FaPlus />
                        </button>
                    </div>
                    {loading ? <p className="text-gray-500">Loading notes...</p> : (
                        <ul className="space-y-2">
                            {/* REFINEMENT 3: Handle the empty state when no notes exist. */}
                            {notes.length === 0 && (
                                <li className="text-center text-gray-500 p-4">
                                    No notes yet. <br/> Click the '+' to create one!
                                </li>
                            )}
                            {notes.map(note => (
                                <li key={note.id} onClick={() => handleSelectNote(note)}
                                    className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedNote?.id === note.id ? 'bg-indigo-100 text-indigo-800' : 'hover:bg-gray-100'}`}>
                                    <h3 className="font-semibold truncate">{note.title || 'Untitled Note'}</h3>
                                    <p className="text-sm text-gray-500 truncate mt-1">{note.content || 'No content'}</p>
                                </li>
                            ))}
                        </ul>
                    )}
                </aside>

                {/* Main Editor */}
                <main className="flex-1 p-6 flex flex-col">
                    <input
                        type="text"
                        placeholder="Note Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="text-2xl font-bold p-2 mb-4 bg-transparent border-b-2 border-gray-200 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                    <textarea
                        placeholder="Start writing your note here..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="flex-1 p-2 bg-transparent resize-none focus:outline-none text-gray-700 leading-relaxed"
                    />
                    <div className="flex justify-end items-center mt-4 gap-4">
                        {selectedNote && (
                             <button onClick={() => handleDeleteNote(selectedNote.id)} className="text-red-500 hover:text-red-700 font-semibold px-4 py-2 rounded-lg hover:bg-red-50">
                                 Delete
                             </button>
                        )}
                        <button onClick={handleSaveNote} disabled={isSaving || !title} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed">
                            {isSaving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </main>
            </div>
        </DashboardLayout>
    );
};

export default NotesPage;