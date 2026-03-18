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
    label: 'Menu',
    items: [
      { title: 'Home', url: '/', icon: Home },
      { title: 'Daily Brief', url: '/daily', icon: CalendarCheck },
      { title: 'Projects', url: '/projects', icon: FolderKanban },
      { title: 'Tasks', url: '/tasks', icon: CheckSquare },
      { title: 'Clients', url: '/clients', icon: Users },
      { title: 'Insights', url: '/insights', icon: BarChart3 },
      { title: 'Workshops', url: '/workshops', icon: Briefcase },
      { title: 'Meetings', url: '/meetings', icon: CalendarDays },
      { title: 'Invoices', url: '/invoices', icon: FileText },
      { title: 'Contracts', url: '/contracts', icon: FileSignature },
    ],
  },
  {
    label: 'Workspace',
    items: [
      { title: 'Curriculum', url: '/curriculum', icon: BookTemplate },
      { title: 'Forms', url: '/forms', icon: ClipboardList },
      { title: 'Emails', url: '/emails', icon: Mail },
      { title: 'Client Portal', url: '/portal', icon: Globe },
      { title: 'Services', url: '/services', icon: Package },
      { title: 'Partners', url: '/partners', icon: Handshake },
      { title: 'Knowledge Base', url: '/knowledge', icon: BookOpen },
      { title: 'AI Assistant', url: '/ai', icon: Bot },
      { title: 'Settings', url: '/settings', icon: Settings },
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
          <div className="h-8 w-8 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center">
            <span className="font-satoshi text-sm font-bold text-primary">N</span>
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
            className="flex items-center gap-2 w-full h-8 px-2.5 rounded-md bg-sidebar-accent text-text-3 text-[13px] hover:bg-muted transition-colors cursor-pointer"
          >
            <Search className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
            <span className="flex-1 text-left">Search</span>
            <kbd className="text-[10px] font-mono bg-background/60 px-1.5 py-0.5 rounded text-text-3">⌘K</kbd>
          </button>
        </div>
      )}

      <SidebarContent className="px-1">
        {navGroups.map((group) => (
          <SidebarGroup key={group.label} className="py-1">
            <SidebarGroupLabel className="text-overline text-text-3 px-3 mb-0.5">
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
                          className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[13px] transition-colors duration-100 ${
                            isActive
                              ? 'bg-accent-muted border-l-2 border-accent text-foreground font-medium'
                              : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-muted'
                          }`}
                          activeClassName=""
                        >
                          <item.icon className="h-4 w-4 shrink-0" strokeWidth={isActive ? 2 : 1.5} />
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

      {/* Footer with collapse toggle */}
      <SidebarFooter className="border-t border-sidebar-border">
        {!collapsed && profile?.display_name && (
          <p className="text-caption text-text-3 px-3 mb-1 truncate">{profile.display_name}</p>
        )}
        <div className="flex items-center justify-between px-1">
          <button
            onClick={signOut}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-md text-[13px] text-sidebar-foreground hover:bg-sidebar-accent transition-colors duration-100"
          >
            <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.5} />
            {!collapsed && <span>Sign Out</span>}
          </button>
          {!collapsed && (
            <button
              onClick={toggleSidebar}
              className="h-7 w-7 flex items-center justify-center rounded-md text-text-3 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
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
