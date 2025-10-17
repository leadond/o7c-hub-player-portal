import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronDown, X } from "lucide-react";

export default function CommitmentSelect({ value, onChange, label = "Commitment" }) {
  const [ncaaSchools, setNcaaSchools] = useState([]);
  const [filteredSchools, setFilteredSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [manualEntry, setManualEntry] = useState(false);
  const [manualValue, setManualValue] = useState("");

  useEffect(() => {
    loadNcaaSchools();
  }, []);

  useEffect(() => {
    if (ncaaSchools.length > 0) {
      filterSchools(searchValue);
    }
  }, [ncaaSchools, searchValue]);

  const loadNcaaSchools = async () => {
    try {
      setLoading(true);
      const response = await fetch('/ncaaSchools.json');
      const data = await response.json();
      setNcaaSchools(data || []);
      setLoading(false);
    } catch (error) {
      console.error("Error loading NCAA schools:", error);
      setNcaaSchools([]);
      setLoading(false);
    }
  };

  const filterSchools = (query) => {
    if (!query.trim()) {
      setFilteredSchools(ncaaSchools.slice(0, 50)); // Show first 50 when no search
      return;
    }

    const filtered = ncaaSchools.filter(school =>
      school.name.toLowerCase().includes(query.toLowerCase()) ||
      school.abbreviation.toLowerCase().includes(query.toLowerCase()) ||
      school.conference.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 50); // Limit to 50 results

    setFilteredSchools(filtered);
  };

  const handleSelect = (schoolName) => {
    onChange(schoolName);
    setSearchValue("");
    setOpen(false);
    setManualEntry(false);
  };

  const handleManualEntry = () => {
    if (manualValue.trim()) {
      onChange(manualValue.trim());
      setManualValue("");
      setManualEntry(false);
      setOpen(false);
    }
  };

  const handleCancelManual = () => {
    setManualEntry(false);
    setManualValue("");
  };

  const currentValue = value || "";

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="flex gap-2">
        {loading ? (
          <div className="flex-1 p-2 border rounded bg-gray-50">Loading schools...</div>
        ) : manualEntry ? (
          <>
            <Input
              value={manualValue}
              onChange={(e) => setManualValue(e.target.value)}
              placeholder="Enter school name manually"
              autoFocus
              className="flex-1"
            />
            <Button
              onClick={handleManualEntry}
              disabled={!manualValue.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              <Check className="w-4 h-4" />
            </Button>
            <Button
              onClick={handleCancelManual}
              variant="outline"
            >
              <X className="w-4 h-4" />
            </Button>
          </>
        ) : (
          <>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex-1 justify-between h-10 px-3 py-2 text-sm">
                  {currentValue || "Select or search school"}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0">
                <Command>
                  <CommandInput
                    placeholder="Search NCAA schools..."
                    value={searchValue}
                    onValueChange={(value) => {
                      setSearchValue(value);
                      filterSchools(value);
                    }}
                  />
                  <CommandList>
                    <CommandEmpty>
                      No schools found.{" "}
                      <Button
                        variant="link"
                        className="p-0 h-auto text-blue-600"
                        onClick={() => setManualEntry(true)}
                      >
                        Enter manually
                      </Button>
                    </CommandEmpty>
                    <CommandGroup>
                      {filteredSchools.map((school) => (
                        <CommandItem
                          key={school.name}
                          value={school.name}
                          onSelect={() => handleSelect(school.name)}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span>{school.name}</span>
                            <span className="text-xs text-gray-500 ml-2">
                              {school.conference}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <Button
              onClick={() => setManualEntry(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              Manual Entry
            </Button>
          </>
        )}
      </div>
      {currentValue && !manualEntry && (
        <div className="mt-2 flex items-center gap-2">
          <span className="text-sm text-gray-600">Committed to:</span>
          <span className="text-sm font-medium text-gray-900">{currentValue}</span>
          <Button
            onClick={() => onChange("")}
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}
    </div>
  );
}