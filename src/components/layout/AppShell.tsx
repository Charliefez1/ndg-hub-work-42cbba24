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
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 flex items-center justify-between border-b border-border bg-surface px-4 sticky top-0 z-30">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="mr-1" />
              <kbd className="hidden md:inline-flex items-center gap-1 text-[10px] text-text-3 bg-muted px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
            </div>
            <NotificationBell />
          </header>
          <main className="flex-1 p-lg pb-20 md:pb-lg animate-fade-in-up">
            {children}
          </main>
        </div>
      </div>
      <CommandPalette />
      <MobileTabBar />
    </SidebarProvider>
  );
}
