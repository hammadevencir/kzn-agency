'use client';

import { useRouter } from 'next/navigation';
import UserManagement from '@/components/Admin/usermanagement/user-management';

function AdminUserManagementPage() {
  const router = useRouter();

  const handleViewDetails = (user) => {
    // Navigate to user profile page with user ID
    router.push(`/admin/user-profile/${user.id || '1'}`);
  };

  return <UserManagement onViewDetails={handleViewDetails} />;
}

export default AdminUserManagementPage;
