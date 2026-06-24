import { Suspense } from 'react';
import TopUp from '@/components/common-admin-manager/top-ups/top-up';

function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-sm text-quaternary">Loading…</div>
      }
    >
      <TopUp />
    </Suspense>
  );
}

export default DashboardPage;

