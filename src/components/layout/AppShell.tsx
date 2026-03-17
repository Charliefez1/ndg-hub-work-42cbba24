import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 flex items-center border-b border-border bg-surface px-4 sticky top-0 z-30">
            <SidebarTrigger className="mr-3" />
          </header>
          <main className="flex-1 p-lg animate-fade-in-up">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
