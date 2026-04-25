import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  change?: string;
  changeType?: 'up' | 'down' | 'neutral';
  color?: 'blue' | 'green' | 'purple' | 'orange';
}

// FitLink dark palette — each accent stays vivid against the dark surface.
const colorMap = {
  blue: {
    icon: 'bg-accent-400/15 text-accent-300 ring-1 ring-accent-400/30',
  },
  green: {
    icon: 'bg-primary-400/15 text-primary-300 ring-1 ring-primary-400/30',
  },
  purple: {
    icon: 'bg-violet-400/15 text-violet-300 ring-1 ring-violet-400/30',
  },
  orange: {
    icon: 'bg-orange-400/15 text-orange-300 ring-1 ring-orange-400/30',
  },
};

export function StatCard({
  label,
  value,
  icon: Icon,
  change,
  changeType = 'neutral',
  color = 'blue',
}: StatCardProps) {
  const colors = colorMap[color];

  return (
    <div className="card-glow rounded-2xl p-5 transition-transform hover:-translate-y-0.5">
      <div className="flex items-start justify-between mb-4">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', colors.icon)}>
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
      <p className="text-2xl font-bold text-ink tracking-tight">{value}</p>
      <p className="text-sm text-ink-muted mt-0.5">{label}</p>
    </div>
  );
}
