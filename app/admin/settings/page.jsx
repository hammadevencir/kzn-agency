import Settings from '@/components/common-admin-manager/settings';
import TeamSettings from '@/components/common-admin-manager/team-settings';

function AdminSettingsPage() {
  return (
    <>
      <Settings />
      {/* Manager-only: admin logins (Manager / Customer Service). */}
      <TeamSettings />
    </>
  );
}

export default AdminSettingsPage;
