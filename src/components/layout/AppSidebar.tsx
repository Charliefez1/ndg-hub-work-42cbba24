import {
  Home, CalendarCheck, FolderKanban, CheckSquare, Users, BarChart3,
  Package, FileText, ClipboardList, Globe, Settings, Bot, Briefcase, LogOut,
  CalendarDays, FileSignature, Handshake, BookOpen,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

const navGroups = [
  {
    label: 'Core',
    items: [
      { title: 'Home', url: '/', icon: Home },
      { title: 'Daily Brief', url: '/daily', icon: CalendarCheck },
      { title: 'Projects', url: '/projects', icon: FolderKanban },
      { title: 'Tasks', url: '/tasks', icon: CheckSquare },
      { title: 'Clients', url: '/clients', icon: Users },
      { title: 'Insights', url: '/insights', icon: BarChart3 },
    ],
  },
  {
    label: 'Delivery',
    items: [
      { title: 'Workshops', url: '/workshops', icon: Briefcase },
      { title: 'Meetings', url: '/meetings', icon: CalendarDays },
    ],
  },
  {
    label: 'Commercial',
    items: [
      { title: 'Invoices', url: '/invoices', icon: FileText },
      { title: 'Contracts', url: '/contracts', icon: FileSignature },
    ],
  },
  {
    label: 'Engage',
    items: [
      { title: 'Forms', url: '/forms', icon: ClipboardList },
      { title: 'Client Portal', url: '/portal', icon: Globe },
    ],
  },
  {
    label: 'Admin',
    items: [
      { title: 'Services', url: '/services', icon: Package },
      { title: 'Partners', url: '/partners', icon: Handshake },
      { title: 'Knowledge Base', url: '/knowledge', icon: BookOpen },
      { title: 'AI Assistant', url: '/ai', icon: Bot },
      { title: 'Settings', url: '/settings', icon: Settings },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const { profile, signOut } = useAuth();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <div className="h-12 flex items-center px-4 border-b border-sidebar-border">
        {!collapsed && (
          <span className="font-satoshi text-lg font-bold text-sidebar-foreground">
            NDG Hub
          </span>
        )}
      </div>
      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-overline text-text-3 px-3">
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
                          className={`flex items-center gap-2 px-3 py-2 rounded-md text-body transition-colors duration-150 ${
                            isActive
                              ? 'bg-sidebar-accent text-primary font-medium border-l-2 border-primary'
                              : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                          }`}
                          activeClassName=""
                        >
                          <item.icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
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
      <div className="mt-auto border-t border-sidebar-border p-3">
        <button
          onClick={signOut}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-body text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.75} />
          {!collapsed && <span>Sign Out</span>}
        </button>
        {!collapsed && profile?.display_name && (
          <p className="text-caption text-text-3 px-3 mt-1 truncate">{profile.display_name}</p>
        )}
      </div>
    </Sidebar>
  );
}
