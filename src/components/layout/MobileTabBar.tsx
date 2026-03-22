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
  { title: 'Home', url: '/', icon: Home, color: 'text-[hsl(var(--info))]' },
  { title: 'Projects', url: '/projects', icon: FolderKanban, color: 'text-[hsl(var(--purple))]' },
  { title: 'Tasks', url: '/tasks', icon: CheckSquare, color: 'text-[hsl(var(--cyan))]' },
  { title: 'Invoices', url: '/invoices', icon: FileText, color: 'text-[hsl(var(--success))]' },
];

const moreItems = [
  { title: 'Daily Brief', url: '/daily', icon: CalendarCheck, color: 'text-[hsl(var(--success))]', bg: 'bg-[hsl(var(--success)/0.1)]' },
  { title: 'Workshops', url: '/workshops', icon: Briefcase, color: 'text-[hsl(var(--teal))]', bg: 'bg-[hsl(var(--teal)/0.1)]' },
  { title: 'Meetings', url: '/meetings', icon: CalendarDays, color: 'text-[hsl(var(--warning))]', bg: 'bg-[hsl(var(--warning)/0.1)]' },
  { title: 'Organisations', url: '/clients', icon: Users, color: 'text-[hsl(var(--orange))]', bg: 'bg-[hsl(var(--orange)/0.1)]' },
  { title: 'Contracts', url: '/contracts', icon: FileSignature, color: 'text-[hsl(var(--indigo))]', bg: 'bg-[hsl(var(--indigo)/0.1)]' },
  { title: 'Emails', url: '/emails', icon: Mail, color: 'text-[hsl(var(--pink))]', bg: 'bg-[hsl(var(--pink)/0.1)]' },
  { title: 'Forms', url: '/forms', icon: ClipboardList, color: 'text-[hsl(var(--cyan))]', bg: 'bg-[hsl(var(--cyan)/0.1)]' },
  { title: 'Insights', url: '/insights', icon: BarChart3, color: 'text-[hsl(var(--pink))]', bg: 'bg-[hsl(var(--pink)/0.1)]' },
  { title: 'AI', url: '/ai', icon: Bot, color: 'text-[hsl(var(--indigo))]', bg: 'bg-[hsl(var(--indigo)/0.1)]' },
  { title: 'Knowledge', url: '/knowledge', icon: BookOpen, color: 'text-[hsl(var(--warning))]', bg: 'bg-[hsl(var(--warning)/0.1)]' },
  { title: 'Services', url: '/services', icon: Package, color: 'text-[hsl(var(--orange))]', bg: 'bg-[hsl(var(--orange)/0.1)]' },
  { title: 'Partners', url: '/partners', icon: Handshake, color: 'text-[hsl(var(--teal))]', bg: 'bg-[hsl(var(--teal)/0.1)]' },
  { title: 'Templates', url: '/curriculum', icon: BookTemplate, color: 'text-[hsl(var(--purple))]', bg: 'bg-[hsl(var(--purple)/0.1)]' },
  { title: 'Settings', url: '/settings', icon: Settings, color: 'text-muted-foreground', bg: 'bg-muted' },
  { title: 'Portal', url: '/portal', icon: Globe, color: 'text-[hsl(var(--info))]', bg: 'bg-[hsl(var(--info)/0.1)]' },
];

export function MobileTabBar() {
  const location = useLocation();
  const [sheetOpen, setSheetOpen] = useState(false);

  const isActive = (url: string) =>
    url === '/' ? location.pathname === '/' : location.pathname.startsWith(url);

  const isMoreActive = moreItems.some((m) => isActive(m.url));

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-card/95 backdrop-blur-md border-t border-border safe-area-pb">
      <div className="flex items-center justify-around h-14">
        {tabs.map((tab) => {
          const active = isActive(tab.url);
          return (
            <Link
              key={tab.url}
              to={tab.url}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 text-[10px] font-medium transition-colors',
                active ? tab.color : 'text-muted-foreground'
              )}
            >
              <tab.icon className="h-5 w-5" strokeWidth={active ? 2 : 1.75} />
              <span>{tab.title}</span>
            </Link>
          );
        })}

        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <button
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 text-[10px] font-medium transition-colors cursor-pointer',
                isMoreActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <MoreHorizontal className="h-5 w-5" strokeWidth={1.75} />
              <span>More</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[70vh] rounded-t-2xl">
            <SheetHeader>
              <SheetTitle className="text-left text-sm font-semibold">Navigation</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-3 gap-2 pt-4 pb-6">
              {moreItems.map((item) => {
                const active = isActive(item.url);
                return (
                  <Link
                    key={item.url}
                    to={item.url}
                    onClick={() => setSheetOpen(false)}
                    className={cn(
                      'flex flex-col items-center gap-2 p-3 rounded-xl text-xs font-medium transition-all duration-200',
                      active
                        ? `${item.bg} ${item.color}`
                        : 'text-muted-foreground hover:bg-muted'
                    )}
                  >
                    <div className={cn(
                      'h-10 w-10 rounded-lg flex items-center justify-center',
                      active ? `${item.bg}` : 'bg-muted'
                    )}>
                      <item.icon className={cn('h-5 w-5', active ? item.color : '')} strokeWidth={1.75} />
                    </div>
                    <span>{item.title}</span>
                  </Link>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
