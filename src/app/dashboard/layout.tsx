import UserSidebar from '@/components/dashboard/UserSidebar';

export const metadata = {
  title: 'Dashboard | MakeUGC',
  description: 'User dashboard for MakeUGC',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-50">
      <UserSidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
