import { Suspense } from 'react';
import AffiliateRequests from '@/components/common-admin-manager/affiliate-requests/affiliate-requests';

function AdminAffiliateRequestsPage() {
  return (
    <Suspense
      fallback={<div className="p-6 text-quaternary text-sm">Loading…</div>}
    >
      <AffiliateRequests />
    </Suspense>
  );
}

export default AdminAffiliateRequestsPage;
