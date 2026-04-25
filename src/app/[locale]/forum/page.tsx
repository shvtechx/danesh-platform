'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { 
  MessageSquare, Users, ThumbsUp, Eye, Clock, Search, Filter, Plus,
  Home, ArrowLeft, ArrowRight, CheckCircle, Tag, TrendingUp, HelpCircle
} from 'lucide-react';

export default function ForumPage({ params: { locale } }: { params: { locale: string } }) {
  const t = useTranslations();
  const isRTL = locale === 'fa';
  const Arrow = isRTL ? ArrowRight : ArrowLeft;

  const [activeTab, setActiveTab] = useState('recent');
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const discussions = [
    {
      id: '1',
      title: isRTL ? 'سوال درباره معادلات درجه دوم' : 'Question about quadratic equations',
      author: isRTL ? 'علی احمدی' : 'Ali Ahmadi',
      avatar: 'AA',
      category: 'math',
      categoryName: isRTL ? 'ریاضی' : 'Mathematics',
      replies: 12,
      views: 156,
      likes: 8,
      lastActivity: isRTL ? '۲ ساعت پیش' : '2h ago',
      solved: true,
      preview: isRTL 
        ? 'سلام، من در حل معادلات درجه دوم مشکل دارم. آیا کسی می‌تواند کمک کند؟'
        : 'Hi, I\'m having trouble solving quadratic equations. Can someone help?',
    },
    {
      id: '2',
      title: isRTL ? 'راهنمایی برای یادگیری گرامر انگلیسی' : 'Tips for learning English grammar',
      author: isRTL ? 'سارا کریمی' : 'Sara Karimi',
      avatar: 'SK',
      category: 'english',
      categoryName: isRTL ? 'زبان انگلیسی' : 'English',
      replies: 8,
      views: 89,
      likes: 5,
      lastActivity: isRTL ? '۵ ساعت پیش' : '5h ago',
      solved: false,
      preview: isRTL
        ? 'بهترین روش برای یادگیری گرامر انگلیسی چیست؟'
        : 'What\'s the best way to learn English grammar?',
    },
    {
      id: '3',
      title: isRTL ? 'بهترین روش مطالعه برای امتحانات' : 'Best study methods for exams',
      author: isRTL ? 'محمد رضایی' : 'Mohammad Rezaei',
      avatar: 'MR',
      category: 'general',
      categoryName: isRTL ? 'عمومی' : 'General',
      replies: 24,
      views: 312,
      likes: 15,
      lastActivity: isRTL ? '۱ روز پیش' : '1d ago',
      solved: true,
      preview: isRTL
        ? 'می‌خواهم بدانم چگونه می‌توانم بهتر درس بخوانم...'
        : 'I want to know how I can study better...',
    },
    {
      id: '4',
      title: isRTL ? 'سوال درباره آزمایش شیمی' : 'Question about chemistry experiment',
      author: isRTL ? 'زهرا محمدی' : 'Zahra Mohammadi',
      avatar: 'ZM',
      category: 'science',
      categoryName: isRTL ? 'علوم' : 'Science',
      replies: 5,
      views: 67,
      likes: 3,
      lastActivity: isRTL ? '۳ ساعت پیش' : '3h ago',
      solved: false,
      preview: isRTL
        ? 'در آزمایشگاه با یک واکنش عجیب مواجه شدم...'
        : 'I encountered a strange reaction in the lab...',
    },
    {
      id: '5',
      title: isRTL ? 'نکات مهم برای نوشتن انشا' : 'Important tips for essay writing',
      author: isRTL ? 'مریم حسینی' : 'Maryam Hosseini',
      avatar: 'MH',
      category: 'literature',
      categoryName: isRTL ? 'ادبیات' : 'Literature',
      replies: 18,
      views: 234,
      likes: 12,
      lastActivity: isRTL ? '۶ ساعت پیش' : '6h ago',
      solved: true,
      preview: isRTL
        ? 'چگونه یک انشای خوب بنویسیم؟ نکات کلیدی...'
        : 'How to write a good essay? Key tips...',
    },
  ];

  const categories = [
    { id: 'all', name: isRTL ? 'همه' : 'All', count: 156, color: 'bg-gray-500' },
    { id: 'math', name: isRTL ? 'ریاضی' : 'Mathematics', count: 45, color: 'bg-blue-500' },
    { id: 'science', name: isRTL ? 'علوم' : 'Science', count: 32, color: 'bg-green-500' },
    { id: 'english', name: isRTL ? 'زبان انگلیسی' : 'English', count: 28, color: 'bg-purple-500' },
    { id: 'literature', name: isRTL ? 'ادبیات' : 'Literature', count: 21, color: 'bg-orange-500' },
    { id: 'general', name: isRTL ? 'عمومی' : 'General', count: 30, color: 'bg-pink-500' },
  ];

  const tabs = [
    { id: 'recent', name: isRTL ? 'جدیدترین' : 'Recent', icon: Clock },
    { id: 'popular', name: isRTL ? 'محبوب‌ترین' : 'Popular', icon: TrendingUp },
    { id: 'unanswered', name: isRTL ? 'بی‌پاسخ' : 'Unanswered', icon: HelpCircle },
    { id: 'my', name: isRTL ? 'سوالات من' : 'My Questions', icon: MessageSquare },
  ];

  const filteredDiscussions = discussions.filter(d => {
    const matchesCategory = activeCategory === 'all' || d.category === activeCategory;
    const matchesSearch = d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          d.preview.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'recent' || 
                       (activeTab === 'unanswered' && !d.solved) ||
                       activeTab === 'popular' || 
                       activeTab === 'my';
    return matchesCategory && matchesSearch && matchesTab;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href={`/${locale}/dashboard`}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <Arrow className="h-5 w-5" />
              <span className="hidden sm:inline">{isRTL ? 'بازگشت' : 'Back'}</span>
            </Link>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <h1 className="font-semibold">{isRTL ? 'انجمن گفتگو' : 'Forum'}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/${locale}`}
              className="p-2 rounded-lg hover:bg-muted"
              title={isRTL ? 'صفحه اصلی' : 'Home'}
            >
              <Home className="h-5 w-5" />
            </Link>
            <Link
              href={`/${locale}/forum/new`}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">{isRTL ? 'سوال جدید' : 'Ask Question'}</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-card border rounded-xl p-4">
            <div className="flex items-center gap-2 text-primary mb-1">
              <MessageSquare className="h-4 w-4" />
              <span className="text-sm">{isRTL ? 'کل بحث‌ها' : 'Total Discussions'}</span>
            </div>
            <p className="text-2xl font-bold">156</p>
          </div>
          <div className="bg-card border rounded-xl p-4">
            <div className="flex items-center gap-2 text-green-600 mb-1">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">{isRTL ? 'حل شده' : 'Solved'}</span>
            </div>
            <p className="text-2xl font-bold">89</p>
          </div>
          <div className="bg-card border rounded-xl p-4">
            <div className="flex items-center gap-2 text-purple-600 mb-1">
              <Users className="h-4 w-4" />
              <span className="text-sm">{isRTL ? 'اعضای فعال' : 'Active Members'}</span>
            </div>
            <p className="text-2xl font-bold">234</p>
          </div>
          <div className="bg-card border rounded-xl p-4">
            <div className="flex items-center gap-2 text-orange-600 mb-1">
              <ThumbsUp className="h-4 w-4" />
              <span className="text-sm">{isRTL ? 'پاسخ‌ها' : 'Total Replies'}</span>
            </div>
            <p className="text-2xl font-bold">1.2K</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-64 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isRTL ? 'جستجو در انجمن...' : 'Search forum...'}
                className="w-full ps-10 pe-4 py-2.5 rounded-xl border bg-background text-sm"
              />
            </div>

            {/* Categories */}
            <div className="bg-card border rounded-xl p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Tag className="h-4 w-4" />
                {isRTL ? 'دسته‌بندی‌ها' : 'Categories'}
              </h3>
              <div className="space-y-1">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`flex items-center justify-between w-full rounded-lg px-3 py-2 text-sm transition-colors ${
                      activeCategory === category.id 
                        ? 'bg-primary/10 text-primary' 
                        : 'hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${category.color}`} />
                      <span>{category.name}</span>
                    </div>
                    <span className="text-muted-foreground text-xs">{category.count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Top Contributors */}
            <div className="bg-card border rounded-xl p-4">
              <h3 className="font-semibold mb-3">{isRTL ? 'برترین پاسخ‌دهندگان' : 'Top Contributors'}</h3>
              <div className="space-y-2">
                {[
                  { name: isRTL ? 'علی احمدی' : 'Ali Ahmadi', answers: 45, avatar: 'AA' },
                  { name: isRTL ? 'سارا کریمی' : 'Sara Karimi', answers: 38, avatar: 'SK' },
                  { name: isRTL ? 'محمد رضایی' : 'Mohammad Rezaei', answers: 32, avatar: 'MR' },
                ].map((user, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      {user.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.answers} {isRTL ? 'پاسخ' : 'answers'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 space-y-4">
            {/* Tabs */}
            <div className="flex gap-1 bg-muted p-1 rounded-xl overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                      activeTab === tab.id 
                        ? 'bg-background shadow-sm font-medium' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.name}
                  </button>
                );
              })}
            </div>

            {/* Discussions List */}
            <div className="space-y-3">
              {filteredDiscussions.map((discussion) => (
                <Link
                  key={discussion.id}
                  href={`/${locale}/forum/${discussion.id}`}
                  className="block bg-card border rounded-xl p-4 hover:border-primary/50 transition-all"
                >
                  <div className="flex gap-4">
                    <div className="hidden sm:flex h-12 w-12 rounded-full bg-primary/10 items-center justify-center text-primary font-bold">
                      {discussion.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold hover:text-primary">{discussion.title}</h3>
                            {discussion.solved && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 text-xs font-medium">
                                <CheckCircle className="h-3 w-3" />
                                {isRTL ? 'حل شده' : 'Solved'}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                            {discussion.preview}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <span className="font-medium text-foreground">{discussion.author}</span>
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          categories.find(c => c.id === discussion.category)?.color
                        }/10`}>
                          {discussion.categoryName}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {discussion.replies}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {discussion.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="h-3 w-3" />
                          {discussion.likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {discussion.lastActivity}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {filteredDiscussions.length === 0 && (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">
                  {isRTL ? 'بحثی یافت نشد' : 'No discussions found'}
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {isRTL ? 'اولین نفری باشید که سوال می‌پرسد!' : 'Be the first to ask a question!'}
                </p>
                <Link
                  href={`/${locale}/forum/new`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground"
                >
                  <Plus className="h-4 w-4" />
                  {isRTL ? 'سوال جدید' : 'Ask Question'}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
