import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

// FitLink: badges sit on dark surfaces; use tinted rings for richness.
const variantMap: Record<BadgeVariant, string> = {
  default: 'bg-surface-600 text-ink-muted ring-1 ring-surface-border-strong',
  success: 'bg-primary-400/15 text-primary-300 ring-1 ring-primary-400/30',
  warning: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30',
  error: 'bg-red-500/15 text-red-300 ring-1 ring-red-500/30',
  info: 'bg-accent-400/15 text-accent-300 ring-1 ring-accent-400/30',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold',
        variantMap[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
