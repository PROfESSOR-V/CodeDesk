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
    const [sidebarOpen, setSidebarOpen] = useState(true);
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

  // -------------------------------
  // 1. State management
  // -------------------------------
  const [notes, setNotes] = useState([]);
  const [savedSheets, setSavedSheets] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate(); // For back navigation


  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // -------------------------------
  // 2. Helper to retrieve auth token
  // -------------------------------
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

  // -------------------------------
  // 3. Fetch workspace data (notes + saved sheets)
  // -------------------------------
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

  // -------------------------------
  // 4. Handle note creation
  // -------------------------------
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

  // -------------------------------
  // 5. Handle note deletion
  // -------------------------------
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

  // -------------------------------
  // 6. JSX
  // -------------------------------
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

    useEffect(() => {
        const fetchWorkspaceData = () => {
            const token = 'mock-token-for-preview';
            if (!token) {
                setError("Authentication failed. Please log in again.");
                setLoading(false);
                return;
            }

            const mockNotes = [
                { id: 1, content: "Review project proposal for Q4." },
                { id: 2, content: "Research new React hooks for state management." }
            ];
            const mockSavedSheets = [
                { sheet_id: 101, sheets: { title: "JavaScript ES6+ Cheatsheet", description: "Quick reference for modern JavaScript syntax and features." } },
                { sheet_id: 102, sheets: { title: "CSS Flexbox & Grid Guide", description: "A guide to building modern, responsive layouts with CSS." } },
                { sheet_id: 103, sheets: { title: "Common Data Structures (DSA)", description: "Visual guide and complexity analysis for common data structures." } },
                { sheet_id: 104, sheets: { title: "React Hooks Quick Guide", description: "Essential information on `useState`, `useEffect`, and other hooks." } },
                { sheet_id: 105, sheets: { title: "Python Flask REST API Guide", description: "A step-by-step guide to building a simple API with Flask." } }
            ];
            
            setTimeout(() => {
                setNotes(mockNotes);
                setSavedSheets(mockSavedSheets);
                setLoading(false);
            }, 1000); 
        };

        fetchWorkspaceData();
    }, []);

    const handleCreateNote = (e) => {
        e.preventDefault();
        if (!newNote.trim()) return;
        const createdNote = { id: Date.now(), content: newNote };
        setNotes([createdNote, ...notes]);
        setNewNote('');
    };
    
    const handleDeleteNote = (noteId) => {
        if (!window.confirm("Are you sure you want to delete this note?")) return;
        setNotes(notes.filter(note => note.id !== noteId));
    };
    
    const handleUnsaveSheet = (sheetId) => {
        if (!window.confirm("Are you sure you want to remove this saved sheet?")) return;
        setSavedSheets(savedSheets.filter(sheet => sheet.sheet_id !== sheetId));
    };

    return (
        <DashboardLayout>
            <main>
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
                                            <div key={item.sheet_id} className="bg-gray-50 p-4 rounded-lg flex justify-between items-center group hover:bg-gray-100 transition">
                                                <div 
                                                    onClick={() => navigate(`/sheets/${item.sheet_id}`)}
                                                    className="flex-1 cursor-pointer"
                                                >
                                                    <h3 className="text-lg font-bold text-gray-800">{item.sheets.title}</h3>
                                                    <p className="text-gray-600 mt-1">{item.sheets.description}</p>
                                                </div>
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation(); 
                                                        handleUnsaveSheet(item.sheet_id);
                                                    }} 
                                                    className="text-gray-400 hover:text-red-500 ml-4 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    aria-label="Remove saved sheet"
                                                >
                                                    <FaTrash />
                                                </button>
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
                  <div key={item.sheet_id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition cursor-pointer">
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
