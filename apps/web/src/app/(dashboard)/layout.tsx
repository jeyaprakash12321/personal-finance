import { Sidebar } from "../components/dashboard/sidebar";
import { Topbar } from "../components/dashboard/topbar";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen bg-[#f7faf8]">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />

        <main className="min-w-0 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}