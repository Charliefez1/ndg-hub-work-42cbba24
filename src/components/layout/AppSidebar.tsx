import {
  Home, CalendarCheck, FolderKanban, CheckSquare, Users, BarChart3,
  Package, FileText, ClipboardList, Globe, Settings, Bot, Briefcase, LogOut,
  CalendarDays, FileSignature, Handshake, BookOpen, Mail, BookTemplate,
  Search, ChevronLeft,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  useSidebar, SidebarFooter,
} from '@/components/ui/sidebar';

const navGroups = [
  {
    label: 'Work',
    items: [
      { title: 'Dashboard', url: '/', icon: Home, color: 'text-[hsl(var(--info))]', bg: 'bg-[hsl(var(--info)/0.1)]' },
      { title: 'Daily Brief', url: '/daily', icon: CalendarCheck, color: 'text-[hsl(var(--success))]', bg: 'bg-[hsl(var(--success)/0.1)]' },
      { title: 'Projects', url: '/projects', icon: FolderKanban, color: 'text-[hsl(var(--purple))]', bg: 'bg-[hsl(var(--purple)/0.1)]' },
      { title: 'Tasks', url: '/tasks', icon: CheckSquare, color: 'text-[hsl(var(--cyan))]', bg: 'bg-[hsl(var(--cyan)/0.1)]' },
      { title: 'Workshops', url: '/workshops', icon: Briefcase, color: 'text-[hsl(var(--teal))]', bg: 'bg-[hsl(var(--teal)/0.1)]' },
      { title: 'Meetings', url: '/meetings', icon: CalendarDays, color: 'text-[hsl(var(--warning))]', bg: 'bg-[hsl(var(--warning)/0.1)]' },
    ],
  },
  {
    label: 'Clients',
    items: [
      { title: 'Organisations', url: '/clients', icon: Users, color: 'text-[hsl(var(--orange))]', bg: 'bg-[hsl(var(--orange)/0.1)]' },
      { title: 'Invoices', url: '/invoices', icon: FileText, color: 'text-[hsl(var(--success))]', bg: 'bg-[hsl(var(--success)/0.1)]' },
      { title: 'Contracts', url: '/contracts', icon: FileSignature, color: 'text-[hsl(var(--indigo))]', bg: 'bg-[hsl(var(--indigo)/0.1)]' },
      { title: 'Emails', url: '/emails', icon: Mail, color: 'text-[hsl(var(--pink))]', bg: 'bg-[hsl(var(--pink)/0.1)]' },
      { title: 'Forms', url: '/forms', icon: ClipboardList, color: 'text-[hsl(var(--cyan))]', bg: 'bg-[hsl(var(--cyan)/0.1)]' },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { title: 'Insights', url: '/insights', icon: BarChart3, color: 'text-[hsl(var(--pink))]', bg: 'bg-[hsl(var(--pink)/0.1)]' },
      { title: 'AI Assistant', url: '/ai', icon: Bot, color: 'text-[hsl(var(--indigo))]', bg: 'bg-[hsl(var(--indigo)/0.1)]' },
      { title: 'Knowledge Base', url: '/knowledge', icon: BookOpen, color: 'text-[hsl(var(--warning))]', bg: 'bg-[hsl(var(--warning)/0.1)]' },
    ],
  },
  {
    label: 'Admin',
    items: [
      { title: 'Services', url: '/services', icon: Package, color: 'text-[hsl(var(--orange))]', bg: 'bg-[hsl(var(--orange)/0.1)]' },
      { title: 'Partners', url: '/partners', icon: Handshake, color: 'text-[hsl(var(--teal))]', bg: 'bg-[hsl(var(--teal)/0.1)]' },
      { title: 'Templates', url: '/curriculum', icon: BookTemplate, color: 'text-[hsl(var(--purple))]', bg: 'bg-[hsl(var(--purple)/0.1)]' },
      { title: 'Settings', url: '/settings', icon: Settings, color: 'text-muted-foreground', bg: 'bg-muted' },
      { title: 'Client Portal', url: '/portal', icon: Globe, color: 'text-[hsl(var(--info))]', bg: 'bg-[hsl(var(--info)/0.1)]' },
    ],
  },
];

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const { profile, signOut } = useAuth();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
      {/* Logo header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 shrink-0 rounded-lg gradient-accent flex items-center justify-center shadow-sm">
            <span className="font-satoshi text-sm font-bold text-white">N</span>
          </div>
          {!collapsed && (
            <span className="font-satoshi text-[15px] font-bold text-sidebar-foreground tracking-tight">
              NDG Hub
            </span>
          )}
        </div>
      </div>

      {/* Search trigger */}
      {!collapsed && (
        <div className="px-3 pb-2 pt-1">
          <button
            onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
            className="flex items-center gap-2 w-full h-8 px-2.5 rounded-lg bg-muted/60 text-muted-foreground text-[13px] hover:bg-muted transition-colors cursor-pointer"
          >
            <Search className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
            <span className="flex-1 text-left">Search</span>
            <kbd className="text-[10px] font-mono bg-background/80 px-1.5 py-0.5 rounded text-muted-foreground">⌘K</kbd>
          </button>
        </div>
      )}

      <SidebarContent className="px-1">
        {navGroups.map((group) => (
          <SidebarGroup key={group.label} className="py-1">
            <SidebarGroupLabel className="text-overline text-muted-foreground px-3 mb-0.5">
              {!collapsed && group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = item.url === '/'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(item.url);
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          end={item.url === '/'}
                          className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[13px] transition-all duration-150 ${
                            isActive
                              ? 'bg-accent-muted text-foreground font-medium shadow-xs'
                              : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-muted/60'
                          }`}
                          activeClassName=""
                        >
                          <div className={`h-6 w-6 rounded-md ${isActive ? item.bg : 'bg-transparent'} flex items-center justify-center transition-colors`}>
                            <item.icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? item.color : ''}`} strokeWidth={isActive ? 2 : 1.5} />
                          </div>
                          {!collapsed && <span>{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-sidebar-border">
        {!collapsed && profile?.display_name && (
          <div className="px-3 mb-1">
            <p className="text-xs font-medium truncate">{profile.display_name}</p>
            <p className="text-[11px] text-muted-foreground truncate">{profile.role}</p>
          </div>
        )}
        <div className="flex items-center justify-between px-1">
          <button
            onClick={signOut}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[13px] text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors duration-150 cursor-pointer"
          >
            <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.5} />
            {!collapsed && <span>Sign Out</span>}
          </button>
          {!collapsed && (
            <button
              onClick={toggleSidebar}
              className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors cursor-pointer"
              title="Collapse sidebar"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
            </button>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
