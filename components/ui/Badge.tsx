import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'lime' | 'violet';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  dot?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

// FitLink: badges sit on dark surfaces; use tinted rings for richness.
const variantMap: Record<BadgeVariant, string> = {
  default: 'bg-surface-600 text-ink-muted ring-1 ring-surface-border-strong',
  success: 'bg-primary-400/15 text-primary-300 ring-1 ring-primary-400/30',
  warning: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30',
  error: 'bg-red-500/15 text-red-300 ring-1 ring-red-500/30',
  info: 'bg-accent-400/15 text-accent-300 ring-1 ring-accent-400/30',
  lime: 'bg-primary-400/15 text-primary-300 ring-1 ring-primary-400/30',
  violet: 'bg-violet-400/15 text-violet-300 ring-1 ring-violet-400/30',
};

const dotColorMap: Record<BadgeVariant, string> = {
  default: 'bg-ink-subtle',
  success: 'bg-primary-400',
  warning: 'bg-amber-400',
  error: 'bg-red-400',
  info: 'bg-accent-400',
  lime: 'bg-primary-400',
  violet: 'bg-violet-400',
};

export function Badge({ children, variant = 'default', dot = false, size = 'md', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-semibold',
        size === 'sm' ? 'px-1.5 py-px text-[10px]' : 'px-2 py-0.5 text-xs',
        variantMap[variant],
        className,
      )}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColorMap[variant])} />}
      {children}
    </span>
  );
}
