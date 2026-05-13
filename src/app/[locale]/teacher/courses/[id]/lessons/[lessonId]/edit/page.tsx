'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { FeedbackBanner } from '@/components/ui/feedback-banner';
import { createUserHeaders, getStoredUserId } from '@/lib/auth/demo-auth-shared';
import { extractSafeEmbedConfig, normalizeExternalEmbedUrl } from '@/lib/content/embed-utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  ArrowLeft, ArrowRight, Save, Send, Eye, Sparkles, FileText,
  Video, Image, HelpCircle, List, Wand2, Loader2, Check, Copy,
  Plus, Trash2, GripVertical, X, Clock, Award, Settings,
  Bold, Italic, Underline, AlignLeft, AlignCenter, Code, Link2
} from 'lucide-react';

interface ContentBlock {
  id: string;
  type: 'text' | 'video' | 'image' | 'simulation';
  content: string;
  title?: string;
  aiGenerated?: boolean;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface BankQuestionOption {
  id: string;
  text: string;
  textFA?: string | null;
  isCorrect: boolean;
}

interface BankQuestion {
  id: string;
  type: string;
  stem: string;
  stemFA?: string | null;
  explanation?: string | null;
  explanationFA?: string | null;
  difficulty: string;
  metadata?: {
    phase5E?: string;
    subjectCode?: string;
  };
  options?: BankQuestionOption[];
}

interface CourseContext {
  id: string;
  title: string;
  subjectCode?: string;
  gradeCode?: string;
}

function normalizeEditorBlockType(type: string): ContentBlock['type'] {
  if (type === 'simulation' || type === 'code') return 'simulation';
  if (type === 'video' || type === 'image') return type;
  return 'text';
}

const TEACHER_LESSON_EDITOR_STORAGE_KEY = 'danesh.teacher.lesson-editor';

export default function LessonEditor({ params }: { params: { locale: string; id: string; lessonId: string } }) {
  const { locale, id: courseId, lessonId } = params;
  const t = useTranslations();
  const isRTL = locale === 'fa';
  const Arrow = isRTL ? ArrowRight : ArrowLeft;
  const storageKey = useMemo(() => `${TEACHER_LESSON_EDITOR_STORAGE_KEY}.${locale}.${courseId}.${lessonId}`, [courseId, lessonId, locale]);

  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonDescription, setLessonDescription] = useState('');
  const [duration, setDuration] = useState('20');
  const [xpReward, setXpReward] = useState('75');
  
  const [activeTab, setActiveTab] = useState<'content' | 'quiz' | 'settings'>('content');
  const [showAIPanel, setShowAIPanel] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [feedback, setFeedback] = useState<{ variant: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [courseContext, setCourseContext] = useState<CourseContext | null>(null);
  const [lessonTitleEN, setLessonTitleEN] = useState('');
  const [lessonTitleFA, setLessonTitleFA] = useState('');
  const [showQuestionBank, setShowQuestionBank] = useState(false);
  const [bankQuestions, setBankQuestions] = useState<BankQuestion[]>([]);
  const [bankLoading, setBankLoading] = useState(false);
  const [bankFilters, setBankFilters] = useState({
    search: '',
    phase: '',
    difficulty: '',
  });
  
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([
    { id: '1', type: 'text', content: '' },
  ]);

  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([
    {
      id: '1',
      question: isRTL ? 'حاصل معادله 2x + 6 = 14 چیست؟' : 'What is the solution to 2x + 6 = 14?',
      options: ['x = 2', 'x = 4', 'x = 6', 'x = 8'],
      correctAnswer: 1,
      explanation: isRTL ? '2x = 14 - 6 = 8، پس x = 4' : '2x = 14 - 6 = 8, so x = 4',
    },
  ]);

  const aiTemplates = [
    { 
      id: 'explain', 
      label: isRTL ? 'توضیح مفهوم' : 'Explain Concept',
      prompt: isRTL ? 'مفهوم را به زبان ساده توضیح بده:' : 'Explain this concept simply:'
    },
    { 
      id: 'examples', 
      label: isRTL ? 'مثال‌های حل شده' : 'Solved Examples',
      prompt: isRTL ? 'چند مثال حل شده بنویس:' : 'Write solved examples for:'
    },
    { 
      id: 'summary', 
      label: isRTL ? 'خلاصه' : 'Summary',
      prompt: isRTL ? 'خلاصه‌ای جامع بنویس:' : 'Write a comprehensive summary:'
    },
    { 
      id: 'tips', 
      label: isRTL ? 'نکات کلیدی' : 'Key Tips',
      prompt: isRTL ? 'نکات کلیدی را بنویس:' : 'Write key tips for:'
    },
  ];

  useEffect(() => {
    try {
      const storedDraft = window.localStorage.getItem(storageKey);
      if (!storedDraft) return;

      const parsed = JSON.parse(storedDraft) as {
        lessonTitle?: string;
        lessonDescription?: string;
        duration?: string;
        xpReward?: string;
        contentBlocks?: Array<ContentBlock | { id: string; type: string; content: string; title?: string; aiGenerated?: boolean }>;
        quizQuestions?: QuizQuestion[];
        lastSaved?: string;
      };

      if (typeof parsed.lessonTitle === 'string') setLessonTitle(parsed.lessonTitle);
      if (typeof parsed.lessonDescription === 'string') setLessonDescription(parsed.lessonDescription);
      if (typeof parsed.duration === 'string') setDuration(parsed.duration);
      if (typeof parsed.xpReward === 'string') setXpReward(parsed.xpReward);
      if (Array.isArray(parsed.contentBlocks) && parsed.contentBlocks.length > 0) {
        setContentBlocks(
          parsed.contentBlocks.map((block) => ({
            ...block,
            type: normalizeEditorBlockType(block.type),
          })),
        );
      }
      if (Array.isArray(parsed.quizQuestions)) setQuizQuestions(parsed.quizQuestions);
      if (parsed.lastSaved) setLastSaved(new Date(parsed.lastSaved));
    } catch {
      setFeedback({
        variant: 'error',
        message: isRTL ? 'بارگذاری پیش‌نویس درس ممکن نبود.' : 'Saved lesson draft could not be loaded.',
      });
    }
  }, [isRTL, storageKey]);

  useEffect(() => {
    const loadCourseContext = async () => {
      try {
        const response = await fetch(`/api/v1/courses/${courseId}?locale=${locale}`);
        if (!response.ok) return;

        const data = await response.json();
        setCourseContext({
          id: data.id,
          title: data.title,
          subjectCode: data.subject?.code,
          gradeCode: data.gradeLevel?.code,
        });
      } catch {
        setCourseContext(null);
      }
    };

    void loadCourseContext();
  }, [courseId, locale]);

  useEffect(() => {
    let active = true;

    const loadLessonEditorData = async () => {
      try {
        const [lessonResponse, contentResponse] = await Promise.all([
          fetch(`/api/v1/lessons/${lessonId}`),
          fetch(`/api/v1/teacher/lessons/${lessonId}/content`, {
            headers: createUserHeaders(getStoredUserId()),
          }),
        ]);

        const lessonData = lessonResponse.ok ? await lessonResponse.json() : null;
        const contentData = contentResponse.ok ? await contentResponse.json() : null;

        if (!active) return;

        if (lessonData?.lesson) {
          const serverLesson = lessonData.lesson;
          setLessonTitleEN(serverLesson.title || '');
          setLessonTitleFA(serverLesson.titleFA || '');
          setLessonTitle(isRTL ? serverLesson.titleFA || serverLesson.title || '' : serverLesson.title || serverLesson.titleFA || '');
          setDuration(serverLesson.estimatedTime ? String(serverLesson.estimatedTime) : '20');
        }

        if (Array.isArray(contentData?.blocks)) {
          const serverBlocks = contentData.blocks
            .filter((block: any) => typeof block.content === 'string')
            .map((block: any) => ({
              id: block.id,
              type: normalizeEditorBlockType(block.type),
              title: block.title || '',
              content: block.content || '',
            }));

          if (serverBlocks.length > 0) {
            setContentBlocks(serverBlocks);
          }
        }
      } catch {
        // keep local draft fallback
      }
    };

    void loadLessonEditorData();

    return () => {
      active = false;
    };
  }, [isRTL, lessonId]);

  useEffect(() => {
    if (!showQuestionBank) return;

    const loadQuestionBank = async () => {
      try {
        setBankLoading(true);
        const params = new URLSearchParams();
        params.set('courseId', courseId);
        params.set('limit', '40');
        if (bankFilters.search) params.set('search', bankFilters.search);
        if (bankFilters.phase) params.set('phase', bankFilters.phase);
        if (bankFilters.difficulty) params.set('difficulty', bankFilters.difficulty);

        const response = await fetch(`/api/v1/questions?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to load question bank');

        const data = await response.json();
        setBankQuestions(data.questions || []);
      } catch {
        setBankQuestions([]);
        setFeedback({
          variant: 'error',
          message: isRTL ? 'بارگذاری بانک سوالات ممکن نبود.' : 'Question bank could not be loaded.',
        });
      } finally {
        setBankLoading(false);
      }
    };

    void loadQuestionBank();
  }, [bankFilters, courseId, isRTL, showQuestionBank]);

  const persistLessonDraft = (status: 'draft' | 'published') => {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        lessonTitle,
        lessonDescription,
        duration,
        xpReward,
        contentBlocks,
        quizQuestions,
        status,
        lastSaved: new Date().toISOString(),
      }),
    );
  };

  const handleGenerateContent = async () => {
    if (!aiPrompt.trim()) return;
    
    setIsGenerating(true);
    
    // Simulate AI generation
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    const persianContent = ['## ', aiPrompt, '\n\n', '\u0627\u06cc\u0646 \u0645\u062d\u062a\u0648\u0627 \u0628\u0647 \u0635\u0648\u0631\u062a \u0646\u0645\u0648\u0646\u0647 \u062a\u0648\u0633\u0637 \u0647\u0648\u0634 \u0645\u0635\u0646\u0648\u0639\u06cc \u062a\u0648\u0644\u06cc\u062f \u0634\u062f\u0647 \u0627\u0633\u062a.', '\n\n', '### \u0646\u06a9\u0627\u062a \u06a9\u0644\u06cc\u062f\u06cc:\n', '- \u0646\u06a9\u062a\u0647 \u0627\u0648\u0644 \u0645\u0631\u062a\u0628\u0637 \u0628\u0627 \u0645\u0648\u0636\u0648\u0639\n', '- \u0646\u06a9\u062a\u0647 \u062f\u0648\u0645 \u0628\u0627 \u062a\u0648\u0636\u06cc\u062d \u0628\u06cc\u0634\u062a\u0631\n', '- \u0646\u06a9\u062a\u0647 \u0633\u0648\u0645 \u0628\u0631\u0627\u06cc \u062a\u0639\u0645\u06cc\u0642 \u062f\u0631\u06a9\n\n', '**\u062e\u0644\u0627\u0635\u0647:** \u0627\u06cc\u0646 \u062f\u0631\u0633 \u0628\u0647 \u062f\u0627\u0646\u0634\u200c\u0622\u0645\u0648\u0632\u0627\u0646 \u06a9\u0645\u06a9 \u0645\u06cc\u200c\u06a9\u0646\u062f \u062a\u0627 \u0645\u0641\u0647\u0648\u0645 \u0631\u0627 \u0628\u0647 \u062e\u0648\u0628\u06cc \u062f\u0631\u06a9 \u06a9\u0646\u0646\u062f.'].join('');
    const englishContent = '## ' + aiPrompt + '\n\n'
      + 'This content was generated as a sample by AI assistance.\n\n'
      + '### Key Points:\n'
      + '- First key point related to the topic\n'
      + '- Second key point with more explanation\n'
      + '- Third key point for deeper understanding\n\n'
      + '> **Note:** Review and edit this content to match your students\' needs.\n\n'
      + '**Summary:** This lesson helps students understand the concept clearly.';
    const sampleContent = isRTL ? persianContent : englishContent;
    setGeneratedContent(sampleContent);
    setIsGenerating(false);
  };

  const handleGenerateQuiz = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const q1 = isRTL ? '\u0633\u0648\u0627\u0644 \u0627\u0648\u0644 \u062f\u0631 \u0645\u0648\u0631\u062f: ' + aiPrompt : 'Question 1 about: ' + aiPrompt;
    const q2 = isRTL ? '\u0633\u0648\u0627\u0644 \u062f\u0648\u0645 \u062f\u0631 \u0645\u0648\u0631\u062f: ' + aiPrompt : 'Question 2 about: ' + aiPrompt;
    const optA = isRTL ? '\u06af\u0632\u06cc\u0646\u0647 \u0627\u0644\u0641' : 'Option A';
    const optB = isRTL ? '\u06af\u0632\u06cc\u0646\u0647 \u0628' : 'Option B';
    const optC = isRTL ? '\u06af\u0632\u06cc\u0646\u0647 \u062c' : 'Option C';
    const optD = isRTL ? '\u06af\u0632\u06cc\u0646\u0647 \u062f' : 'Option D';
    const expl = isRTL ? '\u062a\u0648\u0636\u06cc\u062d \u067e\u0627\u0633\u062e \u0635\u062d\u06cc\u062d \u0631\u0627 \u0627\u06cc\u0646\u062c\u0627 \u0628\u0646\u0648\u06cc\u0633\u06cc\u062f.' : 'Write the explanation for the correct answer here.';

    const newQuestions: QuizQuestion[] = [
      {
        id: Date.now().toString(),
        question: q1,
        options: [optA, optB, optC, optD],
        correctAnswer: 0,
        explanation: expl,
      },
      {
        id: (Date.now() + 1).toString(),
        question: q2,
        options: [optA, optB, optC, optD],
        correctAnswer: 1,
        explanation: expl,
      },
    ];
    
    setQuizQuestions([...quizQuestions, ...newQuestions]);
    setIsGenerating(false);
  };

  const handleUseGenerated = () => {
    const newBlock: ContentBlock = {
      id: Date.now().toString(),
      type: 'text',
      content: generatedContent,
      aiGenerated: true,
    };
    setContentBlocks([...contentBlocks, newBlock]);
    setGeneratedContent('');
    setAiPrompt('');
  };

  const handleUpdateBlock = (id: string, content: string) => {
    setContentBlocks(blocks =>
      blocks.map(block => block.id === id ? { ...block, content } : block)
    );
  };

  const handleDeleteBlock = (id: string) => {
    setContentBlocks(blocks => blocks.filter(block => block.id !== id));
  };

  const applyFormattingToBlock = (blockId: string, format: 'bold' | 'italic' | 'link' | 'code') => {
    const wrappers = {
      bold: isRTL ? '**\u0645\u062a\u0646 \u0636\u062e\u06cc\u0645**' : '**bold text**',
      italic: isRTL ? '*\u0645\u062a\u0646 \u0645\u0648\u0631\u0628*' : '*italic text*',
      link: isRTL ? '[\u0645\u062a\u0646 \u0644\u06cc\u0646\u06a9](https://example.com)' : '[link text](https://example.com)',
      code: isRTL ? '`\u06a9\u062f`' : '`code`',
    } as const;

    setContentBlocks((blocks) =>
      blocks.map((block) =>
        block.id === blockId
          ? {
              ...block,
              content: block.content ? block.content + '\n' + wrappers[format] : wrappers[format],
            }
          : block,
      ),
    );
    setFeedback({
      variant: 'info',
      message: isRTL ? 'فرمت به بلوک متنی اضافه شد.' : 'Formatting added to the text block.',
    });
  };

  const handleAddBlock = (type: ContentBlock['type']) => {
    const newBlock: ContentBlock = {
      id: Date.now().toString(),
      type,
      content: '',
    };
    setContentBlocks([...contentBlocks, newBlock]);
  };

  const handleUpdateQuestion = (id: string, field: keyof QuizQuestion, value: any) => {
    setQuizQuestions(questions =>
      questions.map(q => q.id === id ? { ...q, [field]: value } : q)
    );
  };

  const handleDeleteQuestion = (id: string) => {
    setQuizQuestions(questions => questions.filter(q => q.id !== id));
  };

  const handleAddQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: Date.now().toString(),
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      explanation: '',
    };
    setQuizQuestions([...quizQuestions, newQuestion]);
  };

  const handleImportBankQuestion = (question: BankQuestion) => {
    const optionTexts = (question.options || []).map((option) => (isRTL ? option.textFA || option.text : option.text));
    const paddedOptions = [...optionTexts];
    while (paddedOptions.length < 4) {
      paddedOptions.push('');
    }

    const correctAnswer = Math.max(0, (question.options || []).findIndex((option) => option.isCorrect));

    setQuizQuestions((current) => [
      ...current,
      {
        id: `${question.id}-${Date.now()}`,
        question: isRTL ? question.stemFA || question.stem : question.stem,
        options: paddedOptions,
        correctAnswer,
        explanation: isRTL ? question.explanationFA || question.explanation || '' : question.explanation || question.explanationFA || '',
      },
    ]);

    setActiveTab('quiz');

    setFeedback({
      variant: 'success',
      message: isRTL ? 'سوال از بانک سوالات به آزمون درس اضافه شد.' : 'Question imported from the bank into the lesson quiz.',
    });
  };

  const handleUpdateOption = (questionId: string, optionIndex: number, value: string) => {
    setQuizQuestions(questions =>
      questions.map(q =>
        q.id === questionId
          ? { ...q, options: q.options.map((opt, idx) => idx === optionIndex ? value : opt) }
          : q
      )
    );
  };

  const handlePreview = () => {
    window.open(`/${locale}/courses/${courseId}/lessons/${lessonId}`, '_blank');
  };

  const handleSave = async () => {
    if (!lessonTitle.trim()) {
      setFeedback({
        variant: 'error',
        message: isRTL ? 'لطفاً عنوان درس را وارد کنید.' : 'Please enter a lesson title.',
      });
      return;
    }

    const invalidSimulationBlock = contentBlocks.find(
      (block) => block.type === 'simulation' && block.content.trim() && !extractSafeEmbedConfig(block.content).embedUrl,
    );

    if (invalidSimulationBlock) {
      setFeedback({
        variant: 'error',
        message: isRTL
          ? 'برای بلوک شبیه‌سازی، کد iframe یا لینک معتبر وارد کنید.'
          : 'Please enter a valid iframe embed code or URL for the simulation block.',
      });
      return;
    }

    setIsSaving(true);
    setFeedback(null);
    try {
      const response = await fetch(`/api/v1/teacher/lessons/${lessonId}/content`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...createUserHeaders(getStoredUserId()),
        },
        body: JSON.stringify({
          blocks: contentBlocks.map((block, index) => ({
            type: block.type,
            content: block.content,
            title: block.title || `${block.type} block ${index + 1}`,
          })),
          publish: false,
          lessonTitle: isRTL ? lessonTitleEN || lessonTitle : lessonTitle,
          lessonTitleFA: isRTL ? lessonTitle : lessonTitleFA || null,
          estimatedTime: Number(duration) || null,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save lesson');
      }

      const savedAt = new Date();
      persistLessonDraft('draft');
      setLastSaved(savedAt);
      if (isRTL) {
        setLessonTitleFA(lessonTitle);
      } else {
        setLessonTitleEN(lessonTitle);
      }
      setFeedback({
        variant: 'success',
        message: isRTL ? 'درس ذخیره شد.' : 'Lesson saved.',
      });
    } catch (error) {
      setFeedback({
        variant: 'error',
        message: error instanceof Error ? error.message : (isRTL ? 'ذخیره درس ممکن نبود.' : 'Could not save the lesson.'),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!lessonTitle.trim()) {
      setFeedback({
        variant: 'error',
        message: isRTL ? 'لطفاً عنوان درس را وارد کنید.' : 'Please enter a lesson title.',
      });
      return;
    }

    if (contentBlocks.every(b => !b.content.trim())) {
      setFeedback({
        variant: 'error',
        message: isRTL ? 'لطفاً محتوایی ایجاد کنید.' : 'Please add some content.',
      });
      return;
    }

    setShowPublishDialog(true);
  };

  const confirmPublish = async () => {
    const invalidSimulationBlock = contentBlocks.find(
      (block) => block.type === 'simulation' && block.content.trim() && !extractSafeEmbedConfig(block.content).embedUrl,
    );

    if (invalidSimulationBlock) {
      setFeedback({
        variant: 'error',
        message: isRTL
          ? 'برای انتشار، بلوک شبیه‌سازی باید iframe یا لینک معتبر داشته باشد.'
          : 'To publish, every simulation block must contain a valid iframe embed code or URL.',
      });
      setShowPublishDialog(false);
      return;
    }

    setIsPublishing(true);
    setFeedback(null);
    try {
      const response = await fetch(`/api/v1/teacher/lessons/${lessonId}/content`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...createUserHeaders(getStoredUserId()),
        },
        body: JSON.stringify({
          blocks: contentBlocks.map((block, index) => ({
            type: block.type,
            content: block.content,
            title: block.title || `${block.type} block ${index + 1}`,
          })),
          publish: true,
          lessonTitle: isRTL ? lessonTitleEN || lessonTitle : lessonTitle,
          lessonTitleFA: isRTL ? lessonTitle : lessonTitleFA || null,
          estimatedTime: Number(duration) || null,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to publish lesson');
      }

      const savedAt = new Date();
      persistLessonDraft('published');
      setLastSaved(savedAt);
      if (isRTL) {
        setLessonTitleFA(lessonTitle);
      } else {
        setLessonTitleEN(lessonTitle);
      }
      setShowPublishDialog(false);
      setFeedback({
        variant: 'success',
        message: isRTL ? 'درس با موفقیت منتشر شد.' : 'Lesson published successfully.',
      });
    } catch (error) {
      setFeedback({
        variant: 'error',
        message: error instanceof Error ? error.message : (isRTL ? 'انتشار درس ممکن نبود.' : 'Could not publish the lesson.'),
      });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b shrink-0">
        <div className="max-w-full mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link 
              href={`/${locale}/teacher/courses/${courseId}`}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <Arrow className="h-4 w-4" />
            </Link>
            <div className="h-5 w-px bg-border" />
            <input
              type="text"
              value={lessonTitle}
              onChange={(e) => setLessonTitle(e.target.value)}
              className="font-semibold bg-transparent border-none focus:outline-none focus:ring-0 max-w-xs"
              placeholder={isRTL ? 'عنوان درس...' : 'Lesson title...'}
            />
          </div>
          <div className="flex items-center gap-2">
            {lastSaved && (
              <span className="text-xs text-muted-foreground hidden lg:inline">
                {isRTL ? 'آخرین ذخیره: ' : 'Saved: '}{lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <button
              onClick={() => setShowAIPanel(!showAIPanel)}
              className={`p-2 rounded-lg border transition-colors ${showAIPanel ? 'bg-purple-100 border-purple-300 text-purple-700' : 'hover:bg-muted'}`}
            >
              <Sparkles className="h-4 w-4" />
            </button>
            <button 
              onClick={handlePreview}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border hover:bg-muted text-sm"
            >
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">{isRTL ? 'پیش‌نمایش' : 'Preview'}</span>
            </button>
            <button
              onClick={() => setShowQuestionBank(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border hover:bg-muted text-sm"
            >
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">{isRTL ? 'بانک سوالات' : 'Question Bank'}</span>
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border hover:bg-muted text-sm disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">{isRTL ? 'ذخیره' : 'Save'}</span>
            </button>
            <button 
              onClick={handlePublish}
              disabled={isPublishing}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm disabled:opacity-50"
            >
              {isPublishing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">{isRTL ? 'انتشار' : 'Publish'}</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 border-t bg-muted/30">
          {(['content', 'quiz', 'settings'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'content' ? (isRTL ? 'محتوا' : 'Content') :
               tab === 'quiz' ? (isRTL ? 'آزمون' : 'Quiz') :
               (isRTL ? 'تنظیمات' : 'Settings')}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor Area */}
        <div className={`flex-1 overflow-y-auto p-4 ${showAIPanel ? 'lg:pe-0' : ''}`}>
          {feedback ? <FeedbackBanner className="mx-auto mb-4 max-w-3xl" variant={feedback.variant} message={feedback.message} /> : null}

          {/* Content Tab */}
          {activeTab === 'content' && (
            <div className="max-w-3xl mx-auto space-y-4">
              <div className="bg-card border rounded-xl p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-medium">{isRTL ? 'جریان طراحی سوال و ارزیابی' : 'Question & Assessment Workflow'}</h3>
                  <p className="text-sm text-muted-foreground">
                    {courseContext
                      ? (isRTL
                          ? `بانک سوالات برای ${courseContext.title} به‌صورت خودکار فقط سوالات مرتبط با موضوع و پایه این دوره را نشان می‌دهد.`
                          : `The question bank for ${courseContext.title} automatically shows only questions related to this course subject and grade.`)
                      : (isRTL
                          ? 'بانک سوالات درس را باز کنید و سوال‌های مناسب را به بخش آزمون همین درس اضافه کنید.'
                          : 'Open the lesson question bank and add suitable items directly into this lesson quiz.')} 
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setShowQuestionBank(true)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border hover:bg-muted text-sm"
                  >
                    <List className="h-4 w-4" />
                    {isRTL ? 'باز کردن بانک سوالات' : 'Open Question Bank'}
                  </button>
                  <button
                    onClick={() => setActiveTab('quiz')}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm"
                  >
                    <HelpCircle className="h-4 w-4" />
                    {isRTL ? 'رفتن به بخش آزمون' : 'Go to Quiz Builder'}
                  </button>
                </div>
              </div>

              {/* Description */}
              <div className="bg-card border rounded-xl p-4">
                <label className="text-sm text-muted-foreground mb-2 block">
                  {isRTL ? 'توضیحات کوتاه' : 'Short Description'}
                </label>
                <textarea
                  value={lessonDescription}
                  onChange={(e) => setLessonDescription(e.target.value)}
                  rows={2}
                  className="w-full p-2 rounded-lg border bg-background resize-none text-sm"
                  placeholder={isRTL ? 'توضیح مختصر درس...' : 'Brief lesson description...'}
                />
              </div>

              {/* Content Blocks */}
              {contentBlocks.map((block, index) => (
                <div 
                  key={block.id}
                  className="bg-card border rounded-xl overflow-hidden group"
                >
                  <div className="flex items-center gap-2 p-2 bg-muted/30 border-b">
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    <span className="text-sm font-medium flex items-center gap-2">
                      {block.type === 'text' && <FileText className="h-4 w-4" />}
                      {block.type === 'video' && <Video className="h-4 w-4" />}
                      {block.type === 'image' && <Image className="h-4 w-4" />}
                      {block.type === 'simulation' && <Code className="h-4 w-4" />}
                      {isRTL ? `بلوک ${index + 1}` : `Block ${index + 1}`}
                      {block.aiGenerated && (
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs flex items-center gap-1">
                          <Sparkles className="h-3 w-3" /> AI
                        </span>
                      )}
                    </span>
                    <div className="flex-1" />
                    
                    {/* Text formatting toolbar for text blocks */}
                    {block.type === 'text' && (
                      <div className="hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => applyFormattingToBlock(block.id, 'bold')} className="p-1 rounded hover:bg-background"><Bold className="h-3 w-3" /></button>
                        <button onClick={() => applyFormattingToBlock(block.id, 'italic')} className="p-1 rounded hover:bg-background"><Italic className="h-3 w-3" /></button>
                        <button onClick={() => applyFormattingToBlock(block.id, 'link')} className="p-1 rounded hover:bg-background"><Link2 className="h-3 w-3" /></button>
                        <button onClick={() => applyFormattingToBlock(block.id, 'code')} className="p-1 rounded hover:bg-background"><Code className="h-3 w-3" /></button>
                      </div>
                    )}
                    
                    <button
                      onClick={() => handleDeleteBlock(block.id)}
                      className="p-1 text-destructive opacity-0 group-hover:opacity-100 hover:bg-destructive/10 rounded transition-opacity"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="p-3">
                    {block.type === 'text' && (
                      <textarea
                        value={block.content}
                        onChange={(e) => handleUpdateBlock(block.id, e.target.value)}
                        placeholder={isRTL ? 'محتوا را اینجا بنویسید... (Markdown پشتیبانی می‌شود)' : 'Write content here... (Markdown supported)'}
                        className="w-full min-h-[200px] p-2 rounded-lg border-0 bg-transparent resize-y focus:outline-none focus:ring-0"
                        dir={isRTL ? 'rtl' : 'ltr'}
                      />
                    )}
                    
                    {block.type === 'video' && (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={block.content}
                          onChange={(e) => handleUpdateBlock(block.id, e.target.value)}
                          placeholder={isRTL ? 'لینک ویدیو (YouTube, Aparat, ...)' : 'Video URL (YouTube, Vimeo, ...)'}
                          className="w-full p-2 rounded-lg border bg-background text-sm"
                        />
                        <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                          <Video className="h-12 w-12 text-muted-foreground" />
                          <span className="ms-2 text-muted-foreground">{isRTL ? 'پیش‌نمایش ویدیو' : 'Video Preview'}</span>
                        </div>
                      </div>
                    )}
                    
                    {block.type === 'image' && (
                      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center border-2 border-dashed cursor-pointer hover:bg-muted/80">
                        <div className="text-center">
                          <Image className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">
                            {isRTL ? 'کلیک کنید یا تصویر را بکشید' : 'Click or drag image here'}
                          </p>
                        </div>
                      </div>
                    )}

                    {block.type === 'simulation' && (() => {
                      const embed = extractSafeEmbedConfig(block.content);
                      return (
                        <div className="space-y-3">
                          <textarea
                            value={block.content}
                            onChange={(e) => handleUpdateBlock(block.id, e.target.value)}
                            placeholder={isRTL ? 'کد iframe یا لینک شبیه‌سازی را اینجا قرار دهید...' : 'Paste iframe embed code or a simulation URL here...'}
                            className="w-full min-h-[140px] rounded-lg border bg-background p-3 text-sm"
                            dir="ltr"
                          />
                          <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
                            {isRTL
                              ? 'فقط کد iframe یا لینک مستقیم/Embed امن پشتیبانی می‌شود. اسکریپت‌های دلخواه برای امنیت اجرا نمی‌شوند.'
                              : 'Only safe iframe embed code or direct/embed URLs are supported. Custom scripts are not executed for security.'}
                          </div>
                          {embed.embedUrl ? (
                            <>
                              <div className="aspect-video overflow-hidden rounded-xl border bg-background shadow-sm">
                                <iframe
                                  src={embed.embedUrl}
                                  className="h-full w-full"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                                  allowFullScreen
                                  loading="lazy"
                                  title={block.title || 'Simulation preview'}
                                />
                              </div>
                              <a
                                href={normalizeExternalEmbedUrl(embed.embedUrl)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                              >
                                {isRTL ? 'باز کردن در پنجره جدید' : 'Open in a new tab'}
                                <Link2 className="h-4 w-4" />
                              </a>
                            </>
                          ) : block.content.trim() ? (
                            <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-300">
                              {isRTL
                                ? 'کد واردشده iframe معتبر یا لینک قابل‌جاسازی ندارد.'
                                : 'The pasted content does not include a valid embeddable iframe or URL.'}
                            </div>
                          ) : null}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              ))}

              {/* Add Block Buttons */}
              <div className="flex flex-wrap gap-2">
                {[
                  { type: 'text' as const, icon: FileText, label: isRTL ? 'متن' : 'Text' },
                  { type: 'video' as const, icon: Video, label: isRTL ? 'ویدیو' : 'Video' },
                  { type: 'image' as const, icon: Image, label: isRTL ? 'تصویر' : 'Image' },
                  { type: 'simulation' as const, icon: Code, label: isRTL ? 'HTML / شبیه‌سازی' : 'HTML / Simulation' },
                ].map((item) => (
                  <button
                    key={item.type}
                    onClick={() => handleAddBlock(item.type)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border hover:bg-muted text-sm"
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quiz Tab */}
          {activeTab === 'quiz' && (
            <div className="max-w-3xl mx-auto space-y-4">
              <div className="bg-card border rounded-xl p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-medium">{isRTL ? 'بانک سوالات درس' : 'Lesson Question Bank'}</h3>
                  <p className="text-sm text-muted-foreground">
                    {courseContext
                      ? (isRTL
                          ? `سوالات مرتبط با ${courseContext.title} به‌صورت خودکار بر اساس موضوع و پایه این دوره نمایش داده می‌شوند.`
                          : `Questions are automatically narrowed to ${courseContext.title} based on the course subject and grade.`)
                      : (isRTL ? 'سوالات مرتبط با این درس را از بانک سوالات وارد کنید.' : 'Import course-related questions directly from the bank.')} 
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setShowQuestionBank(true)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border hover:bg-muted text-sm"
                  >
                    <List className="h-4 w-4" />
                    {isRTL ? 'ورود از بانک سوالات' : 'Import from Question Bank'}
                  </button>
                  <Link
                    href={`/${locale}/teacher/assessments/create?courseId=${courseId}`}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm"
                  >
                    <HelpCircle className="h-4 w-4" />
                    {isRTL ? 'ساخت آزمون کامل' : 'Build Full Assessment'}
                  </Link>
                </div>
              </div>

              {/* AI Quiz Generator */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    <h3 className="font-medium">{isRTL ? 'تولید سوال با AI' : 'AI Question Generator'}</h3>
                  </div>
                  <button
                    onClick={handleGenerateQuiz}
                    disabled={isGenerating}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 text-sm"
                  >
                    {isGenerating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Wand2 className="h-4 w-4" />
                    )}
                    {isRTL ? 'تولید سوال' : 'Generate'}
                  </button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {isRTL 
                    ? 'بر اساس محتوای درس، سوالات چهارگزینه‌ای تولید کنید'
                    : 'Generate multiple choice questions based on lesson content'}
                </p>
              </div>

              {/* Questions */}
              {quizQuestions.map((question, qIndex) => (
                <div key={question.id} className="bg-card border rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-sm flex items-center justify-center font-medium">
                      {qIndex + 1}
                    </span>
                    <span className="font-medium text-sm">{isRTL ? `سوال ${qIndex + 1}` : `Question ${qIndex + 1}`}</span>
                    <div className="flex-1" />
                    <button 
                      onClick={() => handleDeleteQuestion(question.id)}
                      className="p-1 text-destructive hover:bg-destructive/10 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <textarea
                    value={question.question}
                    onChange={(e) => handleUpdateQuestion(question.id, 'question', e.target.value)}
                    placeholder={isRTL ? 'متن سوال...' : 'Question text...'}
                    className="w-full p-2 rounded-lg border bg-background mb-3 text-sm"
                    rows={2}
                  />

                  <div className="space-y-2 mb-3">
                    {question.options.map((option, oIndex) => (
                      <div key={oIndex} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`q-${question.id}`}
                          checked={question.correctAnswer === oIndex}
                          onChange={() => handleUpdateQuestion(question.id, 'correctAnswer', oIndex)}
                          className="h-4 w-4 text-primary"
                        />
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...question.options];
                            newOptions[oIndex] = e.target.value;
                            handleUpdateQuestion(question.id, 'options', newOptions);
                          }}
                          placeholder={isRTL ? `گزینه ${oIndex + 1}` : `Option ${oIndex + 1}`}
                          className="flex-1 p-2 rounded-lg border bg-background text-sm"
                        />
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      {isRTL ? 'توضیح پاسخ صحیح' : 'Explanation'}
                    </label>
                    <textarea
                      value={question.explanation}
                      onChange={(e) => handleUpdateQuestion(question.id, 'explanation', e.target.value)}
                      placeholder={isRTL ? 'چرا این گزینه صحیح است...' : 'Why is this answer correct...'}
                      className="w-full p-2 rounded-lg border bg-background text-sm"
                      rows={2}
                    />
                  </div>
                </div>
              ))}

              {/* Add Question Button */}
              <button
                onClick={() => {
                  const newQ: QuizQuestion = {
                    id: Date.now().toString(),
                    question: '',
                    options: ['', '', '', ''],
                    correctAnswer: 0,
                    explanation: '',
                  };
                  setQuizQuestions([...quizQuestions, newQ]);
                }}
                className="w-full p-4 border-2 border-dashed rounded-xl text-muted-foreground hover:text-foreground hover:border-primary/50 flex items-center justify-center gap-2"
              >
                <Plus className="h-5 w-5" />
                {isRTL ? 'افزودن سوال' : 'Add Question'}
              </button>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="max-w-xl mx-auto space-y-4">
              <div className="bg-card border rounded-xl p-4 space-y-4">
                <h3 className="font-medium">{isRTL ? 'تنظیمات درس' : 'Lesson Settings'}</h3>
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">
                      {isRTL ? 'مدت زمان (دقیقه)' : 'Duration (min)'}
                    </label>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <input
                        type="number"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        className="flex-1 p-2 rounded-lg border bg-background"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">
                      {isRTL ? 'امتیاز (XP)' : 'XP Reward'}
                    </label>
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-muted-foreground" />
                      <input
                        type="number"
                        value={xpReward}
                        onChange={(e) => setXpReward(e.target.value)}
                        className="flex-1 p-2 rounded-lg border bg-background"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">
                    {isRTL ? 'پیش‌نیازها' : 'Prerequisites'}
                  </label>
                  <select className="w-full p-2 rounded-lg border bg-background">
                    <option value="">{isRTL ? 'بدون پیش‌نیاز' : 'No prerequisite'}</option>
                    <option>{isRTL ? 'درس قبلی' : 'Previous lesson'}</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* AI Panel */}
        {showAIPanel && (
          <div className="w-80 border-s bg-card shrink-0 hidden lg:flex lg:flex-col overflow-hidden">
            <div className="p-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  <span className="font-medium">{isRTL ? 'دستیار AI' : 'AI Assistant'}</span>
                </div>
                <button 
                  onClick={() => setShowAIPanel(false)}
                  className="p-1 hover:bg-white/20 rounded"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {/* Quick Templates */}
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">
                  {isRTL ? 'الگوها' : 'Templates'}
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {aiTemplates.map(template => (
                    <button
                      key={template.id}
                      onClick={() => setAiPrompt(template.prompt)}
                      className="p-2 rounded-lg border hover:border-primary/50 text-xs text-start"
                    >
                      {template.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Prompt */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  {isRTL ? 'دستور شما' : 'Your Prompt'}
                </label>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder={isRTL ? 'چه محتوایی نیاز دارید...' : 'What content do you need...'}
                  className="w-full p-2 rounded-lg border bg-background resize-none text-sm"
                  rows={4}
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
              </div>

              <button
                onClick={handleGenerateContent}
                disabled={isGenerating || !aiPrompt.trim()}
                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium text-sm hover:opacity-90 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {isRTL ? 'در حال تولید...' : 'Generating...'}
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" />
                    {isRTL ? 'تولید' : 'Generate'}
                  </>
                )}
              </button>

              {/* Generated Content */}
              {generatedContent && (
                <div className="bg-background rounded-lg border p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium flex items-center gap-1">
                      <Check className="h-3 w-3 text-green-600" />
                      {isRTL ? 'تولید شد' : 'Generated'}
                    </span>
                    <button
                      onClick={() => navigator.clipboard.writeText(generatedContent)}
                      className="p-1 hover:bg-muted rounded"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="text-xs text-muted-foreground max-h-40 overflow-y-auto whitespace-pre-wrap mb-2">
                    {generatedContent.slice(0, 200)}...
                  </div>
                  <button
                    onClick={handleUseGenerated}
                    className="w-full p-2 rounded-lg bg-green-600 text-white text-xs hover:bg-green-700"
                  >
                    {isRTL ? 'اضافه کردن به محتوا' : 'Add to Content'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isRTL ? 'انتشار درس' : 'Publish lesson'}</DialogTitle>
            <DialogDescription>
              {isRTL ? 'با انتشار این درس، دانش‌آموزان می‌توانند آن را مشاهده کنند.' : 'Publishing will make this lesson visible to students.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button type="button" onClick={() => setShowPublishDialog(false)} className="rounded-lg border px-4 py-2 hover:bg-muted">
              {isRTL ? 'انصراف' : 'Cancel'}
            </button>
            <button type="button" onClick={confirmPublish} disabled={isPublishing} className="rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              {isPublishing ? (isRTL ? 'در حال انتشار...' : 'Publishing...') : (isRTL ? 'تأیید انتشار' : 'Confirm publish')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showQuestionBank} onOpenChange={setShowQuestionBank}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>{isRTL ? 'بانک سوالات مرتبط با درس' : 'Course-Aligned Question Bank'}</DialogTitle>
            <DialogDescription>
              {isRTL
                ? 'سوالات بر اساس دوره انتخاب‌شده فیلتر شده‌اند. سوال‌های مناسب را مستقیماً به آزمون این درس اضافه کنید.'
                : 'Questions are filtered for the current course. Add suitable items directly into this lesson quiz.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-4">
              <input
                type="text"
                value={bankFilters.search}
                onChange={(e) => setBankFilters((current) => ({ ...current, search: e.target.value }))}
                placeholder={isRTL ? 'جستجوی سوال...' : 'Search questions...'}
                className="rounded-lg border bg-background px-3 py-2 text-sm"
              />
              <select
                value={bankFilters.phase}
                onChange={(e) => setBankFilters((current) => ({ ...current, phase: e.target.value }))}
                className="rounded-lg border bg-background px-3 py-2 text-sm"
              >
                <option value="">{isRTL ? 'همه فازهای ۵ت' : 'All 5E phases'}</option>
                <option value="5E_ENGAGE">{isRTL ? 'تأثیر' : 'Engage'}</option>
                <option value="5E_EXPLORE">{isRTL ? 'تحقیق' : 'Explore'}</option>
                <option value="5E_EXPLAIN">{isRTL ? 'توضیح' : 'Explain'}</option>
                <option value="5E_ELABORATE">{isRTL ? 'تعمیم' : 'Elaborate'}</option>
                <option value="5E_EVALUATE">{isRTL ? 'تعیین' : 'Evaluate'}</option>
              </select>
              <select
                value={bankFilters.difficulty}
                onChange={(e) => setBankFilters((current) => ({ ...current, difficulty: e.target.value }))}
                className="rounded-lg border bg-background px-3 py-2 text-sm"
              >
                <option value="">{isRTL ? 'همه سطوح' : 'All difficulties'}</option>
                <option value="EASY">{isRTL ? 'آسان' : 'Easy'}</option>
                <option value="MEDIUM">{isRTL ? 'متوسط' : 'Medium'}</option>
                <option value="HARD">{isRTL ? 'سخت' : 'Hard'}</option>
                <option value="EXPERT">{isRTL ? 'خبره' : 'Expert'}</option>
              </select>
              <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                {courseContext
                  ? `${courseContext.subjectCode || '—'} • ${courseContext.gradeCode || '—'}`
                  : (isRTL ? 'در حال بارگذاری دوره...' : 'Loading course context...')}
              </div>
            </div>

            <div className="max-h-[50vh] overflow-y-auto space-y-3 pr-1">
              {bankLoading ? (
                <div className="py-12 text-center text-muted-foreground">
                  <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin" />
                  {isRTL ? 'در حال بارگذاری سوالات...' : 'Loading questions...'}
                </div>
              ) : bankQuestions.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  {isRTL ? 'سوالی برای این دوره پیدا نشد.' : 'No questions were found for this course.'}
                </div>
              ) : (
                bankQuestions.map((question) => (
                  <div key={question.id} className="rounded-xl border bg-card p-4">
                    <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
                      {question.metadata?.phase5E ? (
                        <span className="rounded-full bg-purple-100 px-2 py-1 text-purple-700">
                          {question.metadata.phase5E}
                        </span>
                      ) : null}
                      <span className="rounded-full bg-muted px-2 py-1 text-muted-foreground">{question.difficulty}</span>
                    </div>
                    <p className="mb-3 text-sm font-medium">{isRTL ? question.stemFA || question.stem : question.stem}</p>
                    {question.options?.length ? (
                      <div className="mb-3 space-y-1 text-xs text-muted-foreground">
                        {question.options.slice(0, 4).map((option) => (
                          <div key={option.id} className="flex items-start gap-2">
                            <span>{option.isCorrect ? '✓' : '○'}</span>
                            <span>{isRTL ? option.textFA || option.text : option.text}</span>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleImportBankQuestion(question)}
                        className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90"
                      >
                        <Plus className="h-4 w-4" />
                        {isRTL ? 'افزودن به آزمون' : 'Add to Quiz'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <DialogFooter>
            <button type="button" onClick={() => setShowQuestionBank(false)} className="rounded-lg border px-4 py-2 hover:bg-muted">
              {isRTL ? 'بستن' : 'Close'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
