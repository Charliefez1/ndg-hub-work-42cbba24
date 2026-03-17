import {
  Home, CalendarCheck, FolderKanban, CheckSquare, Users, BarChart3,
  Package, FileText, ClipboardList, Globe, Settings, Bot, Briefcase, LogOut,
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
    ],
  },
  {
    label: 'Commercial',
    items: [
      { title: 'Invoices', url: '/invoices', icon: FileText },
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
    </Sidebar>
  );
}
