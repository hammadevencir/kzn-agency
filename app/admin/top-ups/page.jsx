import { Suspense } from 'react';
import TopUp from '@/components/common-admin-manager/top-ups/top-up';

function AdminTopUpsPage() {
  return (
    <Suspense
      fallback={<div className="p-6 text-quaternary text-sm">Loading…</div>}
    >
      <TopUp />
    </Suspense>
  );
}

export default AdminTopUpsPage;
