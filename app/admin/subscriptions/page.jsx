import { Suspense } from 'react';
import Susbsciption from '@/components/Admin/subscriptions/susbsciption';

function AdminSubscriptionsPage() {
  return (
    <Suspense
      fallback={<div className="p-6 text-quaternary text-sm">Loading…</div>}
    >
      <Susbsciption />
    </Suspense>
  );
}

export default AdminSubscriptionsPage;
