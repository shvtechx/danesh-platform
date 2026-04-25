import { getRequestConfig } from 'next-intl/server';

export const locales = ['en', 'fa'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';
export const rtlLocales: Locale[] = ['fa'];

export function isRtlLocale(locale: string): boolean {
  return rtlLocales.includes(locale as Locale);
}

export function getDirection(locale: string): 'ltr' | 'rtl' {
  return isRtlLocale(locale) ? 'rtl' : 'ltr';
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requestedLocale = await requestLocale;
  const locale = requestedLocale && locales.includes(requestedLocale as Locale)
    ? (requestedLocale as Locale)
    : defaultLocale;

  return {
    locale,
    messages: (await import('../../../messages/' + locale + '.json')).default,
  };
});
