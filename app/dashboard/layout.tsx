import { Sidebar } from '@/components/layout/Sidebar';
import AuthGuard from '@/components/auth/AuthGuard';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex h-[100dvh] bg-surface-base text-ink">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {children}
        </div>
      </div>
    </AuthGuard>
  );
}
