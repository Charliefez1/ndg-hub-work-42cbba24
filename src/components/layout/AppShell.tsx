import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { CommandPalette } from '@/components/layout/CommandPalette';
import { MobileTabBar } from '@/components/layout/MobileTabBar';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <header className="h-12 flex items-center justify-between px-4 md:px-6 sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/50">
            <SidebarTrigger className="md:hidden" />
            <div className="flex-1" />
            <NotificationBell />
          </header>
          <main className="flex-1 px-4 md:px-6 lg:px-8 pb-20 md:pb-8 pt-5">
            {children}
          </main>
        </div>
      </div>
      <CommandPalette />
      <MobileTabBar />
    </SidebarProvider>
  );
}
