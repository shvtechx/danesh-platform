'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { 
  ArrowLeft, ArrowRight, Save, Send, Eye, Sparkles, FileText,
  Video, Image, HelpCircle, List, Wand2, Loader2, Check, Copy,
  Plus, Trash2, GripVertical, X, Clock, Award, Settings,
  Bold, Italic, Underline, AlignLeft, AlignCenter, Code, Link2
} from 'lucide-react';

interface ContentBlock {
  id: string;
  type: 'text' | 'video' | 'image' | 'code' | 'equation';
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

export default function LessonEditor({ params }: { params: { locale: string; id: string; lessonId: string } }) {
  const { locale, id: courseId, lessonId } = params;
  const t = useTranslations();
  const isRTL = locale === 'fa';
  const Arrow = isRTL ? ArrowRight : ArrowLeft;

  const [lessonTitle, setLessonTitle] = useState(
    isRTL ? 'معادلات درجه اول' : 'Linear Equations'
  );
  const [lessonDescription, setLessonDescription] = useState(
    isRTL ? 'آموزش کامل معادلات درجه اول با مثال‌های حل شده' : 'Complete guide to linear equations with solved examples'
  );
  const [duration, setDuration] = useState('20');
  const [xpReward, setXpReward] = useState('75');
  
  const [activeTab, setActiveTab] = useState<'content' | 'quiz' | 'settings'>('content');
  const [showAIPanel, setShowAIPanel] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([
    {
      id: '1',
      type: 'text',
      content: isRTL 
        ? `## معادله درجه اول چیست؟

معادله درجه اول معادله‌ای است که توان مجهول در آن یک است. فرم کلی این معادله به صورت **ax + b = 0** است که در آن:
- **a** ضریب مجهول است (a ≠ 0)
- **b** عدد ثابت است
- **x** مجهول معادله است

### مثال:
- 2x + 4 = 0
- 3x - 9 = 6
- x/2 + 3 = 7`
        : `## What is a Linear Equation?

A linear equation is an equation where the power of the unknown is one. The general form is **ax + b = 0** where:
- **a** is the coefficient (a ≠ 0)
- **b** is a constant
- **x** is the unknown

### Examples:
- 2x + 4 = 0
- 3x - 9 = 6
- x/2 + 3 = 7`,
    },
    {
      id: '2',
      type: 'video',
      content: 'https://example.com/video.mp4',
    },
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

  const handleGenerateContent = async () => {
    if (!aiPrompt.trim()) return;
    
    setIsGenerating(true);
    
    // Simulate AI generation
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    const sampleContent = isRTL
      ? `## روش حل معادلات درجه اول

برای حل معادلات درجه اول، مراحل زیر را دنبال کنید:

### مرحله ۱: ساده‌سازی دو طرف
ابتدا هر طرف معادله را جداگانه ساده کنید. عبارات داخل پرانتز را باز کنید و عبارات مشابه را با هم جمع کنید.

### مرحله ۲: جداسازی متغیر
تمام عبارات حاوی x را به یک طرف و اعداد را به طرف دیگر منتقل کنید.

> **نکته مهم:** وقتی عبارتی را از یک طرف به طرف دیگر منتقل می‌کنید، علامت آن عوض می‌شود.

### مرحله ۳: محاسبه جواب
با تقسیم هر دو طرف بر ضریب x، مقدار x را بیابید.

### مثال:
**حل کنید: 3(x + 2) = 15**

1. باز کردن پرانتز: 3x + 6 = 15
2. انتقال 6: 3x = 15 - 6 = 9
3. تقسیم بر 3: x = 3

✅ **جواب: x = 3**

### بررسی صحت جواب:
3(3 + 2) = 3(5) = 15 ✓`
      : `## How to Solve Linear Equations

Follow these steps to solve linear equations:

### Step 1: Simplify Both Sides
First, simplify each side of the equation separately. Expand parentheses and combine like terms.

### Step 2: Isolate the Variable
Move all terms with x to one side and numbers to the other side.

> **Important:** When moving a term from one side to another, change its sign.

### Step 3: Calculate the Solution
Divide both sides by the coefficient of x to find the value of x.

### Example:
**Solve: 3(x + 2) = 15**

1. Expand: 3x + 6 = 15
2. Move 6: 3x = 15 - 6 = 9
3. Divide by 3: x = 3

✅ **Answer: x = 3**

### Verify:
3(3 + 2) = 3(5) = 15 ✓`;

    setGeneratedContent(sampleContent);
    setIsGenerating(false);
  };

  const handleGenerateQuiz = async () => {
    setIsGenerating(true);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const newQuestions: QuizQuestion[] = [
      {
        id: Date.now().toString(),
        question: isRTL ? 'کدام گزینه معادله درجه اول نیست؟' : 'Which is NOT a linear equation?',
        options: ['2x + 5 = 11', 'x² + 3 = 7', '4x = 20', 'x/3 - 2 = 1'],
        correctAnswer: 1,
        explanation: isRTL 
          ? 'x² + 3 = 7 معادله درجه دوم است چون توان x برابر ۲ است'
          : 'x² + 3 = 7 is a quadratic equation because x has power 2',
      },
      {
        id: (Date.now() + 1).toString(),
        question: isRTL ? 'اگر 5x - 15 = 0 باشد، x چقدر است؟' : 'If 5x - 15 = 0, what is x?',
        options: ['x = 0', 'x = 3', 'x = 5', 'x = 15'],
        correctAnswer: 1,
        explanation: isRTL
          ? '5x = 15، پس x = 3'
          : '5x = 15, so x = 3',
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
            <button
              onClick={() => setShowAIPanel(!showAIPanel)}
              className={`p-2 rounded-lg border transition-colors ${showAIPanel ? 'bg-purple-100 border-purple-300 text-purple-700' : 'hover:bg-muted'}`}
            >
              <Sparkles className="h-4 w-4" />
            </button>
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border hover:bg-muted text-sm">
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">{isRTL ? 'پیش‌نمایش' : 'Preview'}</span>
            </button>
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border hover:bg-muted text-sm">
              <Save className="h-4 w-4" />
              <span className="hidden sm:inline">{isRTL ? 'ذخیره' : 'Save'}</span>
            </button>
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm">
              <Send className="h-4 w-4" />
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
          {/* Content Tab */}
          {activeTab === 'content' && (
            <div className="max-w-3xl mx-auto space-y-4">
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
                      {block.type === 'code' && <Code className="h-4 w-4" />}
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
                        <button className="p-1 rounded hover:bg-background"><Bold className="h-3 w-3" /></button>
                        <button className="p-1 rounded hover:bg-background"><Italic className="h-3 w-3" /></button>
                        <button className="p-1 rounded hover:bg-background"><Link2 className="h-3 w-3" /></button>
                        <button className="p-1 rounded hover:bg-background"><Code className="h-3 w-3" /></button>
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
                  </div>
                </div>
              ))}

              {/* Add Block Buttons */}
              <div className="flex flex-wrap gap-2">
                {[
                  { type: 'text' as const, icon: FileText, label: isRTL ? 'متن' : 'Text' },
                  { type: 'video' as const, icon: Video, label: isRTL ? 'ویدیو' : 'Video' },
                  { type: 'image' as const, icon: Image, label: isRTL ? 'تصویر' : 'Image' },
                  { type: 'code' as const, icon: Code, label: isRTL ? 'کد' : 'Code' },
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
    </div>
  );
}
