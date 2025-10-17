import React, { useState, useEffect } from "react";
import { School } from "@/api/entities";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X, Check, Edit2, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

export default function SchoolSelect({ value, onChange, label = "High School" }) {
  const [allSchools, setAllSchools] = useState([]);
  const [dropdownSchools, setDropdownSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isChangingSchool, setIsChangingSchool] = useState(false);
  const [showAddNew, setShowAddNew] = useState(false);
  const [newSchool, setNewSchool] = useState({ irn: '', name: '', county: '' });
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  const currentSchool = allSchools.find(s => s.irn === value);
  const currentSchoolName = currentSchool ? currentSchool.name : '';
  const currentSchoolCounty = currentSchool ? currentSchool.county : '';

  useEffect(() => {
    loadSchools();
  }, []);

  const loadSchools = async () => {
    try {
      setLoading(true);
      const data = await School.list('name', 10000);
      setAllSchools(data || []);
      setLoading(false);
    } catch (error) {
      console.error("Error loading schools:", error);
      setAllSchools([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (allSchools.length > 0) {
      prepareSortedSchools();
    }
  }, [allSchools, value]);

  const prepareSortedSchools = () => {
    const currentSchool = allSchools.find(s => s.irn === value);
    const currentCounty = currentSchool?.county;

    // Deduplicate by name
    const uniqueSchoolsMap = new Map();
    allSchools.forEach(school => {
      if (!uniqueSchoolsMap.has(school.name)) {
        uniqueSchoolsMap.set(school.name, school);
      }
    });
    const uniqueSchools = Array.from(uniqueSchoolsMap.values());

    // Sort: same county first, then alphabetically
    const sameCountySchools = [];
    const otherSchools = [];

    uniqueSchools.forEach(school => {
      if (school.county && currentCounty && school.county === currentCounty) {
        sameCountySchools.push(school);
      } else {
        otherSchools.push(school);
      }
    });

    sameCountySchools.sort((a, b) => a.name.localeCompare(b.name));
    otherSchools.sort((a, b) => a.name.localeCompare(b.name));

    setDropdownSchools([...sameCountySchools, ...otherSchools]);
  };

  const handleSchoolChange = (irn) => {
    const selectedSchool = allSchools.find(s => s.irn === irn);
    if (selectedSchool) {
      onChange(irn, selectedSchool.name);
      setIsChangingSchool(false);
    }
  };

  const handleAddNewSchool = async () => {
    if (!newSchool.irn.trim() || !newSchool.name.trim()) {
      alert("Both IRN and School Name are required.");
      return;
    }

    setSaving(true);
    try {
      const createdSchool = await School.create(newSchool);
      await loadSchools();
      onChange(createdSchool.irn, createdSchool.name);
      setNewSchool({ irn: '', name: '', county: '' });
      setShowAddNew(false);
      setIsChangingSchool(false);
      setSaving(false);
    } catch (error) {
      console.error("Error adding school:", error);
      alert("Failed to add school. Please try again.");
      setSaving(false);
    }
  };

  const handleCancelAdd = () => {
    setNewSchool({ irn: '', name: '', county: '' });
    setShowAddNew(false);
  };

  // If showing "Add New School" form
  if (showAddNew) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <div className="space-y-2">
          <Input
            id="irn"
            name="irn"
            value={newSchool.irn}
            onChange={(e) => setNewSchool({...newSchool, irn: e.target.value})}
            placeholder="Enter IRN number"
            autoFocus
          />
          <Input
            id="name"
            name="name"
            value={newSchool.name}
            onChange={(e) => setNewSchool({...newSchool, name: e.target.value})}
            placeholder="Enter school name"
          />
          <Input
            id="county"
            name="county"
            value={newSchool.county}
            onChange={(e) => setNewSchool({...newSchool, county: e.target.value})}
            placeholder="Enter county (optional)"
          />
          <div className="flex gap-2">
            <Button
              onClick={handleAddNewSchool}
              disabled={!newSchool.irn.trim() || !newSchool.name.trim() || saving}
              className="bg-green-600 hover:bg-green-700 flex-1"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Add School
                </>
              )}
            </Button>
            <Button
              onClick={handleCancelAdd}
              variant="outline"
              disabled={saving}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // If NOT changing school: show text field with current school name
  if (!isChangingSchool) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <div className="flex gap-2">
          <Input
            value={currentSchoolName}
            readOnly
            className="flex-1 bg-gray-50"
            placeholder="No school selected"
          />
          <Button
            onClick={() => setIsChangingSchool(true)}
            variant="outline"
            className="flex items-center gap-2"
            disabled={loading}
          >
            <Edit2 className="w-4 h-4" />
            Change School
          </Button>
        </div>
        {currentSchoolCounty && (
          <p className="text-xs text-gray-500 mt-1">{currentSchoolCounty} County</p>
        )}
      </div>
    );
  }

  // If changing school: show dropdown
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="flex gap-2">
        {loading ? (
          <div className="flex-1 p-2 border rounded bg-gray-50">Loading schools...</div>
        ) : dropdownSchools.length > 10 ? (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex-1 justify-between h-10 px-3 py-2 text-sm">
                {currentSchoolName || "Select school"}
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0">
              <Command>
                <CommandInput placeholder="Search schools..." />
                <CommandList>
                  <CommandEmpty>No schools found.</CommandEmpty>
                  <CommandGroup>
                    {dropdownSchools.map((school) => (
                      <CommandItem
                        key={school.irn}
                        value={school.name}
                        onSelect={() => {
                          handleSchoolChange(school.irn);
                          setOpen(false);
                        }}
                      >
                        {school.name} {school.county ? `(${school.county})` : ''}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        ) : (
          <Select value={value || ''} onValueChange={handleSchoolChange} disabled={loading}>
            <SelectTrigger id="school" name="school" className="flex-1">
              <SelectValue placeholder={loading ? "Loading schools..." : "Select school"} />
            </SelectTrigger>
            <SelectContent>
              {dropdownSchools.map(school => (
                <SelectItem key={school.irn} value={school.irn}>
                  {school.name} {school.county ? `(${school.county})` : ''}
                </SelectItem>
              ))}
              {dropdownSchools.length === 0 && !loading && (
                <SelectItem value="__none__" disabled>
                  No schools found
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        )}
        <Button
          onClick={() => setShowAddNew(true)}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add New
        </Button>
        <Button
          onClick={() => setIsChangingSchool(false)}
          variant="outline"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}