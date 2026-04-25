'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { 
  MessageSquare, ThumbsUp, ThumbsDown, Clock, Eye, Share2, Flag,
  Home, ArrowLeft, ArrowRight, CheckCircle, Send, MoreVertical,
  User, Award, Bookmark, Edit, Trash2
} from 'lucide-react';

export default function ForumDetailPage({ 
  params: { locale, id } 
}: { 
  params: { locale: string; id: string } 
}) {
  const t = useTranslations();
  const isRTL = locale === 'fa';
  const Arrow = isRTL ? ArrowRight : ArrowLeft;

  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  const discussion = {
    id,
    title: isRTL ? 'سوال درباره معادلات درجه دوم' : 'Question about quadratic equations',
    content: isRTL 
      ? `سلام دوستان،

من در حل معادلات درجه دوم مشکل دارم. به خصوص وقتی ضریب x^2 منفی است، نمی‌دانم چگونه دلتا را محاسبه کنم.

مثلاً این معادله:
-2x² + 5x - 3 = 0

آیا کسی می‌تواند قدم به قدم توضیح دهد؟

ممنون از همه 🙏`
      : `Hello everyone,

I'm having trouble solving quadratic equations. Especially when the coefficient of x² is negative, I don't know how to calculate delta.

For example, this equation:
-2x² + 5x - 3 = 0

Can someone explain step by step?

Thanks everyone 🙏`,
    author: {
      name: isRTL ? 'علی احمدی' : 'Ali Ahmadi',
      avatar: 'AA',
      reputation: 156,
      joined: isRTL ? 'عضو از ۶ ماه پیش' : 'Member since 6 months',
    },
    category: isRTL ? 'ریاضی' : 'Mathematics',
    createdAt: isRTL ? '۲ ساعت پیش' : '2 hours ago',
    views: 156,
    likes: 8,
    solved: true,
    bestAnswerId: '2',
  };

  const replies = [
    {
      id: '1',
      content: isRTL
        ? 'سوال خوبیه! برای حل این نوع معادلات، اول باید ضرایب رو درست شناسایی کنی.'
        : 'Good question! To solve this type of equation, you first need to identify the coefficients correctly.',
      author: {
        name: isRTL ? 'سارا کریمی' : 'Sara Karimi',
        avatar: 'SK',
        reputation: 234,
      },
      createdAt: isRTL ? '۱ ساعت پیش' : '1 hour ago',
      likes: 3,
      isBestAnswer: false,
    },
    {
      id: '2',
      content: isRTL
        ? `بله، اجازه بده قدم به قدم توضیح بدم:

**معادله:** -2x² + 5x - 3 = 0

**مرحله ۱:** شناسایی ضرایب
- a = -2
- b = 5  
- c = -3

**مرحله ۲:** محاسبه دلتا
Δ = b² - 4ac
Δ = (5)² - 4(-2)(-3)
Δ = 25 - 24
Δ = 1

**مرحله ۳:** محاسبه جواب‌ها
x = (-b ± √Δ) / 2a
x₁ = (-5 + 1) / (2 × -2) = -4/-4 = 1
x₂ = (-5 - 1) / (2 × -2) = -6/-4 = 1.5

پس جواب‌ها: **x = 1** و **x = 1.5** 🎉`
        : `Yes, let me explain step by step:

**Equation:** -2x² + 5x - 3 = 0

**Step 1:** Identify coefficients
- a = -2
- b = 5  
- c = -3

**Step 2:** Calculate delta
Δ = b² - 4ac
Δ = (5)² - 4(-2)(-3)
Δ = 25 - 24
Δ = 1

**Step 3:** Calculate solutions
x = (-b ± √Δ) / 2a
x₁ = (-5 + 1) / (2 × -2) = -4/-4 = 1
x₂ = (-5 - 1) / (2 × -2) = -6/-4 = 1.5

So the solutions are: **x = 1** and **x = 1.5** 🎉`,
      author: {
        name: isRTL ? 'استاد محمدی' : 'Prof. Mohammadi',
        avatar: 'PM',
        reputation: 892,
        isTeacher: true,
      },
      createdAt: isRTL ? '۴۵ دقیقه پیش' : '45 minutes ago',
      likes: 12,
      isBestAnswer: true,
    },
    {
      id: '3',
      content: isRTL
        ? 'توضیح عالی بود استاد! من هم همین مشکل رو داشتم، حالا فهمیدم. ممنون 🙏'
        : 'Great explanation professor! I had the same problem, now I understand. Thanks 🙏',
      author: {
        name: isRTL ? 'مریم حسینی' : 'Maryam Hosseini',
        avatar: 'MH',
        reputation: 78,
      },
      createdAt: isRTL ? '۳۰ دقیقه پیش' : '30 minutes ago',
      likes: 2,
      isBestAnswer: false,
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 1000));
    setReplyText('');
    setIsSubmitting(false);
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
            <span className="text-sm text-muted-foreground truncate max-w-[200px]">
              {discussion.category}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/${locale}`}
              className="p-2 rounded-lg hover:bg-muted"
              title={isRTL ? 'صفحه اصلی' : 'Home'}
            >
              <Home className="h-5 w-5" />
            </Link>
            <button 
              onClick={() => setBookmarked(!bookmarked)}
              className={`p-2 rounded-lg hover:bg-muted ${bookmarked ? 'text-yellow-500' : ''}`}
            >
              <Bookmark className={`h-5 w-5 ${bookmarked ? 'fill-current' : ''}`} />
            </button>
            <button className="p-2 rounded-lg hover:bg-muted">
              <Share2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Question */}
        <div className="bg-card border rounded-xl overflow-hidden">
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="hidden sm:block">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {discussion.author.avatar}
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <h1 className="text-xl font-bold">{discussion.title}</h1>
                  {discussion.solved && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 text-xs font-medium">
                      <CheckCircle className="h-3 w-3" />
                      {isRTL ? 'حل شده' : 'Solved'}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
                  <span className="font-medium text-foreground">{discussion.author.name}</span>
                  <span className="flex items-center gap-1">
                    <Award className="h-3 w-3" />
                    {discussion.author.reputation}
                  </span>
                  <span>•</span>
                  <span>{discussion.createdAt}</span>
                </div>
                <div className="prose prose-sm max-w-none whitespace-pre-line">
                  {discussion.content}
                </div>
                <div className="flex items-center gap-4 mt-6 pt-4 border-t">
                  <button 
                    onClick={() => setLiked(!liked)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                      liked ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                    }`}
                  >
                    <ThumbsUp className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
                    <span>{discussion.likes + (liked ? 1 : 0)}</span>
                  </button>
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Eye className="h-4 w-4" />
                    {discussion.views}
                  </span>
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MessageSquare className="h-4 w-4" />
                    {replies.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Replies */}
        <div className="space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {replies.length} {isRTL ? 'پاسخ' : 'Replies'}
          </h2>

          {replies.map((reply) => (
            <div 
              key={reply.id}
              className={`bg-card border rounded-xl p-6 ${
                reply.isBestAnswer ? 'border-green-500 ring-1 ring-green-500/20' : ''
              }`}
            >
              {reply.isBestAnswer && (
                <div className="flex items-center gap-2 text-green-600 text-sm font-medium mb-4 pb-4 border-b border-green-500/20">
                  <CheckCircle className="h-4 w-4" />
                  {isRTL ? 'بهترین پاسخ' : 'Best Answer'}
                </div>
              )}
              <div className="flex items-start gap-4">
                <div className="hidden sm:block">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold ${
                    reply.author.isTeacher 
                      ? 'bg-yellow-500/10 text-yellow-600' 
                      : 'bg-primary/10 text-primary'
                  }`}>
                    {reply.author.avatar}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 text-sm mb-3">
                    <span className="font-medium">{reply.author.name}</span>
                    {reply.author.isTeacher && (
                      <span className="px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-600 text-xs">
                        {isRTL ? 'معلم' : 'Teacher'}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Award className="h-3 w-3" />
                      {reply.author.reputation}
                    </span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground">{reply.createdAt}</span>
                  </div>
                  <div className="prose prose-sm max-w-none whitespace-pre-line">
                    {reply.content}
                  </div>
                  <div className="flex items-center gap-4 mt-4 pt-3 border-t">
                    <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-muted text-sm">
                      <ThumbsUp className="h-4 w-4" />
                      <span>{reply.likes}</span>
                    </button>
                    <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-muted text-sm text-muted-foreground">
                      <ThumbsDown className="h-4 w-4" />
                    </button>
                    <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-muted text-sm text-muted-foreground">
                      <Flag className="h-4 w-4" />
                      {isRTL ? 'گزارش' : 'Report'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Reply Form */}
        <div className="bg-card border rounded-xl p-6">
          <h3 className="font-semibold mb-4">{isRTL ? 'پاسخ شما' : 'Your Reply'}</h3>
          <form onSubmit={handleSubmit}>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={isRTL ? 'پاسخ خود را بنویسید...' : 'Write your reply...'}
              rows={4}
              className="w-full p-4 rounded-xl border bg-background resize-none mb-4"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting || !replyText.trim()}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {isRTL ? 'ارسال پاسخ' : 'Submit Reply'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
