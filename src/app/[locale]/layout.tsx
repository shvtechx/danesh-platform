import { NextIntlClientProvider } from 'next-intl';
import { notFound } from 'next/navigation';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import '@/styles/globals.css';
import type { Metadata, Viewport } from 'next';

const locales = ['en', 'fa'];

async function getMessages(locale: string) {
  try {
    return (await import(`../../../messages/${locale}.json`)).default;
  } catch (error) {
    notFound();
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
};

export async function generateMetadata({ 
  params: { locale } 
}: { 
  params: { locale: string } 
}): Promise<Metadata> {
  const isFA = locale === 'fa';
  
  return {
    title: {
      template: isFA ? '%s | دانش - پلتفرم آموزشی' : '%s | Danesh Learning Platform',
      default: isFA ? 'دانش - پلتفرم آموزشی آنلاین' : 'Danesh - Online Learning Platform',
    },
    description: isFA 
      ? 'دانش یک پلتفرم آموزشی آنلاین دوزبانه است که با استفاده از گیمیفیکیشن، یادگیری را جذاب و موثر می‌کند.'
      : 'Danesh is a bilingual online learning platform that makes learning engaging and effective through gamification.',
    keywords: isFA
      ? ['آموزش آنلاین', 'دانش', 'یادگیری', 'دوره آموزشی', 'گیمیفیکیشن', 'مدرسه آنلاین']
      : ['online learning', 'Danesh', 'education', 'courses', 'gamification', 'e-learning'],
    authors: [{ name: 'Danesh Team' }],
    creator: 'Danesh Learning Platform',
    publisher: 'Danesh',
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      type: 'website',
      locale: isFA ? 'fa_IR' : 'en_US',
      alternateLocale: isFA ? 'en_US' : 'fa_IR',
      url: 'https://danesh.app',
      siteName: isFA ? 'دانش' : 'Danesh',
      title: isFA ? 'دانش - پلتفرم آموزشی آنلاین' : 'Danesh - Online Learning Platform',
      description: isFA 
        ? 'یادگیری جذاب با گیمیفیکیشن'
        : 'Engaging learning with gamification',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: isFA ? 'دانش - پلتفرم آموزشی' : 'Danesh Learning Platform',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: isFA ? 'دانش - پلتفرم آموزشی' : 'Danesh Learning Platform',
      description: isFA 
        ? 'یادگیری جذاب با گیمیفیکیشن'
        : 'Engaging learning with gamification',
      images: ['/og-image.png'],
    },
    alternates: {
      canonical: `https://danesh.app/${locale}`,
      languages: {
        'en': '/en',
        'fa': '/fa',
      },
    },
    manifest: '/manifest.json',
    icons: {
      icon: [
        { url: '/favicon.ico' },
        { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
      apple: [
        { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
      ],
    },
  };
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!locales.includes(locale)) {
    notFound();
  }

  const messages = await getMessages(locale);
  const isRTL = locale === 'fa';

  return (
    <html lang={locale} dir={isRTL ? 'rtl' : 'ltr'} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var root=document.documentElement;var t=localStorage.getItem('theme');if(t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme:dark)').matches)||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches)){root.classList.add('dark')}else{root.classList.remove('dark')}var s=localStorage.getItem('danesh.settings.v1');if(s){var parsed=JSON.parse(s);var a=parsed&&parsed.accessibility?parsed.accessibility:null;if(a){if(a.fontSize){root.setAttribute('data-font-size',a.fontSize)}root.classList.toggle('reduce-motion',!!a.reduceMotion);root.classList.toggle('high-contrast',!!a.highContrast);root.classList.toggle('focus-mode',!!a.focusMode)}}}catch(e){}})()`,
          }}
        />
        <link
          href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css"
          rel="stylesheet"
        />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        <link rel="dns-prefetch" href="https://cdn.jsdelivr.net" />
      </head>
      <body className={`min-h-screen antialiased ${isRTL ? 'font-vazir' : 'font-sans'}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NextIntlClientProvider locale={locale} messages={messages}>
            {children}
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
