import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  emoji?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, emoji, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{
          background: 'rgba(189,255,46,0.08)',
          border: '1px dashed rgba(189,255,46,0.25)',
        }}
      >
        {emoji ? (
          <span className="text-3xl">{emoji}</span>
        ) : Icon ? (
          <Icon size={28} className="text-primary-400" strokeWidth={1.5} />
        ) : null}
      </div>
      <p className="text-base font-semibold text-ink mb-1">{title}</p>
      {description && <p className="text-sm text-ink-muted max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
