'use client';

import Link from 'next/link';
import { useEffect, useMemo } from 'react';

function getLocaleFromPathname(pathname: string) {
	const segment = pathname.split('/').filter(Boolean)[0];
	return segment === 'fa' ? 'fa' : 'en';
}

export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	const locale = useMemo(() => {
		if (typeof window === 'undefined') {
			return 'en';
		}

		return getLocaleFromPathname(window.location.pathname);
	}, []);

	const isRTL = locale === 'fa';

	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<html lang={locale} dir={isRTL ? 'rtl' : 'ltr'}>
			<body className="min-h-screen bg-background text-foreground antialiased">
				<div className="flex min-h-screen items-center justify-center px-4">
					<div className="w-full max-w-md rounded-2xl border bg-card p-8 text-center shadow-sm">
						<div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
							<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
								<circle cx="12" cy="12" r="10" />
								<line x1="12" y1="8" x2="12" y2="12" />
								<line x1="12" y1="16" x2="12.01" y2="16" />
							</svg>
						</div>

						<h1 className="mb-3 text-2xl font-bold">
							{isRTL ? 'خطایی رخ داد' : 'Something went wrong'}
						</h1>
						<p className="mb-8 text-sm text-muted-foreground">
							{isRTL
								? 'برنامه با یک خطای غیرمنتظره روبه‌رو شد. دوباره تلاش کنید یا به صفحه اصلی برگردید.'
								: 'The app hit an unexpected error. Try again or return to the home page.'}
						</p>

						<div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
							<button
								type="button"
								onClick={() => reset()}
								className="rounded-xl bg-primary px-5 py-3 text-primary-foreground hover:bg-primary/90"
							>
								{isRTL ? 'تلاش دوباره' : 'Try again'}
							</button>
							<Link
								href={`/${locale}`}
								className="rounded-xl border px-5 py-3 hover:bg-muted"
							>
								{isRTL ? 'بازگشت به خانه' : 'Back to home'}
							</Link>
						</div>
					</div>
				</div>
			</body>
		</html>
	);
}
