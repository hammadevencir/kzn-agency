import { Suspense } from 'react';
import ContactRequests from '@/components/common-admin-manager/contact-requests/contact-requests';

function AdminContactRequestsPage() {
  return (
    <Suspense
      fallback={<div className="p-6 text-quaternary text-sm">Loading…</div>}
    >
      <ContactRequests />
    </Suspense>
  );
}

export default AdminContactRequestsPage;
