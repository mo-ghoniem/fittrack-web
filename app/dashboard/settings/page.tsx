import { Header } from '@/components/layout/Header';

export default function SettingsPage() {
  return (
    <div className="flex flex-col min-h-full">
      <Header title="Settings" subtitle="Platform configuration" />
      <main className="flex-1 p-6 flex items-center justify-center">
        <div className="text-center text-slate-400">
          <p className="text-4xl mb-3">⚙️</p>
          <p className="text-lg font-semibold text-slate-600">Settings coming soon</p>
          <p className="text-sm mt-1">Platform configuration will appear here.</p>
        </div>
      </main>
    </div>
  );
}
