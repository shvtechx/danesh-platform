'use client';

import { useState, useEffect } from 'react';
import { X, BookOpen, Save, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Subject {
  id: string;
  code: string;
  name: string;
  nameFA?: string;
}

interface CreateSkillModalProps {
  onSuccess: (skillId: string) => void;
  onCancel: () => void;
  prefilterSubject?: string;
  prefilterGrade?: number;
}

const GRADE_BANDS = [
  { value: 'EARLY_YEARS', label: 'Early Years (Pre-K to K)', labelFA: 'سال‌های اولیه' },
  { value: 'PRIMARY', label: 'Primary (Grades 1-5)', labelFA: 'دوره ابتدایی' },
  { value: 'LOWER_SECONDARY', label: 'Lower Secondary (Grades 6-8)', labelFA: 'دوره راهنمایی' },
  { value: 'UPPER_SECONDARY', label: 'Upper Secondary (Grades 9-12)', labelFA: 'دوره متوسطه' },
];

export function CreateSkillModal({
  onSuccess,
  onCancel,
  prefilterSubject,
  prefilterGrade,
}: CreateSkillModalProps) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    nameFA: '',
    description: '',
    descriptionFA: '',
    subjectId: '',
    gradeBandMin: 'EARLY_YEARS',
    gradeBandMax: 'PRIMARY',
    order: 0,
  });

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    // Auto-select subject if prefiltered
    if (prefilterSubject && subjects.length > 0) {
      const subject = subjects.find(s => s.code === prefilterSubject);
      if (subject) {
        setFormData(prev => ({ ...prev, subjectId: subject.id }));
      }
    }
  }, [prefilterSubject, subjects]);

  useEffect(() => {
    // Auto-select grade band based on prefiltered grade
    if (prefilterGrade) {
      if (prefilterGrade <= 0) {
        setFormData(prev => ({ ...prev, gradeBandMin: 'EARLY_YEARS', gradeBandMax: 'EARLY_YEARS' }));
      } else if (prefilterGrade <= 5) {
        setFormData(prev => ({ ...prev, gradeBandMin: 'PRIMARY', gradeBandMax: 'PRIMARY' }));
      } else if (prefilterGrade <= 8) {
        setFormData(prev => ({ ...prev, gradeBandMin: 'LOWER_SECONDARY', gradeBandMax: 'LOWER_SECONDARY' }));
      } else {
        setFormData(prev => ({ ...prev, gradeBandMin: 'UPPER_SECONDARY', gradeBandMax: 'UPPER_SECONDARY' }));
      }
    }
  }, [prefilterGrade]);

  const fetchSubjects = async () => {
    try {
      const res = await fetch('/api/v1/subjects');
      if (!res.ok) throw new Error('Failed to fetch subjects');
      const data = await res.json();
      setSubjects(data.subjects || data.items || data || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      setError('Failed to load subjects');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.code.trim()) {
      setError('Skill code is required');
      return;
    }
    if (!formData.name.trim()) {
      setError('Skill name is required');
      return;
    }
    if (!formData.subjectId) {
      setError('Please select a subject');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/v1/admin/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create skill');
      }

      const data = await res.json();
      onSuccess(data.skill.id);
    } catch (error: any) {
      console.error('Error creating skill:', error);
      setError(error.message || 'Failed to create skill');
    } finally {
      setLoading(false);
    }
  };

  const generateCode = () => {
    // Auto-generate code from name
    const code = formData.name
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 20);
    setFormData(prev => ({ ...prev, code }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-emerald-600" />
                Create New Skill
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Add a new skill to the curriculum
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
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm">
                Subject: {prefilterSubject}
              </span>
              {prefilterGrade && (
                <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm">
                  Grade: {prefilterGrade}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-red-900 dark:text-red-100">Error</h4>
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {/* Skill Code */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Skill Code * <span className="text-xs text-slate-500">(Unique identifier)</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g., ADD_BASIC"
                  className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
                <Button
                  type="button"
                  onClick={generateCode}
                  variant="outline"
                  size="sm"
                  disabled={!formData.name}
                >
                  Generate
                </Button>
              </div>
            </div>

            {/* Skill Name (English) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Skill Name (English) *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Basic Addition"
                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            {/* Skill Name (Persian) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Skill Name (Persian)
              </label>
              <input
                type="text"
                value={formData.nameFA}
                onChange={(e) => setFormData({ ...formData, nameFA: e.target.value })}
                placeholder="مثلا: جمع پایه"
                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-vazirmatn"
                dir="rtl"
              />
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Subject *
              </label>
              <select
                value={formData.subjectId}
                onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              >
                <option value="">Select a subject</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name} ({subject.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Grade Band */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Grade Band Min *
                </label>
                <select
                  value={formData.gradeBandMin}
                  onChange={(e) => setFormData({ ...formData, gradeBandMin: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  {GRADE_BANDS.map((band) => (
                    <option key={band.value} value={band.value}>
                      {band.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Grade Band Max *
                </label>
                <select
                  value={formData.gradeBandMax}
                  onChange={(e) => setFormData({ ...formData, gradeBandMax: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  {GRADE_BANDS.map((band) => (
                    <option key={band.value} value={band.value}>
                      {band.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description (English) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Description (English)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what students will learn with this skill..."
                rows={3}
                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Description (Persian) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Description (Persian)
              </label>
              <textarea
                value={formData.descriptionFA}
                onChange={(e) => setFormData({ ...formData, descriptionFA: e.target.value })}
                placeholder="توضیح دهید که دانش‌آموزان با این مهارت چه چیزی یاد خواهند گرفت..."
                rows={3}
                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-vazirmatn"
                dir="rtl"
              />
            </div>

            {/* Order */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Display Order <span className="text-xs text-slate-500">(0 = first)</span>
              </label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                min="0"
                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex gap-3 justify-end">
          <Button onClick={onCancel} variant="outline" disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-gradient-to-r from-emerald-500 to-teal-600"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Create Skill
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
