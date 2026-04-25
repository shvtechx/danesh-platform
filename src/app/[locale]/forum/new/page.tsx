'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Home, ArrowLeft, ArrowRight, Send, Image, Code, Bold, Italic,
  List, ListOrdered, Link as LinkIcon, HelpCircle, Info
} from 'lucide-react';

export default function NewForumQuestionPage({ 
  params: { locale } 
}: { 
  params: { locale: string } 
}) {
  const t = useTranslations();
  const router = useRouter();
  const isRTL = locale === 'fa';
  const Arrow = isRTL ? ArrowRight : ArrowLeft;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    content: '',
    tags: '',
  });

  const categories = [
    { id: 'math', name: isRTL ? 'ریاضی' : 'Mathematics', icon: '📐' },
    { id: 'physics', name: isRTL ? 'فیزیک' : 'Physics', icon: '⚡' },
    { id: 'chemistry', name: isRTL ? 'شیمی' : 'Chemistry', icon: '🧪' },
    { id: 'biology', name: isRTL ? 'زیست‌شناسی' : 'Biology', icon: '🧬' },
    { id: 'programming', name: isRTL ? 'برنامه‌نویسی' : 'Programming', icon: '💻' },
    { id: 'languages', name: isRTL ? 'زبان' : 'Languages', icon: '🌍' },
    { id: 'other', name: isRTL ? 'سایر' : 'Other', icon: '📚' },
  ];

  const tips = isRTL ? [
    'عنوان واضح و مشخص بنویسید',
    'جزئیات کافی ارائه دهید',
    'کدها را با فرمت مناسب قرار دهید',
    'تگ‌های مرتبط اضافه کنید',
  ] : [
    'Write a clear and specific title',
    'Provide enough details',
    'Format code properly',
    'Add relevant tags',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim() || !formData.category) return;
    
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 1500));
    router.push(`/${locale}/forum`);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href={`/${locale}/forum`}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <Arrow className="h-5 w-5" />
              <span className="hidden sm:inline">{isRTL ? 'انجمن' : 'Forum'}</span>
            </Link>
            <div className="h-6 w-px bg-border" />
            <h1 className="font-semibold">{isRTL ? 'سوال جدید' : 'New Question'}</h1>
          </div>
          <Link
            href={`/${locale}`}
            className="p-2 rounded-lg hover:bg-muted"
            title={isRTL ? 'صفحه اصلی' : 'Home'}
          >
            <Home className="h-5 w-5" />
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="bg-card border rounded-xl p-6">
                <label className="block text-sm font-medium mb-2">
                  {isRTL ? 'عنوان سوال' : 'Question Title'} *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder={isRTL ? 'مثال: چگونه معادلات درجه دوم حل می‌شوند؟' : 'Example: How to solve quadratic equations?'}
                  className="w-full p-3 rounded-lg border bg-background"
                  required
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {isRTL 
                    ? 'عنوان باید واضح و مشخص باشد تا دیگران راحت‌تر کمکتان کنند.'
                    : 'Title should be clear and specific so others can help you better.'}
                </p>
              </div>

              {/* Category */}
              <div className="bg-card border rounded-xl p-6">
                <label className="block text-sm font-medium mb-3">
                  {isRTL ? 'دسته‌بندی' : 'Category'} *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleChange('category', cat.id)}
                      className={`p-3 rounded-lg border text-sm flex flex-col items-center gap-1 transition-colors ${
                        formData.category === cat.id
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <span className="text-lg">{cat.icon}</span>
                      <span>{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="bg-card border rounded-xl p-6">
                <label className="block text-sm font-medium mb-2">
                  {isRTL ? 'توضیحات سوال' : 'Question Details'} *
                </label>
                
                {/* Toolbar */}
                <div className="flex items-center gap-1 p-2 border rounded-t-lg bg-muted/50 flex-wrap">
                  <button type="button" className="p-2 rounded hover:bg-background" title="Bold">
                    <Bold className="h-4 w-4" />
                  </button>
                  <button type="button" className="p-2 rounded hover:bg-background" title="Italic">
                    <Italic className="h-4 w-4" />
                  </button>
                  <div className="w-px h-4 bg-border mx-1" />
                  <button type="button" className="p-2 rounded hover:bg-background" title="Code">
                    <Code className="h-4 w-4" />
                  </button>
                  <button type="button" className="p-2 rounded hover:bg-background" title="Link">
                    <LinkIcon className="h-4 w-4" />
                  </button>
                  <button type="button" className="p-2 rounded hover:bg-background" title="Image">
                    <Image className="h-4 w-4" />
                  </button>
                  <div className="w-px h-4 bg-border mx-1" />
                  <button type="button" className="p-2 rounded hover:bg-background" title="Bullet List">
                    <List className="h-4 w-4" />
                  </button>
                  <button type="button" className="p-2 rounded hover:bg-background" title="Numbered List">
                    <ListOrdered className="h-4 w-4" />
                  </button>
                </div>

                <textarea
                  value={formData.content}
                  onChange={(e) => handleChange('content', e.target.value)}
                  placeholder={isRTL 
                    ? 'سوال خود را با جزئیات کامل توضیح دهید...\n\nمثال:\n- چه چیزی می‌خواهید انجام دهید؟\n- چه مشکلی دارید؟\n- چه روش‌هایی را امتحان کرده‌اید؟'
                    : 'Explain your question in detail...\n\nExample:\n- What are you trying to do?\n- What problem are you facing?\n- What methods have you tried?'}
                  rows={10}
                  className="w-full p-4 border border-t-0 rounded-b-lg bg-background resize-none"
                  required
                />
              </div>

              {/* Tags */}
              <div className="bg-card border rounded-xl p-6">
                <label className="block text-sm font-medium mb-2">
                  {isRTL ? 'تگ‌ها' : 'Tags'}
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => handleChange('tags', e.target.value)}
                  placeholder={isRTL ? 'مثال: ریاضی، معادله، درجه‌دوم' : 'Example: math, equation, quadratic'}
                  className="w-full p-3 rounded-lg border bg-background"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {isRTL 
                    ? 'تگ‌ها را با کاما جدا کنید (حداکثر ۵ تگ)'
                    : 'Separate tags with commas (max 5 tags)'}
                </p>
              </div>

              {/* Submit */}
              <div className="flex items-center justify-between gap-4">
                <Link
                  href={`/${locale}/forum`}
                  className="px-6 py-2.5 rounded-lg border hover:bg-muted"
                >
                  {isRTL ? 'انصراف' : 'Cancel'}
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting || !formData.title.trim() || !formData.content.trim() || !formData.category}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {isRTL ? 'ارسال سوال' : 'Submit Question'}
                </button>
              </div>
            </form>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Tips */}
            <div className="bg-card border rounded-xl p-6">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <HelpCircle className="h-5 w-5 text-primary" />
                {isRTL ? 'راهنمای پرسش خوب' : 'How to Ask Well'}
              </h3>
              <ul className="space-y-3 text-sm">
                {tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="flex-shrink-0 h-5 w-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Community Guidelines */}
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
              <h3 className="font-semibold flex items-center gap-2 mb-3 text-blue-700 dark:text-blue-400">
                <Info className="h-5 w-5" />
                {isRTL ? 'قوانین انجمن' : 'Community Guidelines'}
              </h3>
              <ul className="space-y-2 text-sm text-blue-600 dark:text-blue-400">
                <li>• {isRTL ? 'محترمانه صحبت کنید' : 'Be respectful'}</li>
                <li>• {isRTL ? 'از تکرار سوالات بپرهیزید' : 'Avoid duplicate questions'}</li>
                <li>• {isRTL ? 'بهترین پاسخ را انتخاب کنید' : 'Mark best answer'}</li>
              </ul>
            </div>

            {/* Similar Questions */}
            <div className="bg-card border rounded-xl p-6">
              <h3 className="font-semibold mb-4">
                {isRTL ? 'سوالات مشابه' : 'Similar Questions'}
              </h3>
              <div className="space-y-3 text-sm">
                <Link href={`/${locale}/forum/1`} className="block p-3 rounded-lg hover:bg-muted">
                  <span className="text-primary">
                    {isRTL ? 'حل معادله درجه دوم با دلتا' : 'Solving quadratic with delta'}
                  </span>
                  <span className="block text-xs text-muted-foreground mt-1">
                    {isRTL ? '۱۲ پاسخ • حل شده' : '12 answers • Solved'}
                  </span>
                </Link>
                <Link href={`/${locale}/forum/2`} className="block p-3 rounded-lg hover:bg-muted">
                  <span className="text-primary">
                    {isRTL ? 'فرمول بسکارا چیست؟' : 'What is the Bhaskara formula?'}
                  </span>
                  <span className="block text-xs text-muted-foreground mt-1">
                    {isRTL ? '۸ پاسخ • حل شده' : '8 answers • Solved'}
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
