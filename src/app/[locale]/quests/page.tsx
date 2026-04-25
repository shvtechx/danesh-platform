'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { 
  Target, Award, Clock, CheckCircle2, Star, Flame, 
  BookOpen, Trophy, Users, Zap, Gift, Calendar
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';

export default function QuestsPage({ params: { locale } }: { params: { locale: string } }) {
  const t = useTranslations();
  const isRTL = locale === 'fa';

  const dailyQuests = [
    {
      id: 'd1',
      title: isRTL ? 'تکمیل ۲ درس' : 'Complete 2 Lessons',
      description: isRTL ? 'هر ۲ درس از هر دوره‌ای را تکمیل کنید' : 'Complete any 2 lessons from any course',
      progress: 1,
      total: 2,
      xp: 50,
      icon: BookOpen,
      color: 'blue',
      deadline: isRTL ? 'امروز' : 'Today',
    },
    {
      id: 'd2',
      title: isRTL ? 'پاسخ به ۱۰ سوال' : 'Answer 10 Questions',
      description: isRTL ? 'در آزمون‌ها به ۱۰ سوال پاسخ دهید' : 'Answer 10 questions in quizzes',
      progress: 7,
      total: 10,
      xp: 30,
      icon: Target,
      color: 'green',
      deadline: isRTL ? 'امروز' : 'Today',
    },
    {
      id: 'd3',
      title: isRTL ? '۳۰ دقیقه مطالعه' : '30 Minutes of Study',
      description: isRTL ? '۳۰ دقیقه در پلتفرم فعالیت کنید' : 'Spend 30 minutes on the platform',
      progress: 25,
      total: 30,
      xp: 25,
      icon: Clock,
      color: 'purple',
      deadline: isRTL ? 'امروز' : 'Today',
    },
  ];

  const weeklyQuests = [
    {
      id: 'w1',
      title: isRTL ? 'تکمیل ۵ درس' : 'Complete 5 Lessons',
      description: isRTL ? 'پنج درس از هر دوره‌ای را تکمیل کنید' : 'Complete five lessons from any course',
      progress: 3,
      total: 5,
      xp: 100,
      icon: BookOpen,
      color: 'blue',
      deadline: isRTL ? '۲ روز' : '2 days',
    },
    {
      id: 'w2',
      title: isRTL ? 'کسب ۷ روز متوالی' : 'Get 7 Day Streak',
      description: isRTL ? 'هفت روز متوالی فعالیت کنید' : 'Be active for 7 consecutive days',
      progress: 5,
      total: 7,
      xp: 150,
      icon: Flame,
      color: 'orange',
      deadline: isRTL ? '۲ روز' : '2 days',
    },
    {
      id: 'w3',
      title: isRTL ? 'شرکت در انجمن' : 'Forum Participation',
      description: isRTL ? 'در ۳ بحث شرکت کنید یا سوال بپرسید' : 'Participate in 3 discussions or ask questions',
      progress: 1,
      total: 3,
      xp: 75,
      icon: Users,
      color: 'pink',
      deadline: isRTL ? '۴ روز' : '4 days',
    },
    {
      id: 'w4',
      title: isRTL ? 'نمره بالای ۸۰٪' : 'Score Above 80%',
      description: isRTL ? 'در ۳ آزمون نمره بالای ۸۰٪ بگیرید' : 'Score above 80% in 3 quizzes',
      progress: 2,
      total: 3,
      xp: 120,
      icon: Star,
      color: 'amber',
      deadline: isRTL ? '۵ روز' : '5 days',
    },
  ];

  const specialQuests = [
    {
      id: 's1',
      title: isRTL ? 'قهرمان ریاضی' : 'Math Champion',
      description: isRTL ? 'تمام فصل اول ریاضی را با نمره بالای ۹۰٪ تکمیل کنید' : 'Complete all of Chapter 1 Math with over 90% score',
      progress: 75,
      total: 100,
      xp: 300,
      gems: 10,
      icon: Trophy,
      color: 'yellow',
      deadline: isRTL ? 'بدون محدودیت' : 'No deadline',
    },
    {
      id: 's2',
      title: isRTL ? 'دانشمند جوان' : 'Young Scientist',
      description: isRTL ? 'دوره علوم تجربی را تکمیل کنید' : 'Complete the Science course',
      progress: 40,
      total: 100,
      xp: 500,
      gems: 25,
      icon: Zap,
      color: 'cyan',
      deadline: isRTL ? 'بدون محدودیت' : 'No deadline',
    },
  ];

  const completedQuests = [
    {
      id: 'c1',
      title: isRTL ? 'اولین درس' : 'First Lesson',
      xp: 10,
      completedAt: isRTL ? 'دیروز' : 'Yesterday',
    },
    {
      id: 'c2',
      title: isRTL ? 'اولین آزمون' : 'First Quiz',
      xp: 20,
      completedAt: isRTL ? '۲ روز پیش' : '2 days ago',
    },
    {
      id: 'c3',
      title: isRTL ? '۳ روز متوالی' : '3 Day Streak',
      xp: 30,
      completedAt: isRTL ? '۳ روز پیش' : '3 days ago',
    },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
      green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
      purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
      orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
      pink: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
      amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
      yellow: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
      cyan: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
    };
    return colors[color] || colors.blue;
  };

  const QuestCard = ({ quest, isSpecial = false }: { quest: any; isSpecial?: boolean }) => {
    const Icon = quest.icon;
    const progressPercent = Math.round((quest.progress / quest.total) * 100);
    
    return (
      <div className="bg-card border rounded-xl p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl ${getColorClasses(quest.color)}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold">{quest.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{quest.description}</p>
            
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {quest.progress} / {quest.total}
                </span>
                <span className="font-medium">{progressPercent}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-sm text-amber-600 font-medium">
                  <Award className="h-4 w-4" />
                  +{quest.xp} XP
                </span>
                {isSpecial && quest.gems && (
                  <span className="flex items-center gap-1 text-sm text-cyan-600 font-medium">
                    <Gift className="h-4 w-4" />
                    +{quest.gems} 💎
                  </span>
                )}
              </div>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {quest.deadline}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader 
        locale={locale} 
        title={t('gamification.quests')}
        backHref={`/${locale}/dashboard`}
        backLabel={isRTL ? 'داشبورد' : 'Dashboard'}
      />
      <div className="space-y-8 p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-muted-foreground">
              {isRTL ? 'ماموریت‌ها را تکمیل کنید و امتیاز کسب کنید' : 'Complete quests to earn rewards'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-card border rounded-xl px-4 py-2 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">{isRTL ? 'ماموریت‌های امروز' : "Today's Quests"}</p>
              <p className="font-bold">3/3</p>
            </div>
          </div>
          <div className="bg-card border rounded-xl px-4 py-2 flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-500" />
            <div>
              <p className="text-xs text-muted-foreground">{isRTL ? 'امتیاز این هفته' : 'XP This Week'}</p>
              <p className="font-bold text-amber-600">+450</p>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Quests */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
            <Flame className="h-5 w-5 text-orange-600" />
          </div>
          <h2 className="text-lg font-semibold">{isRTL ? 'ماموریت‌های روزانه' : 'Daily Quests'}</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {dailyQuests.map(quest => (
            <QuestCard key={quest.id} quest={quest} />
          ))}
        </div>
      </section>

      {/* Weekly Quests */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <Calendar className="h-5 w-5 text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold">{isRTL ? 'ماموریت‌های هفتگی' : 'Weekly Quests'}</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {weeklyQuests.map(quest => (
            <QuestCard key={quest.id} quest={quest} />
          ))}
        </div>
      </section>

      {/* Special Quests */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
            <Trophy className="h-5 w-5 text-yellow-600" />
          </div>
          <h2 className="text-lg font-semibold">{isRTL ? 'ماموریت‌های ویژه' : 'Special Quests'}</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {specialQuests.map(quest => (
            <QuestCard key={quest.id} quest={quest} isSpecial />
          ))}
        </div>
      </section>

      {/* Completed Quests */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          </div>
          <h2 className="text-lg font-semibold">{isRTL ? 'تکمیل‌شده اخیر' : 'Recently Completed'}</h2>
        </div>
        <div className="bg-card border rounded-xl divide-y">
          {completedQuests.map(quest => (
            <div key={quest.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="font-medium">{quest.title}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-amber-600 font-medium">+{quest.xp} XP</span>
                <span className="text-sm text-muted-foreground">{quest.completedAt}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
      </div>
    </div>
  );
}
