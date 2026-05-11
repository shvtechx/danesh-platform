'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, BookOpen, Award, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreateSkillModal } from './CreateSkillModal';

interface Skill {
  id: string;
  code: string;
  name: string;
  nameFA?: string;
  gradeLevel?: number;
  gradeBandMin?: string;
  gradeBandMax?: string;
  subjectCode?: string;
  description?: string;
  subject?: {
    id: string;
    code: string;
    name: string;
    nameFA?: string;
  };
}

interface SkillSelectorProps {
  onSelect: (skillId: string) => void;
  onCancel: () => void;
  prefilterSubject?: string;
  prefilterGrade?: number;
  title?: string;
  description?: string;
}

export function SkillSelector({
  onSelect,
  onCancel,
  prefilterSubject,
  prefilterGrade,
  title = 'Select Skill',
  description = 'Choose the skill this content should be linked to',
}: SkillSelectorProps) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [filteredSkills, setFilteredSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSkills();
  }, []);

  useEffect(() => {
    // Filter skills based on search query
    if (searchQuery.trim() === '') {
      setFilteredSkills(skills);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = skills.filter(
        (skill) =>
          skill.name.toLowerCase().includes(query) ||
          skill.nameFA?.includes(searchQuery) ||
          skill.code.toLowerCase().includes(query) ||
          (skill.subjectCode && skill.subjectCode.toLowerCase().includes(query))
      );
      setFilteredSkills(filtered);
    }
  }, [searchQuery, skills]);

  useEffect(() => {
    // Auto-select best match based on prefilters
    if (skills.length > 0 && !selectedSkill) {
      const bestMatch = findBestMatch();
      if (bestMatch) {
        setSelectedSkill(bestMatch);
      }
    }
  }, [skills, prefilterSubject, prefilterGrade]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSkills = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (prefilterSubject) params.append('subject', prefilterSubject);
      if (prefilterGrade) params.append('gradeLevel', prefilterGrade.toString());

      const res = await fetch(`/api/v1/skills?${params}`);
      if (!res.ok) throw new Error('Failed to fetch skills');

      const data = await res.json();
      const skillsData = data.skills || data.items || data || [];
      setSkills(skillsData);
      setFilteredSkills(skillsData);
    } catch (error) {
      console.error('Error fetching skills:', error);
      setSkills([]);
      setFilteredSkills([]);
    } finally {
      setLoading(false);
    }
  };

  const findBestMatch = (): Skill | null => {
    // Priority 1: Exact subject and grade match
    if (prefilterSubject && prefilterGrade) {
      const exactMatch = skills.find(
        (s) => (s.subject?.code === prefilterSubject || s.subjectCode === prefilterSubject) && 
               s.gradeLevel === prefilterGrade
      );
      if (exactMatch) return exactMatch;
    }

    // Priority 2: Subject match only
    if (prefilterSubject) {
      const subjectMatch = skills.find(
        (s) => s.subject?.code === prefilterSubject || s.subjectCode === prefilterSubject
      );
      if (subjectMatch) return subjectMatch;
    }

    // Priority 3: Grade match only
    if (prefilterGrade) {
      const gradeMatch = skills.find((s) => s.gradeLevel === prefilterGrade);
      if (gradeMatch) return gradeMatch;
    }

    // Priority 4: First skill in the list
    return skills[0] || null;
  };

  const handleSelectSkill = (skill: Skill) => {
    setSelectedSkill(skill);
    setIsDropdownOpen(false);
    setSearchQuery('');
  };

  const handleConfirm = () => {
    if (selectedSkill) {
      onSelect(selectedSkill.id);
    }
  };

  const handleSkillCreated = async (skillId: string) => {
    // Refresh skills list to include the new skill
    await fetchSkills();
    
    // Find and select the newly created skill
    const newSkill = skills.find(s => s.id === skillId);
    if (newSkill) {
      setSelectedSkill(newSkill);
    }
    
    setShowCreateModal(false);
  };

  const getMatchReason = (skill: Skill): string => {
    const reasons: string[] = [];
    const skillSubjectCode = skill.subject?.code || skill.subjectCode;
    
    if (prefilterSubject && skillSubjectCode === prefilterSubject) {
      reasons.push('Subject match');
    }
    if (prefilterGrade && skill.gradeLevel === prefilterGrade) {
      reasons.push(`Grade ${prefilterGrade}`);
    }
    return reasons.length > 0 ? reasons.join(' • ') : '';
  };

  return (
    <>
      {/* Create Skill Modal */}
      {showCreateModal && (
        <CreateSkillModal
          onSuccess={handleSkillCreated}
          onCancel={() => setShowCreateModal(false)}
          prefilterSubject={prefilterSubject}
          prefilterGrade={prefilterGrade}
        />
      )}

      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                {title}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {description}
              </p>
            </div>
            <button
              onClick={onCancel}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {prefilterSubject && (
            <div className="mt-4 flex flex-wrap gap-2">
              {prefilterSubject && (
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm">
                  Subject: {prefilterSubject}
                </span>
              )}
              {prefilterGrade && (
                <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm">
                  Grade: {prefilterGrade}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
              <p className="text-slate-600 dark:text-slate-400">Loading skills...</p>
            </div>
          ) : (
            <>
              {/* Search/Dropdown Combo */}
              <div className="mb-4 relative" ref={dropdownRef}>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Selected Skill {selectedSkill && '✓'}
                </label>
                <div
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full p-4 border-2 border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 cursor-pointer hover:border-emerald-500 transition-colors"
                >
                  {selectedSkill ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {selectedSkill.name}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          {selectedSkill.code}
                          {selectedSkill.gradeLevel && ` • Grade ${selectedSkill.gradeLevel}`}
                          {!selectedSkill.gradeLevel && selectedSkill.gradeBandMin && selectedSkill.gradeBandMax && 
                            ` • ${selectedSkill.gradeBandMin} to ${selectedSkill.gradeBandMax}`
                          }
                          {(selectedSkill.subject?.code || selectedSkill.subjectCode) && 
                            ` • ${selectedSkill.subject?.code || selectedSkill.subjectCode}`
                          }
                        </div>
                        {getMatchReason(selectedSkill) && (
                          <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                            <Award className="h-3 w-3" />
                            {getMatchReason(selectedSkill)} (Auto-selected)
                          </div>
                        )}
                      </div>
                      <ChevronDown
                        className={`h-5 w-5 text-slate-400 transition-transform ${
                          isDropdownOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Click to select a skill...</span>
                      <ChevronDown className="h-5 w-5" />
                    </div>
                  )}
                </div>

                {/* Dropdown */}
                {isDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-10 max-h-80 flex flex-col">
                    {/* Search inside dropdown */}
                    <div className="p-3 border-b border-slate-200 dark:border-slate-700">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search skills..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>

                    {/* Skills list */}
                    <div className="overflow-y-auto">
                      {filteredSkills.length === 0 ? (
                        <div className="p-6 text-center text-slate-500">
                          {searchQuery
                            ? 'No skills match your search'
                            : 'No skills available'}
                        </div>
                      ) : (
                        filteredSkills.map((skill) => {
                          const matchReason = getMatchReason(skill);
                          const isSelected = selectedSkill?.id === skill.id;

                          return (
                            <div
                              key={skill.id}
                              onClick={() => handleSelectSkill(skill)}
                              className={`p-4 border-b border-slate-100 dark:border-slate-700 cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors ${
                                isSelected
                                  ? 'bg-emerald-50 dark:bg-emerald-900/20'
                                  : ''
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <BookOpen className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-slate-900 dark:text-white">
                                    {skill.name}
                                    {isSelected && (
                                      <span className="ml-2 text-emerald-600">✓</span>
                                    )}
                                  </div>
                                  {skill.nameFA && (
                                    <div
                                      className="text-sm text-slate-600 dark:text-slate-400 mt-0.5 font-vazirmatn"
                                      dir="rtl"
                                    >
                                      {skill.nameFA}
                                    </div>
                                  )}
                                  <div className="flex flex-wrap gap-2 mt-2 text-xs">
                                    <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded">
                                      {skill.code}
                                    </span>
                                    {skill.gradeLevel && (
                                      <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
                                        Grade {skill.gradeLevel}
                                      </span>
                                    )}
                                    {!skill.gradeLevel && skill.gradeBandMin && skill.gradeBandMax && (
                                      <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
                                        {skill.gradeBandMin} to {skill.gradeBandMax}
                                      </span>
                                    )}
                                    {(skill.subject?.code || skill.subjectCode) && (
                                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                                        {skill.subject?.name || skill.subjectCode}
                                      </span>
                                    )}
                                  </div>
                                  {matchReason && (
                                    <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1">
                                      <Award className="h-3 w-3" />
                                      Recommended: {matchReason}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Create New Skill Option */}
              <div className="mt-4 p-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                  Can't find the right skill?
                </p>
                <Button
                  onClick={() => setShowCreateModal(true)}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Create New Skill
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex gap-3 justify-end">
          <Button onClick={onCancel} variant="outline">
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedSkill}
            className="bg-gradient-to-r from-emerald-500 to-teal-600"
          >
            Confirm Selection
          </Button>
        </div>
      </div>
    </div>
    </>
  );
}
