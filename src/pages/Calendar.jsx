import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@o7c/shared';
import { Calendar as CalendarIcon, Clock, MapPin } from 'lucide-react';

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Mock events data - replace with actual API call
  const events = [
    {
      id: 1,
      title: 'Team Practice',
      date: '2024-01-15',
      time: '4:00 PM - 6:00 PM',
      location: 'Main Field',
      type: 'practice'
    },
    {
      id: 2,
      title: 'College Scouting Event',
      date: '2024-01-18',
      time: '2:00 PM - 4:00 PM',
      location: 'Conference Room',
      type: 'recruiting'
    },
    {
      id: 3,
      title: 'Tournament Game',
      date: '2024-01-20',
      time: '10:00 AM - 12:00 PM',
      location: 'Away Field',
      type: 'game'
    }
  ];

  const getEventTypeColor = (type) => {
    switch (type) {
      case 'practice':
        return 'bg-blue-100 text-blue-800';
      case 'game':
        return 'bg-green-100 text-green-800';
      case 'recruiting':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Team Calendar</h1>
        <div className="text-sm text-gray-500">
          {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar View */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CalendarIcon className="w-5 h-5 mr-2" />
                Upcoming Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {events.map((event) => (
                  <div key={event.id} className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex-shrink-0">
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEventTypeColor(event.type)}`}>
                        {event.type}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900">{event.title}</h4>
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <Clock className="w-4 h-4 mr-1" />
                        {event.time}
                      </div>
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <MapPin className="w-4 h-4 mr-1" />
                        {event.location}
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-sm text-gray-500">
                      {new Date(event.date).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Events</span>
                  <span className="text-sm font-medium">{events.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Practices</span>
                  <span className="text-sm font-medium">{events.filter(e => e.type === 'practice').length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Games</span>
                  <span className="text-sm font-medium">{events.filter(e => e.type === 'game').length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Recruiting</span>
                  <span className="text-sm font-medium">{events.filter(e => e.type === 'recruiting').length}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
                  Request Time Off
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
                  Schedule Make-up Practice
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
                  Contact Coach
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Calendar;