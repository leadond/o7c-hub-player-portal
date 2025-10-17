import React, { useState, useEffect } from "react";
import { TeamHistory } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, Flag, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function TeamHistoryManager({ player }) {
  const [teamHistory, setTeamHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [formData, setFormData] = useState({
    o7cTeam: "",
    season: "",
    startDate: "",
    endDate: "",
    isCurrent: false,
    notes: ""
  });

  useEffect(() => {
    if (player) {
      loadTeamHistory();
    }
  }, [player]);

  const loadTeamHistory = async () => {
    try {
      setLoading(true);
      const data = await TeamHistory.filter({ playerId: player.id }, "-startDate");
      setTeamHistory(data || []);
      setLoading(false);
    } catch (error) {
      console.error("Error loading team history:", error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        playerId: player.id,
        playerName: `${player.firstName} ${player.lastName}`
      };

      // If marking as current, set all others to not current
      if (formData.isCurrent) {
        const currentEntries = teamHistory.filter(entry => entry.isCurrent);
        for (const entry of currentEntries) {
          await TeamHistory.update(entry.id, { isCurrent: false });
        }
      }

      if (editingEntry) {
        await TeamHistory.update(editingEntry.id, payload);
      } else {
        await TeamHistory.create(payload);
      }

      setShowForm(false);
      setEditingEntry(null);
      setFormData({
        o7cTeam: "",
        season: "",
        startDate: "",
        endDate: "",
        isCurrent: false,
        notes: ""
      });
      loadTeamHistory();
    } catch (error) {
      console.error("Error saving team history:", error);
    }
  };

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setFormData(entry);
    setShowForm(true);
  };

  const handleDelete = async (entryId) => {
    if (!confirm("Are you sure you want to delete this team history entry?")) return;
    
    try {
      await TeamHistory.delete(entryId);
      loadTeamHistory();
    } catch (error) {
      console.error("Error deleting team history:", error);
    }
  };

  if (loading) {
    return <div className="animate-pulse h-32 bg-gray-100 rounded-xl" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Flag className="w-5 h-5 text-blue-900" />
          Team History
        </h3>
        <Button
          onClick={() => {
            setEditingEntry(null);
            setFormData({
              o7cTeam: player.o7cTeam || "",
              season: "",
              startDate: "",
              endDate: "",
              isCurrent: false,
              notes: ""
            });
            setShowForm(true);
          }}
          size="sm"
          variant="outline"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Entry
        </Button>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {teamHistory.map((entry, idx) => (
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
                    <h4 className="font-bold text-gray-900">{entry.o7cTeam}</h4>
                    {entry.isCurrent && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">
                        Current
                      </span>
                    )}
                    <span className="px-2 py-1 bg-blue-100 text-blue-900 rounded-full text-xs font-bold">
                      {entry.season}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {new Date(entry.startDate).toLocaleDateString()}
                      {entry.endDate && ` - ${new Date(entry.endDate).toLocaleDateString()}`}
                      {!entry.endDate && entry.isCurrent && " - Present"}
                    </span>
                  </div>
                  
                  {entry.notes && (
                    <p className="text-sm text-gray-600">{entry.notes}</p>
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
          ))}
        </AnimatePresence>
      </div>

      {teamHistory.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-xl">
          <Flag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 text-sm">No team history recorded yet</p>
        </div>
      )}

      {/* Team History Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingEntry ? "Edit Team History" : "Add Team History"}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">O7C Team *</label>
              <Input
                value={formData.o7cTeam}
                onChange={(e) => setFormData({ ...formData, o7cTeam: e.target.value })}
                placeholder="Team name"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Season *</label>
              <Input
                value={formData.season}
                onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                placeholder="e.g., Spring 2024"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isCurrent}
                onChange={(e) => setFormData({ ...formData, isCurrent: e.target.checked })}
                className="w-4 h-4"
              />
              <label className="text-sm font-medium text-gray-700">This is the player's current team</label>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>
            
            <div className="flex gap-3 justify-end">
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