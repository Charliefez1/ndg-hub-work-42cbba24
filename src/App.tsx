import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initTheme } from '@/lib/theme';
import { AuthProvider } from '@/hooks/useAuth';
import { RouteGuard } from '@/components/auth/RouteGuard';

// Pages
import Home from './pages/Index';
import Login from './pages/Login';
import Portal from './pages/Portal';
import Services from './pages/Services';
import Clients from './pages/Clients';
import ClientDetail from './pages/ClientDetail';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Workshops from './pages/Workshops';
import WorkshopDetail from './pages/WorkshopDetail';
import Tasks from './pages/Tasks';
import Forms from './pages/Forms';
import FormDetail from './pages/FormDetail';
import PublicForm from './pages/PublicForm';
import Invoices from './pages/Invoices';
import DailyBrief from './pages/DailyBrief';
import Insights from './pages/Insights';
import AIAssistant from './pages/AIAssistant';
import Settings from './pages/Settings';
import Meetings from './pages/Meetings';
import Contracts from './pages/Contracts';
import Partners from './pages/Partners';
import KnowledgeBase from './pages/KnowledgeBase';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

function Guard({ children }: { children: React.ReactNode }) {
  return <RouteGuard allowedRoles={['admin', 'team']}>{children}</RouteGuard>;
}

const App = () => {
  useEffect(() => { initTheme(); }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Public */}
              <Route path="/login" element={<Login />} />
              <Route path="/form/:formId" element={<PublicForm />} />

              {/* Admin / Team */}
              <Route path="/" element={<Guard><Home /></Guard>} />
              <Route path="/services" element={<Guard><Services /></Guard>} />
              <Route path="/clients" element={<Guard><Clients /></Guard>} />
              <Route path="/clients/:id" element={<Guard><ClientDetail /></Guard>} />
              <Route path="/projects" element={<Guard><Projects /></Guard>} />
              <Route path="/projects/:id" element={<Guard><ProjectDetail /></Guard>} />
              <Route path="/workshops" element={<Guard><Workshops /></Guard>} />
              <Route path="/workshops/:id" element={<Guard><WorkshopDetail /></Guard>} />
              <Route path="/tasks" element={<Guard><Tasks /></Guard>} />
              <Route path="/forms" element={<Guard><Forms /></Guard>} />
              <Route path="/forms/:id" element={<Guard><FormDetail /></Guard>} />
              <Route path="/invoices" element={<Guard><Invoices /></Guard>} />
              <Route path="/daily" element={<Guard><DailyBrief /></Guard>} />
              <Route path="/insights" element={<Guard><Insights /></Guard>} />
              <Route path="/ai" element={<Guard><AIAssistant /></Guard>} />
              <Route path="/settings" element={<Guard><Settings /></Guard>} />
              <Route path="/meetings" element={<Guard><Meetings /></Guard>} />
              <Route path="/contracts" element={<Guard><Contracts /></Guard>} />
              <Route path="/partners" element={<Guard><Partners /></Guard>} />
              <Route path="/knowledge" element={<Guard><KnowledgeBase /></Guard>} />

              {/* Client portal */}
              <Route path="/portal" element={<RouteGuard allowedRoles={['client']}><Portal /></RouteGuard>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
