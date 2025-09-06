import { useState, useEffect } from 'react';
import { Calendar, Clock, Plus } from 'lucide-react';

const CalendarCard = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Mock Google Calendar events for demonstration
  const mockEvents = [
    {
      id: '1',
      summary: 'LeetCode Practice Session',
      start: { dateTime: '2025-08-23T10:00:00' },
      end: { dateTime: '2025-08-23T11:30:00' },
      location: 'Online'
    },
    {
      id: '2',
      summary: 'Code Review Meeting',
      start: { dateTime: '2025-08-23T14:00:00' },
      end: { dateTime: '2025-08-23T15:00:00' },
      location: 'Team Room'
    },
    {
      id: '3',
      summary: 'Algorithm Study Group',
      start: { dateTime: '2025-08-24T16:00:00' },
      end: { dateTime: '2025-08-24T18:00:00' },
      location: 'Library'
    }
  ];

  useEffect(() => {
    // Simulate loading Google Calendar events
    setLoading(true);
    setTimeout(() => {
      setEvents(mockEvents);
      setLoading(false);
    }, 1000);
  }, []);

  const formatTime = (dateTime) => {
    return new Date(dateTime).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (dateTime) => {
    return new Date(dateTime).toLocaleDateString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const connectGoogleCalendar = async () => {
    setLoading(true);
    setError('');
    try {
      // This would normally trigger Google OAuth flow
      console.log('Initiating Google Calendar connection...');
      // Simulate successful connection
      setTimeout(() => {
        setEvents(mockEvents);
        setLoading(false);
      }, 1500);
    } catch (err) {
      setError('Failed to connect to Google Calendar');
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Google Calendar
        </h3>
        <button
          onClick={connectGoogleCalendar}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          {loading ? 'Connecting...' : 'Connect'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading calendar events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 text-sm">No upcoming events</p>
            <p className="text-gray-500 text-xs">Connect your Google Calendar to see your schedule</p>
          </div>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1">
                    {event.summary}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <Clock className="w-3 h-3" />
                    <span>
                      {formatTime(event.start.dateTime)} - {formatTime(event.end.dateTime)}
                    </span>
                  </div>
                  {event.location && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      📍 {event.location}
                    </p>
                  )}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(event.start.dateTime)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {events.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 text-center">
            Showing {events.length} upcoming event{events.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
};

export default CalendarCard;
