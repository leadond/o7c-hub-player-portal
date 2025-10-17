import React, { useState, useEffect } from "react";
import { list as listTeams } from "@/api/entities/Team";
import { update as updatePlayer } from "@/api/entities/Player";
import { create as createTeamHistory } from "@/api/entities/TeamHistory";
import { useApi } from "@/hooks/useApi";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Check } from "lucide-react";

export default function QuickTeamAssignment({ player, onUpdate }) {
  const { execute } = useApi();
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedSeason, setSelectedSeason] = useState('');
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      const teamsData = await execute(() => listTeams());
      setTeams(teamsData.filter(t => t.isActive) || []);
    } catch (error) {
      console.error("Error loading teams:", error);
    }
  };

  const handleAssign = async () => {
    if (!selectedTeam || !selectedSeason) {
      alert("Please select both a team and season");
      return;
    }

    const team = teams.find(t => t.id === selectedTeam);
    if (!team) return;

    setAssigning(true);
    try {
      // Update player's current team, age group, and region to match the team
      await execute(() => updatePlayer(player.id, {
        o7cTeam: team.teamName,
        ageGroup: team.ageGroup,
        region: team.region
      }));

      // Create team history record
      await execute(() => createTeamHistory({
        playerId: player.id,
        playerName: `${player.firstName} ${player.lastName}`,
        o7cTeam: team.teamName,
        season: selectedSeason,
        startDate: new Date().toISOString().split('T')[0],
        isCurrent: true
      }));

      if (onUpdate) onUpdate();
      setSelectedTeam('');
      setSelectedSeason('');
    } catch (error) {
      console.error("Error assigning team:", error);
      alert("Failed to assign team");
    }
    setAssigning(false);
  };

  return (
    <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-5 h-5 text-blue-900" />
        <h3 className="text-sm font-bold text-gray-900">Quick Team Assignment</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Select value={selectedTeam} onValueChange={setSelectedTeam}>
          <SelectTrigger>
            <SelectValue placeholder="Select Team" />
          </SelectTrigger>
          <SelectContent>
            {teams.map(team => (
              <SelectItem key={team.id} value={team.id}>
                {team.teamName} - {team.ageGroup}
                {team.region && ` (${team.region})`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedSeason} onValueChange={setSelectedSeason}>
          <SelectTrigger>
            <SelectValue placeholder="Season" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Spring 2025">Spring 2025</SelectItem>
            <SelectItem value="Summer 2025">Summer 2025</SelectItem>
            <SelectItem value="Fall 2025">Fall 2025</SelectItem>
            <SelectItem value="Winter 2025">Winter 2025</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button
        onClick={handleAssign}
        disabled={assigning || !selectedTeam || !selectedSeason}
        className="w-full mt-3 bg-gradient-to-r from-blue-900 to-blue-700"
        size="sm"
      >
        {assigning ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            Assigning...
          </>
        ) : (
          <>
            <Check className="w-4 h-4 mr-2" />
            Assign to Team
          </>
        )}
      </Button>
    </div>
  );
}