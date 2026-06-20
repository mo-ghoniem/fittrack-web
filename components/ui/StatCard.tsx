import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  change?: string;
  changeType?: 'up' | 'down' | 'neutral';
  color?: 'lime' | 'cyan' | 'violet' | 'orange' | 'blue' | 'green' | 'purple';
  href?: string;
}

const colorMap = {
  lime: {
    icon: 'bg-primary-400/15 text-primary-300 ring-1 ring-primary-400/30',
    accent: 'rgba(189,255,46,0.12)',
    border: 'rgba(189,255,46,0.18)',
  },
  cyan: {
    icon: 'bg-accent-400/15 text-accent-300 ring-1 ring-accent-400/30',
    accent: 'rgba(34,211,238,0.10)',
    border: 'rgba(34,211,238,0.18)',
  },
  violet: {
    icon: 'bg-violet-400/15 text-violet-300 ring-1 ring-violet-400/30',
    accent: 'rgba(167,139,250,0.10)',
    border: 'rgba(167,139,250,0.18)',
  },
  orange: {
    icon: 'bg-orange-400/15 text-orange-300 ring-1 ring-orange-400/30',
    accent: 'rgba(251,146,60,0.10)',
    border: 'rgba(251,146,60,0.18)',
  },
  // backwards-compat aliases
  blue: {
    icon: 'bg-accent-400/15 text-accent-300 ring-1 ring-accent-400/30',
    accent: 'rgba(34,211,238,0.10)',
    border: 'rgba(34,211,238,0.18)',
  },
  green: {
    icon: 'bg-primary-400/15 text-primary-300 ring-1 ring-primary-400/30',
    accent: 'rgba(189,255,46,0.12)',
    border: 'rgba(189,255,46,0.18)',
  },
  purple: {
    icon: 'bg-violet-400/15 text-violet-300 ring-1 ring-violet-400/30',
    accent: 'rgba(167,139,250,0.10)',
    border: 'rgba(167,139,250,0.18)',
  },
};

export function StatCard({
  label,
  value,
  icon: Icon,
  change,
  changeType = 'neutral',
  color = 'cyan',
}: StatCardProps) {
  const colors = colorMap[color];

  return (
    <div
      className="rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-elevated cursor-default group"
      style={{
        background: `linear-gradient(145deg, ${colors.accent} 0%, rgba(16,17,20,0) 60%), #101114`,
        border: `1px solid ${colors.border}`,
        boxShadow: '0 1px 0 rgba(255,255,255,0.02) inset, 0 10px 30px -18px rgba(0,0,0,0.8)',
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110', colors.icon)}>
          <Icon size={20} strokeWidth={1.8} />
        </div>
        {change && (
          <span
            className={cn(
              'text-xs font-semibold px-2 py-0.5 rounded-full ring-1',
              changeType === 'up' && 'bg-primary-400/15 text-primary-300 ring-primary-400/30',
              changeType === 'down' && 'bg-red-500/15 text-red-300 ring-red-500/30',
              changeType === 'neutral' && 'bg-surface-600 text-ink-muted ring-surface-border-strong',
            )}
          >
            {change}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-ink tracking-tight tabular-nums">{value}</p>
      <p className="text-sm text-ink-muted mt-0.5">{label}</p>
    </div>
  );
}
