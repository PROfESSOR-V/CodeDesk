import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaStickyNote, FaBookmark, FaTrash, FaArrowLeft } from 'react-icons/fa'; // 1. Import the back arrow icon
import { useNavigate } from 'react-router-dom'; // 2. Import useNavigate
import Sidebar from '../components/Sidebar.jsx';

const MyWorkspace = () => {
    const [notes, setNotes] = useState([]);
    const [savedSheets, setSavedSheets] = useState([]);
    const [newNote, setNewNote] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const navigate = useNavigate(); // 3. Initialize the navigate function

    const API_URL = import.meta.env.VITE_API_URL;

    // Helper function to get the auth token from localStorage
    const getAuthToken = () => {
        const authDataString = localStorage.getItem('codedesk_auth');
        if (!authDataString) {
            console.error("Auth data not found in localStorage.");
            return null;
        }
        try {
            const authData = JSON.parse(authDataString);
            return authData.access_token || null;
        } catch (e) {
            console.error("Failed to parse auth data from localStorage", e);
            return null;
        }
    };

    useEffect(() => {
        const fetchWorkspaceData = async () => {
            const token = getAuthToken();
            if (!token) {
                setError("Authentication failed. Please log in again.");
                setLoading(false);
                return;
            }

            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const { data } = await axios.get(`${API_URL}/api/workspace`, config);
                setNotes(data.notes || []);
                setSavedSheets(data.savedSheets || []);
            } catch (err) {
                setError('Failed to fetch workspace data. Please try again.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchWorkspaceData();
    }, [API_URL]);

    const handleCreateNote = async (e) => {
        e.preventDefault();
        if (!newNote.trim()) return;
        const token = getAuthToken();
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
    
    const handleDeleteNote = async (noteId) => {
        if (!window.confirm("Are you sure you want to delete this note?")) return;
        const token = getAuthToken();
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
        <div className="flex bg-gray-50 min-h-screen">
            <Sidebar open={sidebarOpen} />
            
            <main className={`flex-1 p-4 sm:p-6 lg:p-8 transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-16"}`}>
                <div className="max-w-7xl mx-auto">
                    {/* 4. Updated header with Back Button */}
                    <header className="mb-8">
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => navigate(-1)} 
                                className="p-2 rounded-full hover:bg-gray-200 transition text-gray-600"
                                aria-label="Go back"
                            >
                                <FaArrowLeft size={20} />
                            </button>
                            <div>
                                <h1 className="text-3xl md:text-4xl font-bold text-gray-800">My Workspace</h1>
                                <p className="mt-1 text-gray-600">Your central hub for notes and saved sheets.</p>
                            </div>
                        </div>
                    </header>

                    {loading && (
                        <div className="text-center py-12 text-gray-500">
                            <p>Loading your workspace...</p>
                        </div>
                    )}

                    {error && (
                        <div className="text-center py-12 text-red-600 bg-red-100 p-4 rounded-lg">
                            <p>{error}</p>
                        </div>
                    )}

                    {!loading && !error && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Notes Section */}
                            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                                <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-3">
                                    <FaStickyNote className="text-yellow-500" />
                                    My Notes
                                </h2>
                                <form onSubmit={handleCreateNote} className="mb-6">
                                    <textarea
                                        className="w-full p-3 bg-gray-100 text-gray-800 rounded-lg border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                                        rows="4"
                                        placeholder="Jot down a quick thought..."
                                        value={newNote}
                                        onChange={(e) => setNewNote(e.target.value)}
                                    ></textarea>
                                    <button type="submit" className="mt-3 w-full px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-transform transform hover:scale-105">
                                        Save Note
                                    </button>
                                </form>
                                <div className="space-y-4 max-h-[30rem] overflow-y-auto pr-2">
                                    {notes.length > 0 ? (
                                        notes.map(note => (
                                            <div key={note.id} className="bg-gray-50 p-4 rounded-lg flex justify-between items-start group hover:bg-gray-100 transition">
                                                <p className="text-gray-700 whitespace-pre-wrap flex-1">{note.content}</p>
                                                <button onClick={() => handleDeleteNote(note.id)} className="text-gray-400 hover:text-red-500 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-gray-500">
                                            <p>You haven't created any notes yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Saved Sheets Section */}
                            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                                <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-3">
                                    <FaBookmark className="text-indigo-500" />
                                    Saved Sheets
                                </h2>
                                <div className="space-y-4 max-h-[40rem] overflow-y-auto pr-2">
                                    {savedSheets.length > 0 ? (
                                        savedSheets.map(item => (
                                            <div key={item.sheet_id} className="bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition cursor-pointer">
                                                <h3 className="text-lg font-bold text-gray-800">{item.sheets.title}</h3>
                                                <p className="text-gray-600 mt-1">{item.sheets.description}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-gray-500">
                                            <p>You haven't saved any sheets yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default MyWorkspace;
