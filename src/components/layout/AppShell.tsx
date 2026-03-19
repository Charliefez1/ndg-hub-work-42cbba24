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
          {/* Minimal top bar — only visible controls, no heavy chrome */}
          <header className="h-10 flex items-center justify-between px-4 sticky top-0 z-30 bg-background/80 backdrop-blur-sm">
            <SidebarTrigger className="md:hidden" />
            <div className="flex-1" />
            <NotificationBell />
          </header>
          <main className="flex-1 px-6 md:px-8 pb-20 md:pb-8 pt-2 animate-fade-in-up">
            {children}
          </main>
        </div>
      </div>
      <CommandPalette />
      <MobileTabBar />
    </SidebarProvider>
  );
}
