import { cn } from '@/lib/utils';

const PALETTE = [
  ['#bdff2e', '#0a0b0e'], // lime
  ['#22d3ee', '#0a0b0e'], // cyan
  ['#a78bfa', '#0a0b0e'], // violet
  ['#fb923c', '#0a0b0e'], // orange
  ['#f472b6', '#0a0b0e'], // pink
  ['#34d399', '#0a0b0e'], // emerald
  ['#fbbf24', '#0a0b0e'], // amber
  ['#60a5fa', '#0a0b0e'], // blue
];

function hashName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return h % PALETTE.length;
}

interface AvatarProps {
  name?: string | null;
  size?: number;
  className?: string;
}

export function Avatar({ name, size = 32, className }: AvatarProps) {
  const display = name?.trim() || '?';
  const initials = display
    .split(' ')
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const [bg, fg] = PALETTE[hashName(display)];
  const fontSize = Math.max(10, Math.round(size * 0.38));

  return (
    <div
      className={cn('rounded-full shrink-0 flex items-center justify-center font-bold select-none', className)}
      style={{ width: size, height: size, background: bg, color: fg, fontSize }}
    >
      {initials}
    </div>
  );
}
