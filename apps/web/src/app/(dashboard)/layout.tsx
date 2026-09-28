import { Sidebar } from "../components/dashboard/sidebar";
import { Topbar } from "../components/dashboard/topbar";
import { MobileBottomNav } from "../components/dashboard/mobile-bottom-nav";
import { DialogProvider } from "../components/ui/dialog-provider";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <DialogProvider>
      <div className="flex min-h-screen gap-3 bg-[var(--background)] p-0 lg:p-3">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="min-w-0 flex-1 overflow-y-auto rounded-b-2xl border border-t-0 border-[var(--border)] bg-[var(--surface-subtle)] p-3 pb-24 sm:p-4 lg:rounded-2xl lg:border lg:p-6 lg:pb-6">
            {children}
          </main>
        </div>
        <MobileBottomNav />
      </div>
    </DialogProvider>
  );
}
