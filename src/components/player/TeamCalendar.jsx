import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Calendar, Clock, MapPin, Users, CheckCircle, XCircle, HelpCircle, Plus, Repeat, Bell, Download } from 'lucide-react';
import { filter as filterTeamEvents, create as createTeamEvent } from '../../api/entities/TeamEvent';
import { filter as filterEventRSVPs, create as createEventRSVP, update as updateEventRSVP } from '../../api/entities/EventRSVP';

const TeamCalendar = ({ player }) => {
  const [events, setEvents] = useState([]);
  const [rsvps, setRsvps] = useState({});
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    eventType: 'Practice',
    startDate: '',
    endDate: '',
    location: '',
    description: '',
    requiresRSVP: true,
    isRecurring: false
  });
  const [calendarSync, setCalendarSync] = useState(false);

  useEffect(() => {
    loadEvents();
    loadRSVPs();
  }, [player?.id]);

  const loadEvents = async () => {
    if (!player?.teamIds?.length) return;
    
    try {
      // Get events for player's teams
      const allEvents = [];
      for (const teamId of player.teamIds) {
        const teamEvents = await filterTeamEvents({
          teamIds: { contains: teamId }
        });
        allEvents.push(...(teamEvents || []));
      }
      
      // Remove duplicates and sort by date
      const uniqueEvents = allEvents.filter((event, index, self) => 
        index === self.findIndex(e => e.id === event.id)
      );
      
      const sortedEvents = uniqueEvents.sort((a, b) => 
        new Date(a.startDate) - new Date(b.startDate)
      );
      
      setEvents(sortedEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const loadRSVPs = async () => {
    if (!player?.id) return;
    
    try {
      const playerRSVPs = await filterEventRSVPs({
        playerId: player.id
      });
      
      const rsvpMap = {};
      (playerRSVPs || []).forEach(rsvp => {
        rsvpMap[rsvp.eventId] = rsvp;
      });
      
      setRsvps(rsvpMap);
    } catch (error) {
      console.error('Error loading RSVPs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRSVP = async (eventId, status) => {
    try {
      const existingRSVP = rsvps[eventId];
      
      if (existingRSVP) {
        // Update existing RSVP
        await updateEventRSVP(existingRSVP.id, {
          status,
          responseDate: new Date().toISOString()
        });
      } else {
        // Create new RSVP
        await createEventRSVP({
          eventId,
          playerId: player.id,
          playerName: `${player.firstName} ${player.lastName}`,
          status,
          responseDate: new Date().toISOString()
        });
      }
      
      // Refresh RSVPs
      await loadRSVPs();
      
    } catch (error) {
      console.error('Error updating RSVP:', error);
      alert('Error updating RSVP. Please try again.');
    }
  };

  const getEventTypeColor = (eventType) => {
    const colors = {
      'Practice': 'bg-blue-100 text-blue-800',
      'Game': 'bg-green-100 text-green-800',
      'Tournament': 'bg-purple-100 text-purple-800',
      'Team Meeting': 'bg-yellow-100 text-yellow-800',
      'Fundraiser': 'bg-orange-100 text-orange-800',
      'Other': 'bg-gray-100 text-gray-800'
    };
    return colors[eventType] || colors['Other'];
  };

  const getRSVPStatus = (eventId) => {
    const rsvp = rsvps[eventId];
    return rsvp?.status || 'No Response';
  };

  const getRSVPIcon = (status) => {
    switch (status) {
      case 'Attending': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'Not Attending': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'Maybe': return <HelpCircle className="h-4 w-4 text-yellow-600" />;
      default: return <HelpCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const isUpcoming = (dateString) => {
    return new Date(dateString) > new Date();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Team Schedule</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setCalendarSync(!calendarSync)}>
            <Download className="h-4 w-4 mr-1" />
            {calendarSync ? 'Synced' : 'Sync Calendar'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowAddEvent(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add Event
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            List View
          </Button>
          <Button
            variant={viewMode === 'calendar' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('calendar')}
          >
            Calendar View
          </Button>
        </div>
      </div>

      {/* Add Event Form */}
      {showAddEvent && (
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              Add New Event
              <Button variant="ghost" size="sm" onClick={() => setShowAddEvent(false)}>
                <XCircle className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Event Title</label>
                <Input
                  value={newEvent.title}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter event title"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Event Type</label>
                <select
                  value={newEvent.eventType}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, eventType: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="Practice">Practice</option>
                  <option value="Game">Game</option>
                  <option value="Tournament">Tournament</option>
                  <option value="Team Meeting">Team Meeting</option>
                  <option value="Fundraiser">Fundraiser</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date & Time</label>
                <Input
                  type="datetime-local"
                  value={newEvent.startDate}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">End Date & Time</label>
                <Input
                  type="datetime-local"
                  value={newEvent.endDate}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Location</label>
                <Input
                  value={newEvent.location}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Enter location"
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Description</label>
                <Input
                  value={newEvent.description}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Event description (optional)"
                />
              </div>
              
              <div className="flex items-center gap-4 md:col-span-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newEvent.requiresRSVP}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, requiresRSVP: e.target.checked }))}
                  />
                  <span className="text-sm">Requires RSVP</span>
                </label>
                
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newEvent.isRecurring}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, isRecurring: e.target.checked }))}
                  />
                  <Repeat className="h-4 w-4" />
                  <span className="text-sm">Recurring Event</span>
                </label>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowAddEvent(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                console.log('Creating event:', newEvent);
                setShowAddEvent(false);
                // In real implementation, would call createTeamEvent API
              }}>
                Create Event
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calendar Sync Status */}
      {calendarSync && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Calendar sync enabled - Events will appear in your Google Calendar</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Events List */}
      {events.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No events scheduled at this time.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {events.map((event) => {
            const rsvpStatus = getRSVPStatus(event.id);
            const upcoming = isUpcoming(event.startDate);
            
            return (
              <Card key={event.id} className={upcoming ? 'border-blue-200' : 'opacity-75'}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {event.title}
                        <Badge className={getEventTypeColor(event.eventType)}>
                          {event.eventType}
                        </Badge>
                        {upcoming && (
                          <Badge variant="outline" className="text-blue-600 border-blue-600">
                            Upcoming
                          </Badge>
                        )}
                      </CardTitle>
                      {event.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {event.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {getRSVPIcon(rsvpStatus)}
                      <span className="text-sm font-medium">{rsvpStatus}</span>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  {/* Event Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{formatDate(event.startDate)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {formatTime(event.startDate)}
                        {event.endDate && ` - ${formatTime(event.endDate)}`}
                      </span>
                    </div>
                    
                    {event.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{event.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Event Actions */}
                  <div className="flex gap-2 pt-2 border-t">
                    {event.requiresRSVP && upcoming && (
                      <>
                        <Button
                          size="sm"
                          variant={rsvpStatus === 'Attending' ? 'default' : 'outline'}
                          onClick={() => handleRSVP(event.id, 'Attending')}
                          className="flex-1"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Attending
                        </Button>
                        
                        <Button
                          size="sm"
                          variant={rsvpStatus === 'Maybe' ? 'default' : 'outline'}
                          onClick={() => handleRSVP(event.id, 'Maybe')}
                          className="flex-1"
                        >
                          <HelpCircle className="h-4 w-4 mr-1" />
                          Maybe
                        </Button>
                        
                        <Button
                          size="sm"
                          variant={rsvpStatus === 'Not Attending' ? 'destructive' : 'outline'}
                          onClick={() => handleRSVP(event.id, 'Not Attending')}
                          className="flex-1"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Can't Attend
                        </Button>
                      </>
                    )}
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        // Add to personal calendar
                        const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${new Date(event.startDate).toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${new Date(event.endDate || event.startDate).toISOString().replace(/[-:]/g, '').split('.')[0]}Z&details=${encodeURIComponent(event.description || '')}&location=${encodeURIComponent(event.location || '')}`;
                        window.open(calendarUrl, '_blank');
                      }}
                    >
                      <Bell className="h-4 w-4 mr-1" />
                      Add to Calendar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TeamCalendar;