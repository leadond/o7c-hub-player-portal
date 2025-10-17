import React, { useState, useEffect } from "react";
import { TournamentParticipation } from "@/api/entities";
import { Tournament } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Trophy, Calendar, MapPin, Plane, Hotel, Users as UsersIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function TournamentParticipationManager({ player }) {
  const [participations, setParticipations] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [formData, setFormData] = useState({
    tournamentId: "",
    o7cTeam: "",
    attended: true,
    stats: "",
    providesOwnTravel: false,
    providesOwnAccommodations: false,
    flightConfirmation: "",
    flightDetails: "",
    hotelName: "",
    roomNumber: "",
    roommateNames: "",
    travelNotes: ""
  });

  useEffect(() => {
    if (player) {
      loadData();
    }
  }, [player]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [participationData, tournamentData] = await Promise.all([
        TournamentParticipation.filter({ playerId: player.id }),
        Tournament.list("-startDate")
      ]);
      setParticipations(participationData || []);
      setTournaments(tournamentData || []);
      setLoading(false);
    } catch (error) {
      console.error("Error loading data:", error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const selectedTournament = tournaments.find(t => t.id === formData.tournamentId);
      if (!selectedTournament) return;

      const payload = {
        ...formData,
        playerId: player.id,
        playerName: `${player.firstName} ${player.lastName}`,
        tournamentName: selectedTournament.name
      };

      if (editingEntry) {
        await TournamentParticipation.update(editingEntry.id, payload);
      } else {
        await TournamentParticipation.create(payload);
      }

      setShowForm(false);
      setEditingEntry(null);
      setFormData({
        tournamentId: "",
        o7cTeam: "",
        attended: true,
        stats: "",
        providesOwnTravel: false,
        providesOwnAccommodations: false,
        flightConfirmation: "",
        flightDetails: "",
        hotelName: "",
        roomNumber: "",
        roommateNames: "",
        travelNotes: ""
      });
      loadData();
    } catch (error) {
      console.error("Error saving participation:", error);
    }
  };

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setFormData({
      tournamentId: entry.tournamentId,
      o7cTeam: entry.o7cTeam || "",
      attended: entry.attended,
      stats: entry.stats || "",
      providesOwnTravel: entry.providesOwnTravel || false,
      providesOwnAccommodations: entry.providesOwnAccommodations || false,
      flightConfirmation: entry.flightConfirmation || "",
      flightDetails: entry.flightDetails || "",
      hotelName: entry.hotelName || "",
      roomNumber: entry.roomNumber || "",
      roommateNames: entry.roommateNames || "",
      travelNotes: entry.travelNotes || ""
    });
    setShowForm(true);
  };

  const handleDelete = async (entryId) => {
    if (!confirm("Are you sure you want to delete this tournament participation record?")) return;
    
    try {
      await TournamentParticipation.delete(entryId);
      loadData();
    } catch (error) {
      console.error("Error deleting participation:", error);
    }
  };

  const getTournamentDetails = (tournamentId) => {
    return tournaments.find(t => t.id === tournamentId);
  };

  if (loading) {
    return <div className="animate-pulse h-32 bg-gray-100 rounded-xl" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-blue-900" />
          Tournament Participation
        </h3>
        <Button
          onClick={() => {
            setEditingEntry(null);
            setFormData({
              tournamentId: "",
              o7cTeam: player.o7cTeam || "",
              attended: true,
              stats: "",
              providesOwnTravel: false,
              providesOwnAccommodations: false,
              flightConfirmation: "",
              flightDetails: "",
              hotelName: "",
              roomNumber: "",
              roommateNames: "",
              travelNotes: ""
            });
            setShowForm(true);
          }}
          size="sm"
          variant="outline"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Tournament
        </Button>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {participations.map((entry, idx) => {
            const tournament = getTournamentDetails(entry.tournamentId);
            const hasTravelInfo = entry.flightConfirmation || entry.hotelName || entry.roomNumber || entry.roommateNames;
            
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Trophy className="w-5 h-5 text-yellow-500" />
                      <h4 className="font-bold text-gray-900">{entry.tournamentName}</h4>
                      {!entry.attended && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold">
                          Did Not Attend
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                      {entry.o7cTeam && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-900 rounded-full text-xs font-bold">
                          Team: {entry.o7cTeam}
                        </span>
                      )}
                      {tournament && (
                        <>
                          {tournament.startDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(tournament.startDate).toLocaleDateString()}
                              {tournament.endDate && ` - ${new Date(tournament.endDate).toLocaleDateString()}`}
                            </span>
                          )}
                          {tournament.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {tournament.location}
                            </span>
                          )}
                        </>
                      )}
                    </div>

                    {/* Travel & Accommodation Info */}
                    {hasTravelInfo && (
                      <div className="bg-white rounded-lg p-3 mb-3 border border-gray-200">
                        <div className="grid md:grid-cols-2 gap-3 text-sm">
                          {entry.providesOwnTravel && (
                            <div className="flex items-center gap-2 text-blue-900">
                              <Plane className="w-4 h-4" />
                              <span className="font-medium">Provides Own Travel</span>
                            </div>
                          )}
                          {entry.providesOwnAccommodations && (
                            <div className="flex items-center gap-2 text-blue-900">
                              <Hotel className="w-4 h-4" />
                              <span className="font-medium">Provides Own Accommodations</span>
                            </div>
                          )}
                          {!entry.providesOwnTravel && entry.flightConfirmation && (
                            <div className="text-gray-700">
                              <span className="font-medium">Flight:</span> {entry.flightConfirmation}
                            </div>
                          )}
                          {!entry.providesOwnAccommodations && entry.hotelName && (
                            <div className="text-gray-700">
                              <span className="font-medium">Hotel:</span> {entry.hotelName}
                            </div>
                          )}
                          {!entry.providesOwnAccommodations && entry.roomNumber && (
                            <div className="text-gray-700">
                              <span className="font-medium">Room:</span> {entry.roomNumber}
                            </div>
                          )}
                          {!entry.providesOwnAccommodations && entry.roommateNames && (
                            <div className="text-gray-700">
                              <span className="font-medium">Roommates:</span> {entry.roommateNames}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {entry.stats && (
                      <p className="text-sm text-gray-600 bg-white rounded p-2 mt-2">
                        <span className="font-medium">Stats/Notes:</span> {entry.stats}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(entry)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(entry.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {participations.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-xl">
          <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 text-sm">No tournament participation recorded yet</p>
        </div>
      )}

      {/* Tournament Participation Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEntry ? "Edit Tournament Participation" : "Add Tournament Participation"}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="travel">Travel</TabsTrigger>
                <TabsTrigger value="accommodations">Accommodations</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tournament *</label>
                  <Select
                    value={formData.tournamentId}
                    onValueChange={(value) => setFormData({ ...formData, tournamentId: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select tournament" />
                    </SelectTrigger>
                    <SelectContent>
                      {tournaments.map(tournament => (
                        <SelectItem key={tournament.id} value={tournament.id}>
                          {tournament.name} ({new Date(tournament.startDate).toLocaleDateString()})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">O7C Team</label>
                  <Input
                    value={formData.o7cTeam}
                    onChange={(e) => setFormData({ ...formData, o7cTeam: e.target.value })}
                    placeholder="Team player was on"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.attended}
                    onChange={(e) => setFormData({ ...formData, attended: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label className="text-sm font-medium text-gray-700">Player attended this tournament</label>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stats/Performance Notes</label>
                  <Textarea
                    value={formData.stats}
                    onChange={(e) => setFormData({ ...formData, stats: e.target.value })}
                    placeholder="Performance stats, highlights, notes..."
                    rows={3}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="travel" className="space-y-4 mt-4">
                <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <input
                    type="checkbox"
                    checked={formData.providesOwnTravel}
                    onChange={(e) => setFormData({ ...formData, providesOwnTravel: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label className="text-sm font-bold text-blue-900">Player provides their own travel</label>
                </div>

                {!formData.providesOwnTravel && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Flight Confirmation Number</label>
                      <Input
                        value={formData.flightConfirmation}
                        onChange={(e) => setFormData({ ...formData, flightConfirmation: e.target.value })}
                        placeholder="e.g., ABC123"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Flight Details</label>
                      <Textarea
                        value={formData.flightDetails}
                        onChange={(e) => setFormData({ ...formData, flightDetails: e.target.value })}
                        placeholder="Departure/arrival times, airline, flight numbers..."
                        rows={3}
                      />
                    </div>
                  </>
                )}
              </TabsContent>
              
              <TabsContent value="accommodations" className="space-y-4 mt-4">
                <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <input
                    type="checkbox"
                    checked={formData.providesOwnAccommodations}
                    onChange={(e) => setFormData({ ...formData, providesOwnAccommodations: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label className="text-sm font-bold text-blue-900">Player provides their own accommodations</label>
                </div>

                {!formData.providesOwnAccommodations && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Hotel Name</label>
                      <Input
                        value={formData.hotelName}
                        onChange={(e) => setFormData({ ...formData, hotelName: e.target.value })}
                        placeholder="e.g., Marriott Downtown"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Room Number</label>
                      <Input
                        value={formData.roomNumber}
                        onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                        placeholder="e.g., 305"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Roommate Names</label>
                      <Input
                        value={formData.roommateNames}
                        onChange={(e) => setFormData({ ...formData, roommateNames: e.target.value })}
                        placeholder="e.g., John Smith, Mike Jones"
                      />
                    </div>
                  </>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Additional Travel Notes</label>
                  <Textarea
                    value={formData.travelNotes}
                    onChange={(e) => setFormData({ ...formData, travelNotes: e.target.value })}
                    placeholder="Any additional travel or accommodation information..."
                    rows={3}
                  />
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-blue-900 to-blue-700">
                {editingEntry ? "Update" : "Add"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}