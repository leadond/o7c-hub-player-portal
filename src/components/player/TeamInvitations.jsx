import React, { useState, useEffect } from "react";
import { list as listRecruitingInterests, update as updateRecruitingInterest } from "@/api/entities/RecruitingInterest";
import { update as updatePlayer } from "@/api/entities/Player";
import { create as createTeamHistory } from "@/api/entities/TeamHistory";
import { useApi } from "@/hooks/useApi";
import { Button } from "@/components/ui/button";
import { Users, Check, X, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function TeamInvitations({ playerId, playerName, onTeamJoined }) {
  const { execute } = useApi();
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(null);

  useEffect(() => {
    loadInvitations();
  }, [playerId]);

  const loadInvitations = async () => {
    try {
      const interests = await execute(() => listRecruitingInterests({
        playerId: playerId,
        status: 'Invited'
      }));
      setInvitations(interests || []);
      setLoading(false);
    } catch (error) {
      console.error("Error loading invitations:", error);
      setLoading(false);
    }
  };

  const handleRespond = async (invitationId, accept) => {
    setResponding(invitationId);
    try {
      const invitation = invitations.find(i => i.id === invitationId);
      
      if (accept) {
        // Update interest status
        await execute(() => updateRecruitingInterest(invitationId, {
          status: 'Accepted',
          dateResponded: new Date().toISOString().split('T')[0]
        }));

        // Get current season (you might want to make this dynamic)
        const currentSeason = "Spring 2025";

        // Update player's team
        await execute(() => updatePlayer(playerId, {
          o7cTeam: invitation.teamName
        }));

        // Create team history
        await execute(() => createTeamHistory({
          playerId: playerId,
          playerName: playerName,
          o7cTeam: invitation.teamName,
          season: currentSeason,
          startDate: new Date().toISOString().split('T')[0],
          isCurrent: true
        }));

        if (onTeamJoined) onTeamJoined();
      } else {
        // Update interest status to declined
        await execute(() => updateRecruitingInterest(invitationId, {
          status: 'Declined',
          dateResponded: new Date().toISOString().split('T')[0]
        }));
      }

      loadInvitations();
    } catch (error) {
      console.error("Error responding to invitation:", error);
      alert("Failed to respond to invitation");
    }
    setResponding(null);
  };

  const getPriorityColor = (priority) => {
    const colors = {
      High: "from-red-500 to-red-600",
      Medium: "from-yellow-500 to-yellow-600",
      Low: "from-blue-500 to-blue-600"
    };
    return colors[priority] || colors.Medium;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900" />
      </div>
    );
  }

  if (invitations.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Users className="w-6 h-6 text-blue-900" />
        Team Invitations
      </h3>
      <div className="grid gap-4">
        <AnimatePresence>
          {invitations.map((invitation) => (
            <motion.div
              key={invitation.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`bg-gradient-to-r ${getPriorityColor(invitation.priority)} rounded-2xl shadow-xl p-6 text-white`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-2xl font-bold">{invitation.teamName}</h4>
                    <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold">
                      {invitation.teamAgeGroup}
                    </span>
                    {invitation.priority === 'High' && (
                      <Star className="w-5 h-5 fill-white" />
                    )}
                  </div>
                  <p className="text-white/90 text-sm mb-2">
                    Coach: <span className="font-bold">{invitation.coachName}</span>
                  </p>
                  {invitation.notes && (
                    <p className="text-white/90 text-sm italic">&ldquo;{invitation.notes}&rdquo;</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => handleRespond(invitation.id, true)}
                  disabled={responding === invitation.id}
                  className="flex-1 bg-white text-blue-900 hover:bg-blue-50 font-bold"
                >
                  {responding === invitation.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-900" />
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Accept & Join Team
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => handleRespond(invitation.id, false)}
                  disabled={responding === invitation.id}
                  variant="outline"
                  className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                >
                  <X className="w-4 h-4 mr-2" />
                  Decline
                </Button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}