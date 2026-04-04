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

const colorMap = {
  blue: {
    bg: 'bg-primary-50',
    icon: 'bg-primary-100 text-primary-600',
  },
  green: {
    bg: 'bg-emerald-50',
    icon: 'bg-emerald-100 text-emerald-600',
  },
  purple: {
    bg: 'bg-violet-50',
    icon: 'bg-violet-100 text-violet-600',
  },
  orange: {
    bg: 'bg-orange-50',
    icon: 'bg-orange-100 text-orange-600',
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
    <div className={cn('rounded-xl p-5 border border-slate-200 bg-white shadow-sm')}>
      <div className="flex items-start justify-between mb-4">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', colors.icon)}>
          <Icon size={20} strokeWidth={1.8} />
        </div>
        {change && (
          <span
            className={cn(
              'text-xs font-semibold px-2 py-0.5 rounded-full',
              changeType === 'up' && 'bg-emerald-100 text-emerald-700',
              changeType === 'down' && 'bg-red-100 text-red-700',
              changeType === 'neutral' && 'bg-slate-100 text-slate-600',
            )}
          >
            {change}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}
