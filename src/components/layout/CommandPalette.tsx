import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput,
  CommandItem, CommandList, CommandSeparator,
} from '@/components/ui/command';
import {
  Home, FolderKanban, CheckSquare, Users, FileText, CalendarCheck,
  BarChart3, Briefcase, CalendarDays, ClipboardList, Settings, Bot,
  Package, Handshake, BookOpen, Mail, BookTemplate, FileSignature, Globe,
} from 'lucide-react';

const pages = [
  { title: 'Home', url: '/', icon: Home, group: 'Core' },
  { title: 'Daily Brief', url: '/daily', icon: CalendarCheck, group: 'Core' },
  { title: 'Projects', url: '/projects', icon: FolderKanban, group: 'Core' },
  { title: 'Tasks', url: '/tasks', icon: CheckSquare, group: 'Core' },
  { title: 'Clients', url: '/clients', icon: Users, group: 'Core' },
  { title: 'Insights', url: '/insights', icon: BarChart3, group: 'Core' },
  { title: 'Workshops', url: '/workshops', icon: Briefcase, group: 'Delivery' },
  { title: 'Meetings', url: '/meetings', icon: CalendarDays, group: 'Delivery' },
  { title: 'Curriculum', url: '/curriculum', icon: BookTemplate, group: 'Delivery' },
  { title: 'Invoices', url: '/invoices', icon: FileText, group: 'Commercial' },
  { title: 'Contracts', url: '/contracts', icon: FileSignature, group: 'Commercial' },
  { title: 'Forms', url: '/forms', icon: ClipboardList, group: 'Engage' },
  { title: 'Emails', url: '/emails', icon: Mail, group: 'Engage' },
  { title: 'Client Portal', url: '/portal', icon: Globe, group: 'Engage' },
  { title: 'Services', url: '/services', icon: Package, group: 'Admin' },
  { title: 'Partners', url: '/partners', icon: Handshake, group: 'Admin' },
  { title: 'Knowledge Base', url: '/knowledge', icon: BookOpen, group: 'Admin' },
  { title: 'AI Assistant', url: '/ai', icon: Bot, group: 'Admin' },
  { title: 'Settings', url: '/settings', icon: Settings, group: 'Admin' },
];

const groups = ['Core', 'Delivery', 'Commercial', 'Engage', 'Admin'];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleSelect = useCallback((url: string) => {
    setOpen(false);
    navigate(url);
  }, [navigate]);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search pages…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {groups.map((group, gi) => (
          <div key={group}>
            {gi > 0 && <CommandSeparator />}
            <CommandGroup heading={group}>
              {pages
                .filter((p) => p.group === group)
                .map((page) => (
                  <CommandItem
                    key={page.url}
                    value={page.title}
                    onSelect={() => handleSelect(page.url)}
                    className="gap-2"
                  >
                    <page.icon className="h-4 w-4 shrink-0 text-text-3" strokeWidth={1.75} />
                    <span>{page.title}</span>
                  </CommandItem>
                ))}
            </CommandGroup>
          </div>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
