import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";

export default function SearchablePlayerSelect({ players, value, onChange, placeholder = "Search for a player..." }) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (value && players) {
      const player = players.find(p => p.id === value);
      setSelectedPlayer(player);
    }
  }, [value, players]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredPlayers = players.filter(player => {
    const searchLower = search.toLowerCase();
    const fullName = `${player.firstName} ${player.lastName}`.toLowerCase();
    const team = (player.o7cTeam || '').toLowerCase();
    const school = (player.highSchool || '').toLowerCase();
    
    return fullName.includes(searchLower) || 
           team.includes(searchLower) || 
           school.includes(searchLower);
  });

  const handleSelect = (player) => {
    setSelectedPlayer(player);
    onChange(player.id);
    setSearch("");
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setSelectedPlayer(null);
    onChange("");
    setSearch("");
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          value={selectedPlayer ? `${selectedPlayer.firstName} ${selectedPlayer.lastName}` : search}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="pl-10 pr-10"
        />
        {selectedPlayer && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-auto">
          {filteredPlayers.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              No players found
            </div>
          ) : (
            filteredPlayers.map((player) => (
              <button
                key={player.id}
                onClick={() => handleSelect(player)}
                className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-0 transition-colors"
              >
                <div className="font-medium text-gray-900">
                  {player.firstName} {player.lastName}
                </div>
                <div className="text-xs text-gray-600 mt-1 flex gap-3">
                  {player.position && <span>Position: {player.position}</span>}
                  {player.class && <span>Class: {player.class}</span>}
                  {player.o7cTeam && <span>Team: {player.o7cTeam}</span>}
                  {player.highSchool && <span>School: {player.highSchool}</span>}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}