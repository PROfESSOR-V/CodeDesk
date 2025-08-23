import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { supabase } from '../supabaseClient';
import { FaStickyNote, FaBookmark, FaTrash, FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';

const MyWorkspace = () => {
    const [notes, setNotes] = useState([]);
    const [savedSheets, setSavedSheets] = useState([]);
    const [newNote, setNewNote] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

	const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

    // Helper to get a valid bearer token from Supabase session (fallback to storage parsing)
    const getAuthToken = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.access_token) return session.access_token;
        } catch (_) {}
        try {
            const authDataString = localStorage.getItem('codedesk_auth');
            if (!authDataString) return null;
            const parsed = JSON.parse(authDataString);
            return parsed?.currentSession?.access_token || parsed?.access_token || null;
        } catch (_) {
            return null;
        }
    };

    // Fetch workspace data (notes + saved sheets)
    useEffect(() => {
        const fetchWorkspaceData = async () => {
            const token = await getAuthToken();
            if (!token) {
                setError("Authentication failed. Please log in again.");
                setLoading(false);
                return;
            }

            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const res = await axios.get(`${API_URL}/api/workspace`, config);
                setNotes(res.data?.notes || []);
                setSavedSheets(res.data?.savedSheets || []);
            } catch (err) {
                const status = err?.response?.status;
                const serverMsg = err?.response?.data?.message || err?.response?.data?.error;
                const msg = status === 401
                    ? 'Authentication failed. Please log in again.'
                    : (serverMsg || 'Failed to fetch workspace data. Please try again.');
                setError(msg);
                console.error('GET /api/workspace failed', { status, serverMsg, err });
            } finally {
                setLoading(false);
            }
        };

        fetchWorkspaceData();
    }, [API_URL]);

    // Handle note creation
    const handleCreateNote = async (e) => {
        e.preventDefault();
        if (!newNote.trim()) return;

        const token = await getAuthToken();
        if (!token) { setError("Authentication failed."); return; }

        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const { data: createdNote } = await axios.post(`${API_URL}/api/workspace/notes`, { content: newNote }, config);
            setNotes([createdNote, ...notes]);
            setNewNote('');
        } catch (err) {
            setError('Failed to create note.');
        }
    };

    // Handle note deletion
    const handleDeleteNote = async (noteId) => {
        if (!window.confirm("Are you sure you want to delete this note?")) return;
        const token = await getAuthToken();
        if (!token) { setError("Authentication failed."); return; }

        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.delete(`${API_URL}/api/workspace/notes/${noteId}`, config);
            setNotes(notes.filter(note => note.id !== noteId));
        } catch (err) {
            setError('Failed to delete note.');
        }
    };

    return (
        <DashboardLayout>
            <main>
                <div className="max-w-7xl mx-auto">
                    {/* Header with Back Button */}
                    <header className="mb-8">
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => navigate(-1)} 
                                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition text-gray-600 dark:text-gray-300"
                                aria-label="Go back"
                            >
                                <FaArrowLeft size={20} />
                            </button>
                            <div>
                                <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-100">My Workspace</h1>
                                <p className="mt-1 text-gray-600 dark:text-gray-300">Your central hub for notes and saved sheets.</p>
                            </div>
                        </div>
                    </header>

                    {/* Loading state */}
                    {loading && (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                            <p>Loading your workspace...</p>
                        </div>
                    )}

                    {/* Error state */}
                    {error && (
                        <div className="text-center py-12 text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300 p-4 rounded-lg">
                            <p>{error}</p>
                        </div>
                    )}

                    {/* Workspace content */}
                    {!loading && !error && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            
                            {/* Notes Section */}
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                                <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-3">
                                    <FaStickyNote className="text-yellow-500" />
                                    My Notes
                                </h2>
                                <form onSubmit={handleCreateNote} className="mb-6">
                                    <textarea
                                        className="w-full p-3 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-lg border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                                        rows="4"
                                        placeholder="Jot down a quick thought..."
                                        value={newNote}
                                        onChange={(e) => setNewNote(e.target.value)}
                                    ></textarea>
                                    <button type="submit" className="mt-3 w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-transform transform hover:scale-105">
                                        Save Note
                                    </button>
                                </form>

                                <div className="space-y-4 max-h-[30rem] overflow-y-auto pr-2 scrollbar-thin">
                                    {notes.length > 0 ? (
                                        notes.map(note => (
                                            <div key={note.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg flex justify-between items-start group hover:bg-gray-100 dark:hover:bg-gray-600 transition">
                                                <p className="text-gray-700 dark:text-gray-100 whitespace-pre-wrap flex-1">{note.content}</p>
                                                <button onClick={() => handleDeleteNote(note.id)} className="text-gray-400 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                            <p>You haven't created any notes yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Saved Sheets Section */}
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                                <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-3">
                                    <FaBookmark className="text-indigo-500" />
                                    Saved Sheets
                                </h2>
                                <div className="space-y-4 max-h-[40rem] overflow-y-auto pr-2 scrollbar-thin">
                                    {savedSheets.length > 0 ? (
                                        savedSheets.map(item => (
                                            <div 
                                                key={item.sheet_id}
                                                onClick={() => navigate(`/sheets/${item.sheet_id}`)}
                                                className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition cursor-pointer"
                                            >
                                                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{item.sheets.title}</h3>
                                                <p className="text-gray-600 dark:text-gray-300 mt-1">{item.sheets.description}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                            <p>You haven't saved any sheets yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>
                    )}
                </div>
            </main>
        </DashboardLayout>
    );
};

export default MyWorkspace;