export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { LoginContent } from './LoginContent';

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface-base flex items-center justify-center">
          <div
            className="w-10 h-10 rounded-full animate-spin"
            style={{ border: '2px solid rgba(189,255,46,0.2)', borderTopColor: '#bdff2e' }}
          />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
