import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput,
  CommandItem, CommandList, CommandSeparator,
} from '@/components/ui/command';
import {
  Home, FolderKanban, CheckSquare, Users, FileText, CalendarCheck,
  BarChart3, Briefcase, CalendarDays, ClipboardList, Settings, Bot,
  Package, Handshake, BookOpen, Mail, BookTemplate, FileSignature, Globe,
  Plus, Clock,
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

const quickActions = [
  { title: 'Create Task', url: '/tasks?action=create', icon: Plus },
  { title: 'Create Project', url: '/projects?action=create', icon: Plus },
  { title: 'New Meeting', url: '/meetings?action=create', icon: Plus },
];

const groups = ['Core', 'Delivery', 'Commercial', 'Engage', 'Admin'];

const RECENT_KEY = 'nqi-recent-pages';

function getRecentPages(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]').slice(0, 5);
  } catch { return []; }
}

function addRecentPage(url: string) {
  const recent = getRecentPages().filter(u => u !== url);
  recent.unshift(url);
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, 5)));
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Track recent pages
  useEffect(() => {
    addRecentPage(location.pathname);
  }, [location.pathname]);

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

  // Global search across entities
  const { data: searchResults } = useQuery({
    queryKey: ['command-search', search],
    enabled: open && search.length >= 2,
    queryFn: async () => {
      const term = `%${search}%`;
      const [projectsRes, tasksRes, orgsRes, contactsRes] = await Promise.all([
        supabase.from('projects').select('id, name').ilike('name', term).limit(5),
        supabase.from('tasks').select('id, title').ilike('title', term).eq('is_template', false).limit(5),
        supabase.from('organisations').select('id, name').ilike('name', term).limit(5),
        supabase.from('contacts').select('id, name').ilike('name', term).limit(5),
      ]);
      return {
        projects: projectsRes.data ?? [],
        tasks: tasksRes.data ?? [],
        organisations: orgsRes.data ?? [],
        contacts: contactsRes.data ?? [],
      };
    },
  });

  const handleSelect = useCallback((url: string) => {
    setOpen(false);
    setSearch('');
    navigate(url);
  }, [navigate]);

  const recentPages = useMemo(() => {
    return getRecentPages()
      .map(url => pages.find(p => p.url === url))
      .filter(Boolean) as typeof pages;
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasSearchResults = search.length >= 2 && searchResults &&
    (searchResults.projects.length + searchResults.tasks.length +
     searchResults.organisations.length + searchResults.contacts.length) > 0;

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search pages, projects, tasks, clients…" value={search} onValueChange={setSearch} />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Search results */}
        {hasSearchResults && (
          <>
            {searchResults!.projects.length > 0 && (
              <CommandGroup heading="Projects">
                {searchResults!.projects.map(p => (
                  <CommandItem key={p.id} value={`project-${p.name}`} onSelect={() => handleSelect(`/projects/${p.id}`)} className="gap-2">
                    <FolderKanban className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
                    <span>{p.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {searchResults!.tasks.length > 0 && (
              <CommandGroup heading="Tasks">
                {searchResults!.tasks.map(t => (
                  <CommandItem key={t.id} value={`task-${t.title}`} onSelect={() => handleSelect('/tasks')} className="gap-2">
                    <CheckSquare className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
                    <span>{t.title}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {searchResults!.organisations.length > 0 && (
              <CommandGroup heading="Clients">
                {searchResults!.organisations.map(o => (
                  <CommandItem key={o.id} value={`org-${o.name}`} onSelect={() => handleSelect(`/clients/${o.id}`)} className="gap-2">
                    <Users className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
                    <span>{o.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {searchResults!.contacts.length > 0 && (
              <CommandGroup heading="Contacts">
                {searchResults!.contacts.map(c => (
                  <CommandItem key={c.id} value={`contact-${c.name}`} onSelect={() => handleSelect('/clients')} className="gap-2">
                    <Users className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
                    <span>{c.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            <CommandSeparator />
          </>
        )}

        {/* Quick Actions */}
        <CommandGroup heading="Quick Actions">
          {quickActions.map((action) => (
            <CommandItem key={action.url} value={action.title} onSelect={() => handleSelect(action.url)} className="gap-2">
              <action.icon className="h-4 w-4 shrink-0 text-primary" strokeWidth={1.75} />
              <span>{action.title}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        {/* Recent Pages */}
        {recentPages.length > 0 && !search && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Recent">
              {recentPages.map((page) => (
                <CommandItem key={`recent-${page.url}`} value={`recent-${page.title}`} onSelect={() => handleSelect(page.url)} className="gap-2">
                  <Clock className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
                  <span>{page.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        <CommandSeparator />

        {/* All pages */}
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
                    <page.icon className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
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
