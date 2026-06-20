import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showPercent?: boolean;
  variant?: 'lime' | 'cyan' | 'violet' | 'orange';
  size?: 'sm' | 'md';
  className?: string;
}

const variantStyles = {
  lime: {
    bar: 'bg-lime-gradient',
    glow: '0 0 12px -2px rgba(189,255,46,0.5)',
  },
  cyan: {
    bar: 'bg-cyan-gradient',
    glow: '0 0 12px -2px rgba(34,211,238,0.4)',
  },
  violet: {
    bar: 'bg-violet-400',
    glow: '0 0 12px -2px rgba(167,139,250,0.4)',
  },
  orange: {
    bar: 'bg-orange-400',
    glow: '0 0 12px -2px rgba(251,146,60,0.4)',
  },
};

export function ProgressBar({
  value,
  max = 100,
  label,
  showPercent = false,
  variant = 'lime',
  size = 'md',
  className,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const v = variantStyles[variant];

  return (
    <div className={cn('w-full', className)}>
      {(label || showPercent) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-xs font-medium text-ink-muted">{label}</span>}
          {showPercent && <span className="text-xs font-bold text-ink">{Math.round(pct)}%</span>}
        </div>
      )}
      <div
        className={cn(
          'w-full rounded-full bg-surface-600 overflow-hidden',
          size === 'sm' ? 'h-1.5' : 'h-2.5',
        )}
      >
        <div
          className={cn('h-full rounded-full transition-all duration-500', v.bar)}
          style={{ width: `${pct}%`, boxShadow: pct > 0 ? v.glow : 'none' }}
        />
      </div>
    </div>
  );
}
