'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { 
  BookOpen, ArrowLeft, ArrowRight, Sparkles, FileText, Video,
  Image, List, HelpCircle, Loader2, Check, Copy, Wand2,
  ChevronDown, Plus, Trash2, GripVertical, Eye, Save, Send
} from 'lucide-react';

type ContentType = 'text' | 'video' | 'image' | 'quiz' | 'activity';

interface ContentBlock {
  id: string;
  type: ContentType;
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

export default function ContentCreator({ params: { locale } }: { params: { locale: string } }) {
  const t = useTranslations();
  const isRTL = locale === 'fa';
  const Arrow = isRTL ? ArrowRight : ArrowLeft;

  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedLesson, setSelectedLesson] = useState('');
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([
    { id: '1', type: 'text', content: '' }
  ]);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [activeTab, setActiveTab] = useState<'editor' | 'quiz' | 'preview'>('editor');
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);

  const courses = [
    { id: '1', name: isRTL ? 'ریاضی پایه هشتم' : 'Grade 8 Mathematics' },
    { id: '2', name: isRTL ? 'ریاضی پایه نهم' : 'Grade 9 Mathematics' },
    { id: '3', name: isRTL ? 'هندسه پایه دهم' : 'Grade 10 Geometry' },
  ];

  const lessons = [
    { id: 'l1', name: isRTL ? 'مقدمه‌ای بر معادلات' : 'Introduction to Equations' },
    { id: 'l2', name: isRTL ? 'حل معادلات خطی' : 'Solving Linear Equations' },
    { id: 'l3', name: isRTL ? 'معادلات درجه دوم' : 'Quadratic Equations' },
  ];

  const aiTemplates = [
    {
      id: 'explain',
      title: isRTL ? 'توضیح مفهوم' : 'Explain Concept',
      icon: FileText,
      prompt: isRTL 
        ? 'مفهوم زیر را به زبان ساده و با مثال‌های کاربردی توضیح بده:'
        : 'Explain the following concept in simple terms with practical examples:',
    },
    {
      id: 'examples',
      title: isRTL ? 'ایجاد مثال' : 'Create Examples',
      icon: List,
      prompt: isRTL
        ? 'چند مثال حل‌شده برای موضوع زیر ایجاد کن:'
        : 'Create solved examples for the following topic:',
    },
    {
      id: 'quiz',
      title: isRTL ? 'تولید آزمون' : 'Generate Quiz',
      icon: HelpCircle,
      prompt: isRTL
        ? 'سوالات چهارگزینه‌ای برای موضوع زیر ایجاد کن:'
        : 'Create multiple choice questions for the following topic:',
    },
    {
      id: 'summary',
      title: isRTL ? 'خلاصه درس' : 'Lesson Summary',
      icon: Sparkles,
      prompt: isRTL
        ? 'یک خلاصه جامع از درس زیر بنویس:'
        : 'Write a comprehensive summary of the following lesson:',
    },
  ];

  const handleGenerateContent = async () => {
    if (!aiPrompt.trim()) return;
    
    setIsGenerating(true);
    
    // Simulate AI generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const sampleContent = isRTL 
      ? `## معادلات درجه اول

معادله درجه اول معادله‌ای است که توان مجهول در آن یک است. فرم کلی این معادله به صورت ax + b = 0 است که در آن a و b اعداد ثابت و x مجهول معادله است.

### مراحل حل معادله:
1. **جدا کردن مجهول**: ابتدا عبارت‌های حاوی x را به یک طرف معادله منتقل کنید
2. **ساده‌سازی**: عبارات مشابه را با هم جمع کنید
3. **محاسبه جواب**: با تقسیم کردن، مقدار x را بیابید

### مثال:
حل معادله 2x + 6 = 14

**حل:**
- مرحله ۱: انتقال 6 به سمت راست: 2x = 14 - 6
- مرحله ۲: ساده‌سازی: 2x = 8
- مرحله ۳: تقسیم بر 2: x = 4

✅ **جواب: x = 4**

### نکات کلیدی:
- همیشه عملیات یکسان را در دو طرف معادله انجام دهید
- جواب را در معادله جایگذاری کرده و صحت آن را بررسی کنید`
      : `## First Degree Equations

A first degree equation is an equation where the power of the unknown is one. The general form is ax + b = 0, where a and b are constants and x is the unknown.

### Steps to Solve:
1. **Isolate the variable**: Move terms with x to one side
2. **Simplify**: Combine like terms
3. **Calculate**: Divide to find x

### Example:
Solve 2x + 6 = 14

**Solution:**
- Step 1: Move 6 to the right: 2x = 14 - 6
- Step 2: Simplify: 2x = 8
- Step 3: Divide by 2: x = 4

✅ **Answer: x = 4**

### Key Points:
- Always perform the same operation on both sides
- Verify your answer by substituting back`;

    setGeneratedContent(sampleContent);
    setIsGenerating(false);
  };

  const handleAddBlock = (type: ContentType) => {
    const newBlock: ContentBlock = {
      id: Date.now().toString(),
      type,
      content: '',
    };
    setContentBlocks([...contentBlocks, newBlock]);
  };

  const handleUpdateBlock = (id: string, content: string) => {
    setContentBlocks(blocks =>
      blocks.map(block =>
        block.id === id ? { ...block, content } : block
      )
    );
  };

  const handleDeleteBlock = (id: string) => {
    setContentBlocks(blocks => blocks.filter(block => block.id !== id));
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

  const handleGenerateQuiz = async () => {
    setIsGenerating(true);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const sampleQuestions: QuizQuestion[] = [
      {
        id: '1',
        question: isRTL ? 'حاصل معادله 3x + 9 = 0 چیست؟' : 'What is the solution to 3x + 9 = 0?',
        options: isRTL ? ['x = 3', 'x = -3', 'x = 9', 'x = -9'] : ['x = 3', 'x = -3', 'x = 9', 'x = -9'],
        correctAnswer: 1,
        explanation: isRTL 
          ? '3x = -9، پس x = -3'
          : '3x = -9, so x = -3',
      },
      {
        id: '2',
        question: isRTL ? 'کدام گزینه معادله درجه اول است؟' : 'Which is a first degree equation?',
        options: ['x² + 2 = 0', '2x + 5 = 11', 'x³ = 8', '1/x = 2'],
        correctAnswer: 1,
        explanation: isRTL
          ? 'معادله درجه اول معادله‌ای است که توان مجهول برابر ۱ باشد'
          : 'A first degree equation has the unknown to the power of 1',
      },
      {
        id: '3',
        question: isRTL ? 'اگر 5x - 10 = 15 باشد، x چقدر است؟' : 'If 5x - 10 = 15, what is x?',
        options: ['x = 1', 'x = 3', 'x = 5', 'x = 25'],
        correctAnswer: 2,
        explanation: isRTL
          ? '5x = 25، پس x = 5'
          : '5x = 25, so x = 5',
      },
    ];
    
    setQuizQuestions(sampleQuestions);
    setIsGenerating(false);
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href={`/${locale}/teacher`}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <Arrow className="h-5 w-5" />
              <span>{isRTL ? 'بازگشت' : 'Back'}</span>
            </Link>
            <div className="h-6 w-px bg-border" />
            <h1 className="font-semibold">{isRTL ? 'ایجاد محتوای درسی' : 'Create Lesson Content'}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-muted">
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">{isRTL ? 'پیش‌نمایش' : 'Preview'}</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-muted">
              <Save className="h-4 w-4" />
              <span className="hidden sm:inline">{isRTL ? 'ذخیره' : 'Save'}</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">{isRTL ? 'انتشار' : 'Publish'}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Editor - 2/3 */}
          <div className="lg:col-span-2 space-y-6">
            {/* Course & Lesson Selection */}
            <div className="bg-card border rounded-xl p-4">
              <h2 className="font-semibold mb-4">{isRTL ? 'انتخاب دوره و درس' : 'Select Course & Lesson'}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">
                    {isRTL ? 'دوره' : 'Course'}
                  </label>
                  <select
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="w-full p-3 rounded-lg border bg-background"
                  >
                    <option value="">{isRTL ? 'انتخاب کنید...' : 'Select...'}</option>
                    {courses.map(course => (
                      <option key={course.id} value={course.id}>{course.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">
                    {isRTL ? 'درس' : 'Lesson'}
                  </label>
                  <select
                    value={selectedLesson}
                    onChange={(e) => setSelectedLesson(e.target.value)}
                    className="w-full p-3 rounded-lg border bg-background"
                    disabled={!selectedCourse}
                  >
                    <option value="">{isRTL ? 'انتخاب کنید...' : 'Select...'}</option>
                    {lessons.map(lesson => (
                      <option key={lesson.id} value={lesson.id}>{lesson.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b">
              <button
                onClick={() => setActiveTab('editor')}
                className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                  activeTab === 'editor' 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {isRTL ? 'ویرایشگر محتوا' : 'Content Editor'}
              </button>
              <button
                onClick={() => setActiveTab('quiz')}
                className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                  activeTab === 'quiz' 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {isRTL ? 'آزمون' : 'Quiz'}
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                  activeTab === 'preview' 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {isRTL ? 'پیش‌نمایش' : 'Preview'}
              </button>
            </div>

            {/* Content Editor Tab */}
            {activeTab === 'editor' && (
              <div className="space-y-4">
                {/* Content Blocks */}
                {contentBlocks.map((block, index) => (
                  <div 
                    key={block.id}
                    className="bg-card border rounded-xl p-4 group relative"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                      <span className="text-sm font-medium">
                        {isRTL ? `بلوک ${index + 1}` : `Block ${index + 1}`}
                        {block.aiGenerated && (
                          <span className="ms-2 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs">
                            <Sparkles className="h-3 w-3 inline me-1" />
                            AI
                          </span>
                        )}
                      </span>
                      <div className="flex-1" />
                      <button
                        onClick={() => handleDeleteBlock(block.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-destructive hover:bg-destructive/10 rounded transition-opacity"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    
                    {block.type === 'text' && (
                      <textarea
                        value={block.content}
                        onChange={(e) => handleUpdateBlock(block.id, e.target.value)}
                        placeholder={isRTL ? 'محتوای درس را اینجا بنویسید... (از Markdown پشتیبانی می‌شود)' : 'Write lesson content here... (Markdown supported)'}
                        className="w-full min-h-[200px] p-3 rounded-lg border bg-background resize-y"
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
                          className="w-full p-3 rounded-lg border bg-background"
                        />
                        <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                          <Video className="h-12 w-12 text-muted-foreground" />
                        </div>
                      </div>
                    )}
                    
                    {block.type === 'image' && (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={block.content}
                          onChange={(e) => handleUpdateBlock(block.id, e.target.value)}
                          placeholder={isRTL ? 'لینک تصویر یا آپلود کنید' : 'Image URL or upload'}
                          className="w-full p-3 rounded-lg border bg-background"
                        />
                        <div className="aspect-video bg-muted rounded-lg flex items-center justify-center border-2 border-dashed cursor-pointer hover:bg-muted/80">
                          <div className="text-center">
                            <Image className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">
                              {isRTL ? 'کلیک کنید یا تصویر را بکشید' : 'Click or drag image here'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Add Block Buttons */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleAddBlock('text')}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-muted"
                  >
                    <FileText className="h-4 w-4" />
                    {isRTL ? 'متن' : 'Text'}
                  </button>
                  <button
                    onClick={() => handleAddBlock('video')}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-muted"
                  >
                    <Video className="h-4 w-4" />
                    {isRTL ? 'ویدیو' : 'Video'}
                  </button>
                  <button
                    onClick={() => handleAddBlock('image')}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-muted"
                  >
                    <Image className="h-4 w-4" />
                    {isRTL ? 'تصویر' : 'Image'}
                  </button>
                </div>
              </div>
            )}

            {/* Quiz Tab */}
            {activeTab === 'quiz' && (
              <div className="space-y-4">
                {/* AI Quiz Generator */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    <h3 className="font-semibold">{isRTL ? 'تولید آزمون با هوش مصنوعی' : 'AI Quiz Generator'}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    {isRTL 
                      ? 'موضوع درس را وارد کنید تا سوالات چهارگزینه‌ای به صورت خودکار تولید شود'
                      : 'Enter the lesson topic to automatically generate multiple choice questions'}
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder={isRTL ? 'مثال: معادلات درجه اول' : 'e.g., Linear Equations'}
                      className="flex-1 p-3 rounded-lg border bg-background"
                    />
                    <button
                      onClick={handleGenerateQuiz}
                      disabled={isGenerating || !aiPrompt.trim()}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
                    >
                      {isGenerating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Wand2 className="h-4 w-4" />
                      )}
                      {isRTL ? 'تولید' : 'Generate'}
                    </button>
                  </div>
                </div>

                {/* Quiz Questions */}
                {quizQuestions.map((question, qIndex) => (
                  <div key={question.id} className="bg-card border rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-sm flex items-center justify-center font-medium">
                        {qIndex + 1}
                      </span>
                      <h4 className="font-medium">{isRTL ? `سوال ${qIndex + 1}` : `Question ${qIndex + 1}`}</h4>
                      <div className="flex-1" />
                      <button className="p-1 text-destructive hover:bg-destructive/10 rounded">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <textarea
                      value={question.question}
                      placeholder={isRTL ? 'متن سوال...' : 'Question text...'}
                      className="w-full p-3 rounded-lg border bg-background mb-3"
                      rows={2}
                    />

                    <div className="space-y-2 mb-3">
                      {question.options.map((option, oIndex) => (
                        <div key={oIndex} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`q-${question.id}`}
                            checked={question.correctAnswer === oIndex}
                            className="h-4 w-4"
                          />
                          <input
                            type="text"
                            value={option}
                            placeholder={isRTL ? `گزینه ${oIndex + 1}` : `Option ${oIndex + 1}`}
                            className="flex-1 p-2 rounded-lg border bg-background text-sm"
                          />
                        </div>
                      ))}
                    </div>

                    <textarea
                      value={question.explanation}
                      placeholder={isRTL ? 'توضیح پاسخ صحیح...' : 'Explanation of correct answer...'}
                      className="w-full p-3 rounded-lg border bg-background text-sm"
                      rows={2}
                    />
                  </div>
                ))}

                <button
                  onClick={handleAddQuestion}
                  className="w-full p-4 border-2 border-dashed rounded-xl text-muted-foreground hover:text-foreground hover:border-primary/50 flex items-center justify-center gap-2"
                >
                  <Plus className="h-5 w-5" />
                  {isRTL ? 'افزودن سوال' : 'Add Question'}
                </button>
              </div>
            )}

            {/* Preview Tab */}
            {activeTab === 'preview' && (
              <div className="bg-card border rounded-xl p-6 prose prose-sm dark:prose-invert max-w-none">
                {contentBlocks.length === 0 || contentBlocks.every(b => !b.content) ? (
                  <div className="text-center text-muted-foreground py-12">
                    <Eye className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>{isRTL ? 'محتوایی برای پیش‌نمایش وجود ندارد' : 'No content to preview'}</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {contentBlocks.map(block => (
                      <div key={block.id}>
                        {block.content && <div className="whitespace-pre-wrap">{block.content}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* AI Assistant Sidebar - 1/3 */}
          <div className="space-y-6">
            {/* AI Content Generator */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border rounded-xl overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  <h2 className="font-semibold">{isRTL ? 'دستیار هوش مصنوعی' : 'AI Assistant'}</h2>
                </div>
                <p className="text-sm text-white/80 mt-1">
                  {isRTL ? 'محتوای درسی با کمک AI تولید کنید' : 'Generate lesson content with AI'}
                </p>
              </div>

              <div className="p-4 space-y-4">
                {/* Templates */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    {isRTL ? 'الگوهای آماده' : 'Quick Templates'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {aiTemplates.map(template => (
                      <button
                        key={template.id}
                        onClick={() => setAiPrompt(template.prompt)}
                        className="flex items-center gap-2 p-2 rounded-lg border bg-background hover:bg-muted text-sm"
                      >
                        <template.icon className="h-4 w-4 text-purple-600" />
                        <span className="truncate">{template.title}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Prompt Input */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    {isRTL ? 'دستور شما' : 'Your Prompt'}
                  </label>
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder={isRTL 
                      ? 'توضیح دهید چه محتوایی می‌خواهید...'
                      : 'Describe what content you need...'}
                    className="w-full p-3 rounded-lg border bg-background resize-none"
                    rows={4}
                    dir={isRTL ? 'rtl' : 'ltr'}
                  />
                </div>

                <button
                  onClick={handleGenerateContent}
                  disabled={isGenerating || !aiPrompt.trim()}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium hover:opacity-90 disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {isRTL ? 'در حال تولید...' : 'Generating...'}
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4" />
                      {isRTL ? 'تولید محتوا' : 'Generate Content'}
                    </>
                  )}
                </button>

                {/* Generated Content Preview */}
                {generatedContent && (
                  <div className="bg-background rounded-lg border p-4 mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        {isRTL ? 'محتوای تولید شده' : 'Generated Content'}
                      </h3>
                      <button
                        onClick={() => navigator.clipboard.writeText(generatedContent)}
                        className="p-1 hover:bg-muted rounded"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="text-sm text-muted-foreground max-h-48 overflow-y-auto whitespace-pre-wrap">
                      {generatedContent.slice(0, 300)}...
                    </div>
                    <button
                      onClick={handleUseGenerated}
                      className="w-full mt-3 p-2 rounded-lg bg-green-600 text-white text-sm hover:bg-green-700"
                    >
                      {isRTL ? 'استفاده از این محتوا' : 'Use This Content'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Tips */}
            <div className="bg-card border rounded-xl p-4">
              <h3 className="font-semibold mb-3">{isRTL ? 'نکات مفید' : 'Helpful Tips'}</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  {isRTL 
                    ? 'از Markdown برای فرمت‌دهی متن استفاده کنید'
                    : 'Use Markdown for text formatting'}
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  {isRTL
                    ? 'محتوای AI را همیشه بازبینی کنید'
                    : 'Always review AI-generated content'}
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  {isRTL
                    ? 'بلوک‌ها را با کشیدن و رها کردن مرتب کنید'
                    : 'Drag and drop to reorder blocks'}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
