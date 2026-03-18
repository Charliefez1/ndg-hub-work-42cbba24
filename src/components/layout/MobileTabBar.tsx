import { useLocation, Link } from 'react-router-dom';
import { useState } from 'react';
import { Home, FolderKanban, CheckSquare, FileText, MoreHorizontal } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  CalendarCheck, BarChart3, Briefcase, CalendarDays, BookTemplate,
  FileSignature, ClipboardList, Mail, Globe, Package, Handshake,
  BookOpen, Bot, Settings, Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { title: 'Home', url: '/', icon: Home },
  { title: 'Projects', url: '/projects', icon: FolderKanban },
  { title: 'Tasks', url: '/tasks', icon: CheckSquare },
  { title: 'Invoices', url: '/invoices', icon: FileText },
];

const moreItems = [
  { title: 'Daily Brief', url: '/daily', icon: CalendarCheck },
  { title: 'Clients', url: '/clients', icon: Users },
  { title: 'Insights', url: '/insights', icon: BarChart3 },
  { title: 'Workshops', url: '/workshops', icon: Briefcase },
  { title: 'Meetings', url: '/meetings', icon: CalendarDays },
  { title: 'Curriculum', url: '/curriculum', icon: BookTemplate },
  { title: 'Contracts', url: '/contracts', icon: FileSignature },
  { title: 'Forms', url: '/forms', icon: ClipboardList },
  { title: 'Emails', url: '/emails', icon: Mail },
  { title: 'Portal', url: '/portal', icon: Globe },
  { title: 'Services', url: '/services', icon: Package },
  { title: 'Partners', url: '/partners', icon: Handshake },
  { title: 'Knowledge', url: '/knowledge', icon: BookOpen },
  { title: 'AI', url: '/ai', icon: Bot },
  { title: 'Settings', url: '/settings', icon: Settings },
];

export function MobileTabBar() {
  const location = useLocation();
  const [sheetOpen, setSheetOpen] = useState(false);

  const isActive = (url: string) =>
    url === '/' ? location.pathname === '/' : location.pathname.startsWith(url);

  const isMoreActive = moreItems.some((m) => isActive(m.url));

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-surface border-t border-border safe-area-pb">
      <div className="flex items-center justify-around h-14">
        {tabs.map((tab) => (
          <Link
            key={tab.url}
            to={tab.url}
            className={cn(
              'flex flex-col items-center gap-0.5 px-3 py-1.5 text-[10px] font-medium transition-colors',
              isActive(tab.url) ? 'text-primary' : 'text-text-3'
            )}
          >
            <tab.icon className="h-5 w-5" strokeWidth={1.75} />
            <span>{tab.title}</span>
          </Link>
        ))}

        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <button
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 text-[10px] font-medium transition-colors',
                isMoreActive ? 'text-primary' : 'text-text-3'
              )}
            >
              <MoreHorizontal className="h-5 w-5" strokeWidth={1.75} />
              <span>More</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[70vh]">
            <SheetHeader>
              <SheetTitle className="text-left">Navigation</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-3 gap-2 pt-4 pb-6">
              {moreItems.map((item) => (
                <Link
                  key={item.url}
                  to={item.url}
                  onClick={() => setSheetOpen(false)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 p-3 rounded-lg text-xs font-medium transition-colors',
                    isActive(item.url)
                      ? 'bg-primary/10 text-primary'
                      : 'text-text-2 hover:bg-muted'
                  )}
                >
                  <item.icon className="h-5 w-5" strokeWidth={1.75} />
                  <span>{item.title}</span>
                </Link>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
