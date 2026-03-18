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
          <header className="h-11 flex items-center justify-between border-b border-border bg-surface/80 backdrop-blur-sm px-4 sticky top-0 z-30">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="mr-1" />
              <button
                onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
                className="hidden md:inline-flex items-center gap-1.5 text-[11px] text-text-3 bg-muted hover:bg-muted/80 px-2 py-1 rounded-md font-mono transition-colors cursor-pointer"
              >
                <kbd className="text-[10px]">⌘</kbd>
                <kbd className="text-[10px]">K</kbd>
              </button>
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
