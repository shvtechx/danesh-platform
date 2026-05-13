'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, CheckCircle2, ClipboardList, Copy, GraduationCap, ShieldCheck, Users, Video } from 'lucide-react';
import { createUserHeaders, getStoredAuthUser, getStoredUserId } from '@/lib/auth/demo-auth-shared';
import {
  areLiveClassesEnabled,
  buildCourseLiveRoomName,
  buildLiveClassPath,
  getLiveClassAvailabilityMessage,
  getLiveClassProvider,
} from '@/lib/live/provider';

type TeacherCourse = {
  id: string;
  title: string;
  subject: string;
  subjectCode: string;
  grade: string;
  students: number;
  lessons: number;
};

export default function TeacherLiveClassesPage({ params }: { params: { locale: string } }) {
  const locale = params.locale;
  const isRTL = locale === 'fa';
  const router = useRouter();
  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [meetingTitle, setMeetingTitle] = useState('');
  const [isLaunching, setIsLaunching] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const provider = getLiveClassProvider();
  const liveClassesEnabled = areLiveClassesEnabled();
  const selectedCourse = useMemo(() => courses.find((course) => course.id === selectedCourseId) || null, [courses, selectedCourseId]);
  const roomName = selectedCourse ? buildCourseLiveRoomName(selectedCourse.id) : '';
  const teacherClassPageUrl = roomName ? buildLiveClassPath(locale, roomName, { role: 'moderator', title: meetingTitle }) : '';
  const studentJoinPageUrl = roomName ? buildLiveClassPath(locale, roomName, { title: meetingTitle }) : '';
  const storedAuthUser = useMemo(() => getStoredAuthUser() as { id?: string; profile?: { displayName?: string; firstName?: string; lastName?: string } } | null, []);

  useEffect(() => {
    let active = true;

    const loadTeacherCourses = async () => {
      try {
        setIsLoadingCourses(true);
        setFeedback(null);
        const response = await fetch(`/api/v1/teacher/courses?locale=${locale}`, {
          cache: 'no-store',
          headers: createUserHeaders(getStoredUserId()),
        });

        if (!response.ok) {
          throw new Error('failed-to-load-teacher-courses');
        }

        const payload = (await response.json()) as { courses?: TeacherCourse[] };
        const nextCourses = payload.courses || [];

        if (!active) {
          return;
        }

        setCourses(nextCourses);
      } catch {
        if (active) {
          setCourses([]);
          setFeedback(isRTL ? 'بارگذاری دوره‌های معلم انجام نشد.' : 'Teacher courses could not be loaded.');
        }
      } finally {
        if (active) {
          setIsLoadingCourses(false);
        }
      }
    };

    loadTeacherCourses();

    return () => {
      active = false;
    };
  }, [isRTL, locale]);

  useEffect(() => {
    if (!selectedCourse) {
      return;
    }

    setMeetingTitle((current) => {
      const trimmed = current.trim();
      if (!trimmed) {
        return `${selectedCourse.title} ${isRTL ? '— کلاس زنده' : '— Live class'}`;
      }
      return current;
    });
  }, [isRTL, selectedCourse]);

  const setupSteps = isRTL
    ? [
        'عنوان جلسه را واضح و کوتاه انتخاب کنید.',
        'ابتدا دوره یا درس‌گروه درست را انتخاب کنید.',
        'دکمه شروع کلاس را بزنید تا اعلان برای دانش‌آموزان فعال شود.',
        'فقط دانش‌آموزان همان دوره اعلان و مسیر ورود را می‌بینند.',
      ]
    : [
        'Choose a short, clear session title.',
        'Select the correct course or teaching group first.',
        'Use the start button so students receive the live alert automatically.',
        'Only students enrolled in that course will receive the alert and join path.',
      ];

  const classTips = isRTL
    ? [
        '۵ دقیقه اول را به خوش‌آمد، حضور و هدف جلسه اختصاص دهید.',
        'هر ۱۰ تا ۱۵ دقیقه یک فعالیت کوتاه یا پرسش تعاملی داشته باشید.',
        'در پایان، تکلیف بعدی و مسیر ادامه یادگیری را شفاف اعلام کنید.',
      ]
    : [
        'Use the first 5 minutes for welcome, attendance, and goals.',
        'Plan a quick interaction every 10–15 minutes.',
        'End with the next task and a clear follow-up path.',
      ];

    const launchLiveClass = async () => {
      if (!teacherClassPageUrl || !roomName || !meetingTitle.trim() || !selectedCourse) {
        return;
      }

      setIsLaunching(true);

      try {
        const teacherName =
          storedAuthUser?.profile?.displayName ||
          [storedAuthUser?.profile?.firstName, storedAuthUser?.profile?.lastName].filter(Boolean).join(' ').trim() ||
          (isRTL ? 'معلم' : 'Teacher');

        await fetch('/api/v1/live/announcements', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...createUserHeaders(storedAuthUser?.id || null),
          },
          body: JSON.stringify({
            roomName,
            title: meetingTitle.trim(),
            locale,
            teacherId: storedAuthUser?.id || null,
            teacherName,
            state: 'live',
          }),
        });
      } catch {
        // Best-effort pre-launch announcement.
      } finally {
        router.push(teacherClassPageUrl);
      }
    };

    const copyStudentJoinLink = async () => {
      if (!studentJoinPageUrl || typeof window === 'undefined' || !selectedCourse) {
        return;
      }

      try {
        const absoluteUrl = new URL(studentJoinPageUrl, window.location.origin).toString();
        await navigator.clipboard.writeText(absoluteUrl);
        setCopyFeedback(isRTL ? 'لینک ورود دانش‌آموزان کپی شد.' : 'Student join link copied.');
        window.setTimeout(() => setCopyFeedback(null), 2500);
      } catch {
        setCopyFeedback(isRTL ? 'کپی لینک انجام نشد.' : 'Could not copy the student link.');
        window.setTimeout(() => setCopyFeedback(null), 2500);
      }
    };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8 overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/10 via-background to-sky-500/10">
          <div className="grid gap-6 px-6 py-8 lg:grid-cols-[1.3fr_0.7fr] lg:px-8">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Video className="h-3.5 w-3.5" />
                {isRTL ? 'فضای برگزاری کلاس زنده' : 'Online classroom hub'}
              </div>
              <h1 className="mt-4 text-3xl font-bold sm:text-4xl">
                {isRTL ? 'کلاس را روان، منظم و حرفه‌ای شروع کنید' : 'Start every class with a smooth, professional flow'}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
                {isRTL
                  ? 'از این صفحه برای آماده‌سازی جلسه، باز کردن کلاس معلم، و ارسال مسیر ورود دانش‌آموزان استفاده کنید. اطلاعاتی که می‌بینید فقط برای اجرای بهتر کلاس طراحی شده‌اند.'
                  : 'Use this page to prepare the session, launch the teacher room, and share the student entry path. Everything here is focused on running class smoothly.'}
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border bg-background/80 p-4 shadow-sm">
                  <Calendar className="h-5 w-5 text-primary" />
                  <p className="mt-3 text-sm font-semibold">{isRTL ? 'شروع سریع' : 'Fast launch'}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{isRTL ? 'در چند ثانیه کلاس را باز کنید.' : 'Open the classroom in seconds.'}</p>
                </div>
                <div className="rounded-2xl border bg-background/80 p-4 shadow-sm">
                  <Users className="h-5 w-5 text-primary" />
                  <p className="mt-3 text-sm font-semibold">{isRTL ? 'ورود دانش‌آموزان' : 'Student access'}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{isRTL ? 'فقط برای دانش‌آموزان همان دوره فعال می‌شود.' : 'Only enabled for students in the selected course.'}</p>
                </div>
                <div className="rounded-2xl border bg-background/80 p-4 shadow-sm">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <p className="mt-3 text-sm font-semibold">{isRTL ? 'آمادگی قبل از کلاس' : 'Before-class readiness'}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{isRTL ? 'پیش‌نمایش، بررسی و ورود مطمئن.' : 'Preview, check, and enter with confidence.'}</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border bg-background/85 p-5 shadow-sm">
              <p className="text-sm font-semibold text-foreground">{isRTL ? 'چک‌لیست شروع کلاس' : 'Class launch checklist'}</p>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                {setupSteps.map((step) => (
                  <li key={step} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>

              {!liveClassesEnabled ? (
                <div className="mt-5 rounded-2xl border border-dashed px-4 py-3 text-sm text-muted-foreground">
                  {getLiveClassAvailabilityMessage(locale, provider)}
                </div>
              ) : null}
              {feedback ? <p className="mt-4 text-sm text-destructive">{feedback}</p> : null}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <section className="rounded-3xl border bg-card p-5 shadow-sm">
            <h2 className="text-lg font-semibold">{isRTL ? 'انتخاب دوره و اطلاعات جلسه' : 'Course selection and session details'}</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">{isRTL ? 'دوره / درس‌گروه' : 'Course / teaching group'}</label>
                <select
                  value={selectedCourseId}
                  onChange={(event) => {
                    const nextId = event.target.value;
                    const nextCourse = courses.find((course) => course.id === nextId) || null;
                    setSelectedCourseId(nextId);
                    setMeetingTitle(nextCourse ? `${nextCourse.title} ${isRTL ? '— کلاس زنده' : '— Live class'}` : '');
                  }}
                  className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
                  disabled={isLoadingCourses || courses.length === 0}
                >
                  <option value="">
                    {isLoadingCourses
                      ? isRTL
                        ? 'در حال بارگذاری...'
                        : 'Loading...'
                      : isRTL
                        ? 'ابتدا دوره را انتخاب کنید'
                        : 'Select a course first'}
                  </option>
                  {courses.length === 0 ? (
                    <option value="" disabled>{isRTL ? 'دوره‌ای در دسترس نیست' : 'No courses available'}</option>
                  ) : null}
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title} — {course.subject}
                    </option>
                  ))}
                </select>
              </div>
              {selectedCourse ? (
                <div className="rounded-2xl border bg-muted/30 p-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2 text-foreground">
                    <GraduationCap className="h-4 w-4 text-primary" />
                    <p className="font-medium">{selectedCourse.title}</p>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <p>{isRTL ? `پایه: ${selectedCourse.grade}` : `Grade: ${selectedCourse.grade}`}</p>
                    <p>{isRTL ? `موضوع: ${selectedCourse.subject}` : `Subject: ${selectedCourse.subject}`}</p>
                    <p>{isRTL ? `دانش‌آموزان مرتبط: ${selectedCourse.students}` : `Linked students: ${selectedCourse.students}`}</p>
                    <p>{isRTL ? `تعداد درس‌ها: ${selectedCourse.lessons}` : `Lessons: ${selectedCourse.lessons}`}</p>
                  </div>
                </div>
              ) : null}
              <div>
                <label className="mb-1 block text-sm font-medium">{isRTL ? 'عنوان جلسه' : 'Session title'}</label>
                <input
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
                />
              </div>

              <div className="rounded-2xl border bg-muted/30 p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">{isRTL ? 'آنچه دانش‌آموزان نیاز دارند' : 'What students need'}</p>
                <ul className="mt-2 space-y-2">
                  <li>{isRTL ? 'لینک ورود همان دوره' : 'The join link for this exact course'}</li>
                  <li>{isRTL ? 'مرورگر به‌روز و دسترسی صدا/تصویر' : 'An up-to-date browser with mic/camera access'}</li>
                  <li>{isRTL ? 'ورود ۵ دقیقه قبل از شروع' : 'Joining about 5 minutes before the start'}</li>
                </ul>
              </div>

              {roomName && liveClassesEnabled && selectedCourse ? (
                <>
                  <button
                    type="button"
                    onClick={launchLiveClass}
                    disabled={isLaunching}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <Video className="h-4 w-4" />
                    {isLaunching
                      ? isRTL
                        ? 'در حال شروع کلاس...'
                        : 'Starting live class...'
                      : isRTL
                        ? 'شروع کلاس و اعلان به دانش‌آموزان'
                        : 'Start class and notify students'}
                  </button>
                  <button
                    type="button"
                    onClick={copyStudentJoinLink}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium hover:bg-muted"
                  >
                    <Copy className="h-4 w-4" />
                    {isRTL ? 'کپی لینک ورود دانش‌آموزان همین دوره' : 'Copy this course student join link'}
                  </button>
                  {copyFeedback ? <p className="text-xs text-muted-foreground">{copyFeedback}</p> : null}
                </>
              ) : !liveClassesEnabled ? (
                <div className="rounded-xl border border-dashed px-4 py-3 text-sm text-muted-foreground">
                  {getLiveClassAvailabilityMessage(locale, provider)}
                </div>
              ) : null}
            </div>
          </section>

          <section className="space-y-4">
            <div className="rounded-3xl border bg-card p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{isRTL ? 'جریان شروع کلاس زنده' : 'Live class launch flow'}</h2>
                  <p className="text-sm text-muted-foreground">{selectedCourse ? `${selectedCourse.title} • ${selectedCourse.subject}` : meetingTitle}</p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  <Video className="h-3.5 w-3.5" />
                  {isRTL ? 'اعلان خودکار برای دانش‌آموزان' : 'Automatic student alert'}
                </span>
              </div>
              {selectedCourse ? (
                <div className="rounded-2xl border bg-muted/20 p-5 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">{isRTL ? 'فرآیند جدید' : 'Updated workflow'}</p>
                  <ol className="mt-3 space-y-2 list-decimal ps-5">
                    <li>{isRTL ? 'دوره درست را انتخاب کنید تا کلاس به همان درس‌گروه وصل شود.' : 'Select the correct course so the class is tied to that teaching group.'}</li>
                    <li>{isRTL ? 'روی «شروع کلاس و اعلان به دانش‌آموزان» بزنید.' : 'Select “Start class and notify students”.'}</li>
                    <li>{isRTL ? 'فقط دانش‌آموزان ثبت‌نام‌شده در همان دوره ظرف چند ثانیه کارت ورود را در داشبورد و اعلان‌ها می‌بینند.' : 'Only students enrolled in that course will see the join card in the dashboard and notifications within a few seconds.'}</li>
                    <li>{isRTL ? 'در صورت نیاز، لینک ورود دانش‌آموزان را نیز کپی و ارسال کنید.' : 'Copy and share the student join link if needed.'}</li>
                  </ol>
                  <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs leading-6 text-muted-foreground">
                    {isRTL
                      ? 'این کلاس از نام اتاق مبتنی بر شناسه دوره استفاده می‌کند، بنابراین اعلان و مسیر ورود فقط برای دانش‌آموزان همان دوره نمایش داده می‌شود.'
                      : 'This class uses a course-based room name, so alerts and join access are scoped to students from that exact course.'}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
                  {isRTL ? 'برای شروع کلاس، یکی از دوره‌های خود را انتخاب کنید.' : 'Select one of your courses to launch a live class.'}
                </div>
              )}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-3xl border bg-card p-5 shadow-sm">
                <div className="flex items-center gap-2 text-foreground">
                  <ClipboardList className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">{isRTL ? 'جریان پیشنهادی کلاس' : 'Suggested class flow'}</h3>
                </div>
                <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                  {classTips.map((tip) => (
                    <li key={tip} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-3xl border bg-card p-5 shadow-sm">
                <div className="flex items-center gap-2 text-foreground">
                  <Users className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">{isRTL ? 'آنچه باید با دانش‌آموزان به اشتراک بگذارید' : 'What to share with students'}</h3>
                </div>
                <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                  <p>{isRTL ? '۱. لینک ورود دانش‌آموزان' : '1. The student entry link'}</p>
                  <p>{isRTL ? '۲. زمان دقیق شروع و مدت تقریبی جلسه' : '2. The exact start time and expected duration'}</p>
                  <p>{isRTL ? '۳. وسایل لازم مثل دفتر، کتاب یا ابزار پروژه' : '3. Any materials needed for the lesson or project'}</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
