import { LucideIcon } from 'lucide-react';

interface StudentPageStat {
  label: string;
  value: string;
  icon: LucideIcon;
  helper?: string;
  tone?: 'primary' | 'success' | 'warning' | 'accent';
}

interface StudentPageHeaderProps {
  locale: string;
  eyebrow?: string;
  title: string;
  description: string;
  stats?: StudentPageStat[];
  actions?: React.ReactNode;
}

const toneClasses: Record<NonNullable<StudentPageStat['tone']>, string> = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  accent: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
};

export function StudentPageHeader({ locale, eyebrow, title, description, stats = [], actions }: StudentPageHeaderProps) {
  const isRTL = locale === 'fa';

  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-primary/10 bg-gradient-to-br from-primary/15 via-background to-background shadow-sm sm:rounded-3xl">
      <div className="grid gap-5 p-5 sm:gap-6 sm:p-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:p-8">
        <div className="space-y-4">
          {eyebrow ? (
            <span className="inline-flex rounded-full border border-primary/20 bg-background/80 px-3 py-1 text-xs font-medium text-primary shadow-sm">
              {eyebrow}
            </span>
          ) : null}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">{title}</h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">{description}</p>
          </div>
          {actions ? <div className={`flex flex-col gap-3 sm:flex-row sm:flex-wrap [&>*]:w-full sm:[&>*]:w-auto ${isRTL ? 'sm:justify-start' : ''}`}>{actions}</div> : null}
        </div>

        {stats.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:w-[17.75rem] lg:justify-self-end lg:grid-cols-1 lg:gap-2.5">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="rounded-2xl border bg-background/90 p-4 shadow-sm backdrop-blur lg:p-3.5">
                  <div className="flex items-start gap-3 lg:gap-2.5">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${toneClasses[stat.tone || 'primary']} lg:h-10 lg:w-10`}>
                      <Icon className="h-5 w-5 lg:h-4.5 lg:w-4.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{stat.label}</p>
                      <p className="mt-1 text-2xl font-bold lg:text-[1.35rem] lg:leading-none">{stat.value}</p>
                      {stat.helper ? <p className="mt-1 text-[11px] leading-5 text-muted-foreground lg:leading-4">{stat.helper}</p> : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export type { StudentPageStat };
