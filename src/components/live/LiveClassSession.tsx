'use client';

import JitsiMeetEmbed from '@/components/live/JitsiMeetEmbed';
import { getLiveClassAvailabilityMessage, getLiveClassProvider, getLiveClassProviderLabel } from '@/lib/live/provider';
import { type LiveClassRole } from '@/lib/live/jitsi';

type LiveClassSessionProps = {
  roomName: string;
  title: string;
  locale: string;
  role?: LiveClassRole;
  displayName?: string;
  email?: string | null;
};

export default function LiveClassSession(props: LiveClassSessionProps) {
  const provider = getLiveClassProvider();
  const isRTL = props.locale === 'fa';

  if (provider === 'disabled' || provider === 'bigbluebutton') {
    return (
      <div className="overflow-hidden rounded-2xl border bg-background shadow-sm">
        <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            {getLiveClassProviderLabel(props.locale, provider)}
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">
              {provider === 'disabled'
                ? isRTL
                  ? 'کلاس زنده در حال حاضر در دسترس نیست'
                  : 'Live class is currently unavailable'
                : isRTL
                  ? 'سامانه کلاس زنده در حال آماده‌سازی است'
                  : 'The live classroom service is being prepared'}
            </h3>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{getLiveClassAvailabilityMessage(props.locale, provider)}</p>
          </div>
        </div>
      </div>
    );
  }

  return <JitsiMeetEmbed {...props} />;
}