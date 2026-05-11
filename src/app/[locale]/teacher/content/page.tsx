'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { createUserHeaders, getStoredUserId } from '@/lib/auth/demo-auth-shared';
import TeacherGamificationPanel from '@/components/gamification/TeacherGamificationPanel';
import PublishCelebration from '@/components/gamification/PublishCelebration';
import {
  BookOpen, ArrowLeft, ArrowRight, Sparkles, FileText, Video,
  Image, List, HelpCircle, Loader2, Check, Copy, Wand2,
  Plus, Trash2, GripVertical, Eye, Save, Send, X, ChevronDown,
  Bold, Italic, Heading1, Heading2, ListOrdered, Code, Quote,
  Minus, CheckSquare, AlertCircle, RefreshCw, ExternalLink,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type ContentType = 'text' | 'video' | 'image' | 'quiz' | 'activity';
type WorkflowStep = 'select' | 'write' | 'preview';

interface ContentBlock {
  id: string;
  type: ContentType;
  title?: string;
  content: string;
  aiGenerated?: boolean;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface LessonOption {
  id: string;
  title: string;
  isPublished: boolean;
  phase: string;
}

interface UnitOption {
  id: string;
  title: string;
  titleFA?: string;
  lessons: LessonOption[];
}

interface CourseOption {
  id: string;
  title: string;
  units: UnitOption[];
}

// ─── Rich Text Toolbar ───────────────────────────────────────────────────────

interface ToolbarAction {
  icon: React.ElementType;
  label: string;
  action: (text: string, sel: { start: number; end: number }) => { text: string; cursor: number };
}

function wrapSelection(
  before: string,
  after: string,
  text: string,
  sel: { start: number; end: number },
) {
  const selected = text.slice(sel.start, sel.end) || 'text';
  const newText = text.slice(0, sel.start) + before + selected + after + text.slice(sel.end);
  return { text: newText, cursor: sel.start + before.length + selected.length + after.length };
}

function prependLine(prefix: string, text: string, sel: { start: number; end: number }) {
  const lineStart = text.lastIndexOf('\n', sel.start - 1) + 1;
  const newText = text.slice(0, lineStart) + prefix + text.slice(lineStart);
  return { text: newText, cursor: sel.end + prefix.length };
}

const TOOLBAR_ACTIONS: ToolbarAction[] = [
  { icon: Bold, label: 'Bold', action: (t, s) => wrapSelection('**', '**', t, s) },
  { icon: Italic, label: 'Italic', action: (t, s) => wrapSelection('_', '_', t, s) },
  { icon: Heading1, label: 'Heading 1', action: (t, s) => prependLine('# ', t, s) },
  { icon: Heading2, label: 'Heading 2', action: (t, s) => prependLine('## ', t, s) },
  { icon: List, label: 'Bullet List', action: (t, s) => prependLine('- ', t, s) },
  { icon: ListOrdered, label: 'Numbered List', action: (t, s) => prependLine('1. ', t, s) },
  { icon: CheckSquare, label: 'Checklist', action: (t, s) => prependLine('- [ ] ', t, s) },
  { icon: Quote, label: 'Blockquote', action: (t, s) => prependLine('> ', t, s) },
  { icon: Code, label: 'Inline Code', action: (t, s) => wrapSelection('`', '`', t, s) },
  { icon: Minus, label: 'Divider', action: (t, s) => ({ text: t.slice(0, s.end) + '\n\n---\n\n' + t.slice(s.end), cursor: s.end + 7 }) },
];

interface RichTextEditorProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  isRTL?: boolean;
  minHeight?: string;
}

function RichTextEditor({ value, onChange, placeholder, isRTL, minHeight = '220px' }: RichTextEditorProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const applyAction = (action: ToolbarAction) => {
    const ta = ref.current;
    if (!ta) return;
    const sel = { start: ta.selectionStart, end: ta.selectionEnd };
    const result = action.action(value, sel);
    onChange(result.text);
    requestAnimationFrame(() => {
      ta.selectionStart = result.cursor;
      ta.selectionEnd = result.cursor;
      ta.focus();
    });
  };

  return (
    <div className="rounded-xl border overflow-hidden focus-within:ring-2 focus-within:ring-primary/30">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-0.5 border-b bg-muted/30 px-2 py-1.5">
        {TOOLBAR_ACTIONS.map((action) => (
          <button
            key={action.label}
            type="button"
            title={action.label}
            onMouseDown={(e) => { e.preventDefault(); applyAction(action); }}
            className="rounded p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <action.icon className="h-3.5 w-3.5" />
          </button>
        ))}
      </div>
      {/* Textarea */}
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        dir={isRTL ? 'rtl' : 'ltr'}
        className="w-full resize-y bg-background p-3 font-mono text-sm leading-relaxed outline-none"
        style={{ minHeight }}
      />
      {/* Footer hint */}
      <div className="border-t bg-muted/20 px-3 py-1.5 text-xs text-muted-foreground">
        {isRTL ? 'Markdown پشتیبانی می‌شود — **بولد** _ایتالیک_ # عنوان' : 'Markdown supported — **bold** _italic_ # Heading `code` > quote'}
      </div>
    </div>
  );
}

// ─── Preview Renderer ────────────────────────────────────────────────────────

function MarkdownPreview({ content }: { content: string }) {
  // Simple markdown-to-html for preview (no external lib)
  const html = content
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-5 mb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-6 mb-3">$1</h1>')
    .replace(/^---$/gm, '<hr class="my-4 border-border"/>')
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-primary/40 pl-4 italic text-muted-foreground my-3">$1</blockquote>')
    .replace(/^- \[x\] (.+)$/gm, '<div class="flex items-start gap-2 my-1"><span class="text-green-500 mt-0.5">✅</span><span class="line-through opacity-60">$1</span></div>')
    .replace(/^- \[ \] (.+)$/gm, '<div class="flex items-start gap-2 my-1"><span class="mt-0.5">☐</span><span>$1</span></div>')
    .replace(/^- (.+)$/gm, '<li class="ms-4 my-0.5 list-disc">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="ms-4 my-0.5 list-decimal">$1</li>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
    .replace(/_(.+?)_/g, '<em class="italic">$1</em>')
    .replace(/`(.+?)`/g, '<code class="rounded bg-muted px-1 py-0.5 font-mono text-sm">$1</code>')
    .replace(/\n\n/g, '</p><p class="my-2">')
    .replace(/\n/g, '<br/>');

  return (
    <div
      className="prose prose-sm dark:prose-invert max-w-none leading-relaxed"
      dangerouslySetInnerHTML={{ __html: `<p class="my-2">${html}</p>` }}
    />
  );
}

// ─── Create Lesson Modal ─────────────────────────────────────────────────────

interface CreateLessonModalProps {
  courseId: string;
  units: UnitOption[];
  isRTL: boolean;
  onClose: () => void;
  onCreated: (lesson: LessonOption, unitId: string) => void;
}

function CreateLessonModal({ courseId, units, isRTL, onClose, onCreated }: CreateLessonModalProps) {
  const [title, setTitle] = useState('');
  const [titleFA, setTitleFA] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState(units[0]?.id || '');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [phase, setPhase] = useState('ENGAGE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const PHASE_OPTIONS = [
    { value: 'ENGAGE', en: 'Engage (Hook)', fa: 'تأثیر (آغاز)' },
    { value: 'EXPLORE', en: 'Explore (Investigate)', fa: 'تحقیق (بررسی)' },
    { value: 'EXPLAIN', en: 'Explain (Clarify)', fa: 'توضیح (تبیین)' },
    { value: 'ELABORATE', en: 'Elaborate (Extend)', fa: 'تعمیم (گسترش)' },
    { value: 'EVALUATE', en: 'Evaluate (Assess)', fa: 'تعیین (سنجش)' },
  ];

  const handleCreate = async () => {
    if (!title.trim()) {
      setError(isRTL ? 'عنوان درس الزامی است.' : 'Lesson title is required.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/teacher/lessons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...createUserHeaders(getStoredUserId()),
        },
        body: JSON.stringify({
          courseId,
          unitId: selectedUnitId || undefined,
          title: title.trim(),
          titleFA: titleFA.trim() || undefined,
          phase,
          estimatedTime: estimatedTime ? Number(estimatedTime) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create lesson');
      onCreated({
        id: data.lesson.id,
        title: data.lesson.title,
        isPublished: false,
        phase: data.lesson.phase,
      }, selectedUnitId || data.lesson.unitId);
    } catch (e) {
      setError(e instanceof Error ? e.message : (isRTL ? 'خطایی رخ داد' : 'An error occurred'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            {isRTL ? 'ایجاد درس جدید' : 'Create New Lesson'}
          </h3>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />{error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">{isRTL ? 'عنوان درس (انگلیسی)' : 'Lesson Title'} *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isRTL ? 'مثال: معادلات درجه اول' : 'e.g., Introduction to Linear Equations'}
              className="w-full rounded-lg border bg-background p-3 text-sm"
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">{isRTL ? 'عنوان فارسی (اختیاری)' : 'Persian Title (optional)'}</label>
            <input
              value={titleFA}
              onChange={(e) => setTitleFA(e.target.value)}
              placeholder="عنوان درس به فارسی"
              className="w-full rounded-lg border bg-background p-3 text-sm"
              dir="rtl"
            />
          </div>

          {units.length > 1 && (
            <div>
              <label className="mb-1.5 block text-sm font-medium">{isRTL ? 'فصل (واحد)' : 'Unit'}</label>
              <select
                value={selectedUnitId}
                onChange={(e) => setSelectedUnitId(e.target.value)}
                className="w-full rounded-lg border bg-background p-3 text-sm"
              >
                {units.map((u) => (
                  <option key={u.id} value={u.id}>{isRTL ? (u.titleFA || u.title) : u.title}</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium">{isRTL ? 'مرحله یادگیری (۵ت)' : 'Learning Phase (5E)'}</label>
              <select
                value={phase}
                onChange={(e) => setPhase(e.target.value)}
                className="w-full rounded-lg border bg-background p-3 text-sm"
              >
                {PHASE_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>{isRTL ? p.fa : p.en}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">{isRTL ? 'مدت (دقیقه)' : 'Duration (min)'}</label>
              <input
                type="number"
                min="1"
                max="300"
                value={estimatedTime}
                onChange={(e) => setEstimatedTime(e.target.value)}
                placeholder="45"
                className="w-full rounded-lg border bg-background p-3 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl border px-4 py-2.5 text-sm hover:bg-muted">
            {isRTL ? 'انصراف' : 'Cancel'}
          </button>
          <button
            onClick={handleCreate}
            disabled={loading || !title.trim()}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {isRTL ? 'ایجاد درس' : 'Create Lesson'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Image Upload Zone ────────────────────────────────────────────────────────

function ImageUploadZone({
  value,
  onChange,
  isRTL,
}: {
  value: string;
  onChange: (v: string) => void;
  isRTL: boolean;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) onChange(e.target.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    } else {
      // Handle dropped URL (e.g. dragging image from browser)
      const url = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain');
      if (url) onChange(url);
    }
  };

  return (
    <div className="space-y-3">
      <input
        value={value.startsWith('data:') ? '' : value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={isRTL ? 'لینک تصویر (اختیاری)' : 'Image URL (optional)'}
        className="w-full rounded-lg border bg-background p-3 text-sm"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
      {value ? (
        <div className="relative group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="max-h-64 w-full rounded-xl object-cover" />
          <button
            onClick={() => onChange('')}
            className="absolute top-2 end-2 rounded-full bg-black/60 p-1.5 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed py-12 transition-all ${
            isDragging
              ? 'border-primary bg-primary/5 scale-[1.01]'
              : 'border-muted-foreground/25 bg-muted hover:border-primary/50 hover:bg-muted/80'
          }`}
        >
          <div className={`mb-3 rounded-full p-3 ${isDragging ? 'bg-primary/10' : 'bg-background'}`}>
            <Image className={`h-8 w-8 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            {isRTL ? 'کلیک کنید یا تصویر را اینجا بکشید' : 'Click to upload or drag & drop'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground/60">
            {isRTL ? 'PNG، JPG، GIF تا ۱۰ مگابایت' : 'PNG, JPG, GIF up to 10 MB'}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Video URL Parser ───────────────────────────────────────────────────────

function getVideoEmbedUrl(url: string): string {
  if (!url) return '';
  // YouTube: watch?v=ID or youtu.be/ID or shorts/ID
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/|youtube\.com\/v\/)([\w-]{11})/
  );
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0`;
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  // Aparat
  const aparatMatch = url.match(/aparat\.com\/v\/([^/?&]+)/);
  if (aparatMatch) return `https://www.aparat.com/video/video/embed/videohash/${aparatMatch[1]}/vt/frame`;
  // Already an embed URL
  if (url.includes('/embed/') || url.includes('player.')) return url;
  return url;
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function ContentCreatorPage({ params: { locale } }: { params: { locale: string } }) {
  const isRTL = locale === 'fa';
  const Arrow = isRTL ? ArrowRight : ArrowLeft;

  // ── State ──
  const [step, setStep] = useState<WorkflowStep>('select');
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedLessonId, setSelectedLessonId] = useState('');
  const [selectedLessonTitle, setSelectedLessonTitle] = useState('');
  const [showCreateLesson, setShowCreateLesson] = useState(false);
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [activeTab, setActiveTab] = useState<'editor' | 'quiz'>('editor');
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [contentLoading, setContentLoading] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [xpGained, setXpGained] = useState(0);
  const [gamificationRefresh, setGamificationRefresh] = useState(0);
  const [sidebarTab, setSidebarTab] = useState<'ai' | 'gamification'>('gamification');

  // ── Derived ──
  const selectedCourse = useMemo(
    () => courses.find((c) => c.id === selectedCourseId),
    [courses, selectedCourseId],
  );

  const allLessons = useMemo(
    () => selectedCourse?.units.flatMap((u) => u.lessons.map((l) => ({ ...l, unitTitle: u.title }))) ?? [],
    [selectedCourse],
  );

  const selectedLesson = useMemo(
    () => allLessons.find((l) => l.id === selectedLessonId),
    [allLessons, selectedLessonId],
  );

  // ── Load courses ──
  const loadCourses = useCallback(async () => {
    setCoursesLoading(true);
    try {
      const res = await fetch(`/api/v1/teacher/courses?locale=${locale}`, {
        headers: createUserHeaders(getStoredUserId()),
      });
      const data = await res.json();
      const mapped: CourseOption[] = (data.courses || []).map((c: any) => ({
        id: c.id,
        title: c.title,
        units: (c.units || []).map((u: any) => ({
          id: u.id,
          title: u.title,
          titleFA: u.titleFA,
          lessons: (u.lessons || []).map((l: any) => ({
            id: l.id,
            title: l.title,
            isPublished: l.isPublished,
            phase: l.phase || 'ENGAGE',
          })),
        })),
      }));
      setCourses(mapped);
      if (mapped.length > 0 && !selectedCourseId) {
        setSelectedCourseId(mapped[0].id);
      }
    } catch {
      setCourses([]);
    } finally {
      setCoursesLoading(false);
    }
  }, [locale, selectedCourseId]);

  useEffect(() => { loadCourses(); }, [locale]);

  // ── Load existing content when lesson is selected ──
  const loadLessonContent = useCallback(async (lessonId: string) => {
    setContentLoading(true);
    try {
      const res = await fetch(`/api/v1/teacher/lessons/${lessonId}/content`, {
        headers: createUserHeaders(getStoredUserId()),
      });
      const data = await res.json();
      if (res.ok && data.blocks?.length > 0) {
        setContentBlocks(
          data.blocks.map((b: any) => ({
            id: b.id,
            type: b.type || 'text',
            title: b.title || '',
            content: b.content || '',
          })),
        );
      } else {
        setContentBlocks([{ id: Date.now().toString(), type: 'text', content: '' }]);
      }
    } catch {
      setContentBlocks([{ id: Date.now().toString(), type: 'text', content: '' }]);
    } finally {
      setContentLoading(false);
    }
  }, []);

  // ── Handlers ──
  const handleSelectLesson = (lessonId: string, title: string) => {
    setSelectedLessonId(lessonId);
    setSelectedLessonTitle(title);
    setStep('write');
    loadLessonContent(lessonId);
    setFeedback(null);
  };

  const handleLessonCreated = (lesson: LessonOption, unitId: string) => {
    setCourses((prev) =>
      prev.map((c) =>
        c.id === selectedCourseId
          ? {
              ...c,
              units: c.units.map((u) =>
                u.id === unitId ? { ...u, lessons: [...u.lessons, lesson] } : u,
              ),
            }
          : c,
      ),
    );
    setShowCreateLesson(false);
    handleSelectLesson(lesson.id, lesson.title);
  };

  const handleAddBlock = (type: ContentType) => {
    setContentBlocks((prev) => [
      ...prev,
      { id: Date.now().toString(), type, content: '' },
    ]);
  };

  const handleUpdateBlock = (id: string, content: string) => {
    setContentBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, content } : b)));
  };

  const handleDeleteBlock = (id: string) => {
    setContentBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  const handleSaveOrPublish = async (publish: boolean) => {
    if (!selectedLessonId) return;
    if (publish) setIsPublishing(true); else setIsSaving(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/v1/teacher/lessons/${selectedLessonId}/content`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...createUserHeaders(getStoredUserId()),
        },
        body: JSON.stringify({
          blocks: contentBlocks.map((b) => ({ type: b.type, content: b.content, title: b.title || `${b.type} block` })),
          publish,
          lessonTitle: selectedLessonTitle,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');

      setLastSaved(new Date());
      setFeedback({
        ok: true,
        msg: publish
          ? (isRTL ? '✅ درس با موفقیت منتشر شد!' : '✅ Lesson published successfully!')
          : (isRTL ? '✅ محتوا ذخیره شد.' : '✅ Content saved.'),
      });

      if (publish) {
        // Award XP for publishing
        const uid = getStoredUserId();
        if (uid) {
          fetch('/api/v1/gamification/xp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...createUserHeaders(uid) },
            body: JSON.stringify({ userId: uid, eventType: 'PROJECT_SUBMIT', points: 50, description: 'Lesson published' }),
          }).catch(() => {});
        }
        setCelebrating(true);
        setXpGained(50);
        setGamificationRefresh((n) => n + 1);

        // Update local lesson state to reflect published
        setCourses((prev) =>
          prev.map((c) => ({
            ...c,
            units: c.units.map((u) => ({
              ...u,
              lessons: u.lessons.map((l) =>
                l.id === selectedLessonId ? { ...l, isPublished: true } : l,
              ),
            })),
          })),
        );
      }
    } catch (e) {
      setFeedback({
        ok: false,
        msg: e instanceof Error ? e.message : (isRTL ? 'خطایی رخ داد' : 'An error occurred'),
      });
    } finally {
      setIsSaving(false);
      setIsPublishing(false);
    }
  };

  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    await new Promise((r) => setTimeout(r, 1500));
    const persianGenerated = '## ' + aiPrompt + '\n\n'
      + '\u0627\u06cc\u0646 \u0645\u062d\u062a\u0648\u0627 \u0628\u0647 \u0635\u0648\u0631\u062a \u0646\u0645\u0648\u0646\u0647 \u062a\u0648\u0633\u0637 \u0647\u0648\u0634 \u0645\u0635\u0646\u0648\u0639\u06cc \u062a\u0648\u0644\u06cc\u062f \u0634\u062f\u0647 \u0627\u0633\u062a.\n\n'
      + '### \u0646\u06a9\u0627\u062a \u06a9\u0644\u06cc\u062f\u06cc:\n'
      + '- \u0646\u06a9\u062a\u0647 \u0627\u0648\u0644 \u0645\u0631\u062a\u0628\u0637 \u0628\u0627 \u0645\u0648\u0636\u0648\u0639\n'
      + '- \u0646\u06a9\u062a\u0647 \u062f\u0648\u0645 \u0628\u0627 \u062a\u0648\u0636\u06cc\u062d \u0628\u06cc\u0634\u062a\u0631\n'
      + '- \u0646\u06a9\u062a\u0647 \u0633\u0648\u0645 \u0628\u0631\u0627\u06cc \u062a\u0639\u0645\u06cc\u0642 \u062f\u0631\u06a9\n\n'
      + '**\u062e\u0644\u0627\u0635\u0647:** \u0627\u06cc\u0646 \u062f\u0631\u0633 \u0628\u0647 \u062f\u0627\u0646\u0634\u200c\u0622\u0645\u0648\u0632\u0627\u0646 \u06a9\u0645\u06a9 \u0645\u06cc\u200c\u06a9\u0646\u062f \u062a\u0627 \u0645\u0641\u0647\u0648\u0645 \u0631\u0627 \u062f\u0631\u06a9 \u06a9\u0646\u0646\u062f.';
    const englishGenerated = '## ' + aiPrompt + '\n\nThis content was generated as a sample by AI.\n\n### Key Points:\n- First key point related to the topic\n- Second point with more explanation\n- Third point to deepen understanding\n\n**Summary:** This lesson helps students understand the concept effectively.';
    const generated = isRTL ? persianGenerated : englishGenerated;

    setContentBlocks((prev) => [
      ...prev,
      { id: Date.now().toString(), type: 'text', content: generated, aiGenerated: true },
    ]);
    setAiPrompt('');
    setIsGenerating(false);
  };

  // ── STEP 1: Select Course + Lesson ──────────────────────────────────────────
  if (step === 'select') {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-lg">
          <div className="mx-auto flex h-16 max-w-5xl items-center gap-4 px-4">
            <Link href={`/${locale}/teacher`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <Arrow className="h-5 w-5" />
              <span>{isRTL ? 'بازگشت' : 'Back'}</span>
            </Link>
            <div className="h-6 w-px bg-border" />
            <h1 className="font-semibold">{isRTL ? 'ایجاد محتوای درسی' : 'Lesson Content Creator'}</h1>
          </div>
        </header>

        <div className="mx-auto max-w-5xl px-4 py-8">
          {/* Step indicator */}
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">1</div>
            <div className="h-0.5 flex-1 bg-border" />
            <div className="flex h-8 w-8 items-center justify-center rounded-full border bg-muted text-sm font-bold text-muted-foreground">2</div>
            <p className="ms-2 hidden text-sm text-muted-foreground sm:block">{isRTL ? 'انتخاب دوره و درس → نوشتن محتوا' : 'Select course & lesson → Write content'}</p>
          </div>

          <h2 className="mb-2 text-2xl font-bold">{isRTL ? 'کدام دوره را می‌خواهید ویرایش کنید؟' : 'Which course are you creating content for?'}</h2>
          <p className="mb-6 text-muted-foreground">{isRTL ? 'یک دوره انتخاب کنید، سپس یک درس موجود را انتخاب یا درس جدید بسازید.' : 'Select a course, then pick an existing lesson or create a new one.'}</p>

          {coursesLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : courses.length === 0 ? (
            <div className="rounded-2xl border border-dashed bg-muted/20 p-12 text-center">
              <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
              <h3 className="mb-2 text-lg font-semibold">{isRTL ? 'دوره‌ای یافت نشد' : 'No courses found'}</h3>
              <p className="text-sm text-muted-foreground">
                {isRTL ? 'ابتدا باید دوره‌ای به شما اختصاص داده شده باشد.' : 'You need to be assigned to a course first.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Course selector tabs */}
              <div className="flex flex-wrap gap-2">
                {courses.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCourseId(c.id)}
                    className={`rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
                      selectedCourseId === c.id
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'hover:bg-muted'
                    }`}
                  >
                    {c.title}
                  </button>
                ))}
              </div>

              {selectedCourse && (
                <div className="rounded-2xl border bg-card p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-semibold">{isRTL ? 'دروس موجود' : 'Available Lessons'}</h3>
                    <button
                      onClick={() => setShowCreateLesson(true)}
                      className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      <Plus className="h-4 w-4" />
                      {isRTL ? 'درس جدید' : 'New Lesson'}
                    </button>
                  </div>

                  {allLessons.length === 0 ? (
                    <div className="rounded-xl border border-dashed p-8 text-center">
                      <p className="mb-3 text-muted-foreground">{isRTL ? 'هنوز هیچ درسی در این دوره وجود ندارد.' : 'No lessons in this course yet.'}</p>
                      <button
                        onClick={() => setShowCreateLesson(true)}
                        className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-muted"
                      >
                        <Plus className="h-4 w-4" />
                        {isRTL ? 'ایجاد اولین درس' : 'Create First Lesson'}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedCourse.units.map((unit) => (
                        <div key={unit.id}>
                          {selectedCourse.units.length > 1 && (
                            <p className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              {isRTL ? (unit.titleFA || unit.title) : unit.title}
                            </p>
                          )}
                          {unit.lessons.map((lesson) => (
                            <button
                              key={lesson.id}
                              onClick={() => handleSelectLesson(lesson.id, lesson.title)}
                              className="flex w-full items-center gap-3 rounded-xl border p-3 text-start hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                <FileText className="h-4 w-4 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="truncate font-medium text-sm">{lesson.title}</p>
                                <p className="text-xs text-muted-foreground">{lesson.phase.toLowerCase()}</p>
                              </div>
                              {lesson.isPublished ? (
                                <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300">
                                  {isRTL ? 'منتشرشده' : 'Published'}
                                </span>
                              ) : (
                                <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                                  {isRTL ? 'پیش‌نویس' : 'Draft'}
                                </span>
                              )}
                              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {showCreateLesson && selectedCourse && (
          <CreateLessonModal
            courseId={selectedCourseId}
            units={selectedCourse.units}
            isRTL={isRTL}
            onClose={() => setShowCreateLesson(false)}
            onCreated={handleLessonCreated}
          />
        )}
      </div>
    );
  }

  // ── STEP 2: Write Content ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setStep('select')}
              className="flex shrink-0 items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <Arrow className="h-5 w-5" />
              <span className="hidden sm:inline">{isRTL ? 'بازگشت' : 'Back'}</span>
            </button>
            <div className="h-6 w-px bg-border" />
            <div className="min-w-0">
              <p className="truncate text-xs text-muted-foreground">{selectedCourse?.title}</p>
              <p className="truncate font-semibold leading-tight">{selectedLessonTitle}</p>
            </div>
            {selectedLesson?.isPublished && (
              <span className="hidden shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300 sm:inline">
                {isRTL ? 'منتشرشده' : 'Published'}
              </span>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {lastSaved && (
              <span className="hidden text-xs text-muted-foreground lg:inline">
                {isRTL ? 'ذخیره: ' : 'Saved: '}{lastSaved.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={() => handleSaveOrPublish(false)}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm hover:bg-muted disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span className="hidden sm:inline">{isRTL ? 'ذخیره' : 'Save'}</span>
            </button>
            <button
              onClick={() => handleSaveOrPublish(true)}
              disabled={isPublishing || contentBlocks.every((b) => !b.content.trim())}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isPublishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              <span className="hidden sm:inline">{isRTL ? 'انتشار' : 'Publish'}</span>
            </button>
            {selectedLessonId && (
              <a
                href={`/${locale}/teacher/lessons/${selectedLessonId}/preview`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700 hover:bg-green-100 dark:border-green-700 dark:bg-green-950/30 dark:text-green-300"
              >
                <ExternalLink className="h-4 w-4" />
                <span className="hidden sm:inline">{isRTL ? 'پیش‌نمایش' : 'Preview'}</span>
              </a>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Feedback */}
        {feedback && (
          <div className={`mb-5 flex items-center justify-between rounded-xl border p-3 text-sm ${
            feedback.ok
              ? 'border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950/30 dark:text-green-300'
              : 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300'
          }`}>
            <span>{feedback.msg}</span>
            <button onClick={() => setFeedback(null)} className="rounded p-0.5 hover:bg-black/10"><X className="h-4 w-4" /></button>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* ── Left: Editor ── */}
          <div className="space-y-5">
            {/* Tabs */}
            <div className="flex gap-1 border-b">
              {(['editor', 'quiz'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab === 'editor' ? (isRTL ? 'ویرایشگر محتوا' : 'Content Editor') : (isRTL ? 'آزمون' : 'Quiz')}
                </button>
              ))}
            </div>

            {contentLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : activeTab === 'editor' ? (
              <div className="space-y-4">
                {contentBlocks.length === 0 && (
                  <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed py-16 text-center">
                    <FileText className="h-10 w-10 text-muted-foreground mb-3" />
                    <p className="font-medium text-muted-foreground">
                      {isRTL ? 'هنوز محتوایی اضافه نشده' : 'No content yet'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {isRTL ? 'از دکمه‌های پایین یک بلوک اضافه کنید' : 'Add a block using the buttons below'}
                    </p>
                  </div>
                )}
                {contentBlocks.map((block, index) => (
                  <div key={block.id} className="group rounded-2xl border bg-card">
                    <div className="flex items-center gap-2 border-b px-4 py-2.5">
                      <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">
                        {isRTL ? `بلوک ${index + 1}` : `Block ${index + 1}`}
                        {block.type !== 'text' && ` · ${block.type}`}
                      </span>
                      {block.aiGenerated && (
                        <span className="ms-1 inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                          <Sparkles className="h-3 w-3" /> AI
                        </span>
                      )}
                      <div className="flex-1" />
                      {contentBlocks.length > 0 && (
                        <button
                          onClick={() => handleDeleteBlock(block.id)}
                          className="rounded p-1 text-muted-foreground opacity-0 hover:text-destructive group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <div className="p-4">
                      {block.type === 'text' && (
                        <RichTextEditor
                          value={block.content}
                          onChange={(v) => handleUpdateBlock(block.id, v)}
                          placeholder={isRTL ? 'محتوای درس را اینجا بنویسید...' : 'Write lesson content here...'}
                          isRTL={isRTL}
                        />
                      )}
                      {block.type === 'video' && (
                        <div className="space-y-3">
                          <input
                            value={block.content}
                            onChange={(e) => handleUpdateBlock(block.id, e.target.value)}
                            placeholder={isRTL ? 'لینک ویدیو (YouTube, Aparat...)' : 'Video URL (YouTube, Vimeo...)'}
                            className="w-full rounded-lg border bg-background p-3 text-sm"
                          />
                          {block.content ? (
                            <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
                              <iframe
                                src={getVideoEmbedUrl(block.content)}
                                className="h-full w-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                title="Video preview"
                              />
                            </div>
                          ) : (
                            <div className="flex aspect-video flex-col items-center justify-center rounded-xl bg-muted gap-2">
                              <Video className="h-10 w-10 text-muted-foreground" />
                              <p className="text-xs text-muted-foreground">{isRTL ? 'لینک ویدیو را وارد کنید' : 'Paste a YouTube, Vimeo or Aparat URL above'}</p>
                            </div>
                          )}
                        </div>
                      )}
                      {block.type === 'image' && (
                        <ImageUploadZone
                          value={block.content}
                          onChange={(v) => handleUpdateBlock(block.id, v)}
                          isRTL={isRTL}
                        />
                      )}
                    </div>
                  </div>
                ))}

                {/* Preview section */}
                {contentBlocks.some((b) => b.content.trim()) && (
                  <details className="rounded-2xl border bg-card">
                    <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 font-medium text-sm">
                      <Eye className="h-4 w-4 text-primary" />
                      {isRTL ? 'پیش‌نمایش محتوا' : 'Content Preview'}
                      <ChevronDown className="ms-auto h-4 w-4 text-muted-foreground" />
                    </summary>
                    <div className="border-t p-5 space-y-6">
                      {contentBlocks.map((b) => b.content && (
                        <div key={b.id}>
                          {b.type === 'video' ? (
                            <div className="aspect-video overflow-hidden rounded-xl bg-black shadow">
                              <iframe
                                src={getVideoEmbedUrl(b.content)}
                                className="h-full w-full"
                                allowFullScreen
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                title="Video preview"
                              />
                            </div>
                          ) : b.type === 'image' ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={b.content} alt="" className="max-h-64 rounded-xl object-cover" />
                          ) : (
                            <MarkdownPreview content={b.content} />
                          )}
                        </div>
                      ))}
                    </div>
                  </details>
                )}

                {/* Add block buttons */}
                <div className="flex flex-wrap gap-2">
                  <p className="w-full text-xs text-muted-foreground">{isRTL ? '+ افزودن بلوک:' : '+ Add block:'}</p>
                  {([
                    { type: 'text' as ContentType, icon: FileText, label: isRTL ? 'متن' : 'Text' },
                    { type: 'video' as ContentType, icon: Video, label: isRTL ? 'ویدیو' : 'Video' },
                    { type: 'image' as ContentType, icon: Image, label: isRTL ? 'تصویر' : 'Image' },
                  ]).map(({ type, icon: Icon, label }) => (
                    <button
                      key={type}
                      onClick={() => handleAddBlock(type)}
                      className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm hover:bg-muted"
                    >
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Quiz tab */
              <div className="space-y-4">
                {quizQuestions.map((q, qi) => (
                  <div key={q.id} className="rounded-2xl border bg-card p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{qi + 1}</span>
                      <button onClick={() => setQuizQuestions((prev) => prev.filter((x) => x.id !== q.id))} className="p-1 text-destructive hover:bg-destructive/10 rounded">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <textarea
                      value={q.question}
                      onChange={(e) => setQuizQuestions((prev) => prev.map((x) => x.id === q.id ? { ...x, question: e.target.value } : x))}
                      placeholder={isRTL ? 'متن سوال...' : 'Question...'}
                      className="mb-3 w-full rounded-lg border bg-background p-3 text-sm"
                      rows={2}
                    />
                    <div className="space-y-2 mb-3">
                      {q.options.map((opt, oi) => (
                        <div key={oi} className="flex items-center gap-2">
                          <input type="radio" checked={q.correctAnswer === oi} onChange={() => setQuizQuestions((prev) => prev.map((x) => x.id === q.id ? { ...x, correctAnswer: oi } : x))} className="h-4 w-4 cursor-pointer" />
                          <input type="text" value={opt} onChange={(e) => setQuizQuestions((prev) => prev.map((x) => x.id === q.id ? { ...x, options: x.options.map((o, i) => i === oi ? e.target.value : o) } : x))} placeholder={isRTL ? `گزینه ${oi + 1}` : `Option ${oi + 1}`} className="flex-1 rounded-lg border bg-background p-2 text-sm" />
                        </div>
                      ))}
                    </div>
                    <textarea value={q.explanation} onChange={(e) => setQuizQuestions((prev) => prev.map((x) => x.id === q.id ? { ...x, explanation: e.target.value } : x))} placeholder={isRTL ? 'توضیح پاسخ...' : 'Answer explanation...'} className="w-full rounded-lg border bg-background p-3 text-sm" rows={2} />
                  </div>
                ))}
                <button
                  onClick={() => setQuizQuestions((prev) => [...prev, { id: Date.now().toString(), question: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '' }])}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed p-4 text-muted-foreground hover:border-primary/50 hover:text-foreground"
                >
                  <Plus className="h-5 w-5" />
                  {isRTL ? 'افزودن سوال' : 'Add Question'}
                </button>
              </div>
            )}
          </div>

          {/* ── Right: Sidebar ── */}
          <PublishCelebration active={celebrating} onComplete={() => { setCelebrating(false); setXpGained(0); }} />
          <aside className="space-y-4">
            {/* Sidebar Tab Switcher */}
            <div className="flex rounded-xl border bg-muted p-1 gap-1">
              <button onClick={() => setSidebarTab('gamification')} className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-all ${ sidebarTab === 'gamification' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground' }`}>🏆 {isRTL ? 'پیشرفت' : 'Progress'}</button>
              <button onClick={() => setSidebarTab('ai')} className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-all ${ sidebarTab === 'ai' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground' }`}>✨ {isRTL ? 'هوش مصنوعی' : 'AI'}</button>
            </div>
            {sidebarTab === 'gamification' && (
              <TeacherGamificationPanel
                locale={locale}
                newXPGained={xpGained}
                refreshTrigger={gamificationRefresh}
              />
            )}

            {/* AI Panel */}
            {sidebarTab === 'ai' && (
              <>
                <div className="overflow-hidden rounded-2xl border">
              <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-4 text-white">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  <span className="font-semibold">{isRTL ? 'دستیار هوش مصنوعی' : 'AI Assistant'}</span>
                </div>
                <p className="mt-1 text-xs text-white/70">{isRTL ? 'محتوا با AI تولید کنید' : 'Generate content with AI'}</p>
              </div>
              <div className="space-y-3 p-4">
                {/* Quick templates */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: isRTL ? 'توضیح مفهوم' : 'Explain Concept', prompt: isRTL ? 'توضیح بده: ' : 'Explain: ' },
                    { label: isRTL ? 'ایجاد مثال' : 'Create Examples', prompt: isRTL ? 'مثال حل‌شده برای: ' : 'Solved examples for: ' },
                    { label: isRTL ? 'خلاصه درس' : 'Summarize', prompt: isRTL ? 'خلاصه کن: ' : 'Summarize: ' },
                    { label: isRTL ? 'سوالات تمرینی' : 'Practice Qs', prompt: isRTL ? 'سوالات تمرینی برای: ' : 'Practice questions for: ' },
                  ].map(({ label, prompt }) => (
                    <button
                      key={label}
                      onClick={() => setAiPrompt(prompt)}
                      className="rounded-lg border bg-background p-2 text-xs hover:bg-muted"
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder={isRTL ? 'موضوع یا دستور خود را بنویسید...' : 'Enter your topic or instruction...'}
                  className="w-full resize-none rounded-lg border bg-background p-3 text-sm"
                  rows={3}
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
                <button
                  onClick={handleGenerateAI}
                  disabled={isGenerating || !aiPrompt.trim()}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 p-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                >
                  {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                  {isRTL ? 'تولید محتوا' : 'Generate Content'}
                </button>
              </div>
            </div>

            {/* Markdown cheatsheet */}
            <div className="rounded-2xl border bg-card p-4">
              <h4 className="mb-3 text-sm font-semibold">{isRTL ? 'راهنمای Markdown' : 'Markdown Guide'}</h4>
              <div className="space-y-1.5 font-mono text-xs text-muted-foreground">
                {[
                  ['**bold**', isRTL ? 'بولد' : 'bold'],
                  ['_italic_', isRTL ? 'ایتالیک' : 'italic'],
                  ['# Heading 1', isRTL ? 'عنوان ۱' : 'heading 1'],
                  ['## Heading 2', isRTL ? 'عنوان ۲' : 'heading 2'],
                  ['- item', isRTL ? 'لیست' : 'bullet list'],
                  ['1. item', isRTL ? 'شماره‌دار' : 'numbered'],
                  ['> quote', isRTL ? 'نقل‌قول' : 'blockquote'],
                  ['`code`', isRTL ? 'کد' : 'inline code'],
                  ['---', isRTL ? 'خط جداکننده' : 'divider'],
                ].map(([syntax, desc]) => (
                  <div key={syntax} className="flex justify-between gap-2">
                    <span className="text-foreground">{syntax}</span>
                    <span>→ {desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Lesson info */}
            <div className="rounded-2xl border bg-card p-4">
              <h4 className="mb-3 text-sm font-semibold">{isRTL ? 'اطلاعات درس' : 'Lesson Info'}</h4>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <div className="flex justify-between"><span>{isRTL ? 'وضعیت' : 'Status'}</span><span className={selectedLesson?.isPublished ? 'text-green-600' : 'text-amber-600'}>{selectedLesson?.isPublished ? (isRTL ? 'منتشرشده' : 'Published') : (isRTL ? 'پیش‌نویس' : 'Draft')}</span></div>
                <div className="flex justify-between"><span>{isRTL ? 'تعداد بلوک‌ها' : 'Blocks'}</span><span>{contentBlocks.filter((b) => b.content.trim()).length}</span></div>
                <div className="flex justify-between"><span>{isRTL ? 'کلمات تخمینی' : 'Est. words'}</span><span>{contentBlocks.reduce((a, b) => a + b.content.split(/\s+/).filter(Boolean).length, 0)}</span></div>
              </div>
            </div>
              </>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
