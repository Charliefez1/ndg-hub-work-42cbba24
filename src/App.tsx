import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initTheme } from '@/lib/theme';
import { AuthProvider } from '@/hooks/useAuth';
import { RouteGuard } from '@/components/auth/RouteGuard';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

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
import Emails from './pages/Emails';
import CurriculumTemplates from './pages/CurriculumTemplates';
import ResetPassword from './pages/ResetPassword';
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
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Admin / Team */}
              <Route path="/" element={<Guard><ErrorBoundary><Home /></ErrorBoundary></Guard>} />
              <Route path="/services" element={<Guard><ErrorBoundary><Services /></ErrorBoundary></Guard>} />
              <Route path="/clients" element={<Guard><ErrorBoundary><Clients /></ErrorBoundary></Guard>} />
              <Route path="/clients/:id" element={<Guard><ErrorBoundary><ClientDetail /></ErrorBoundary></Guard>} />
              <Route path="/projects" element={<Guard><ErrorBoundary><Projects /></ErrorBoundary></Guard>} />
              <Route path="/projects/:id" element={<Guard><ErrorBoundary><ProjectDetail /></ErrorBoundary></Guard>} />
              <Route path="/workshops" element={<Guard><ErrorBoundary><Workshops /></ErrorBoundary></Guard>} />
              <Route path="/workshops/:id" element={<Guard><ErrorBoundary><WorkshopDetail /></ErrorBoundary></Guard>} />
              <Route path="/tasks" element={<Guard><ErrorBoundary><Tasks /></ErrorBoundary></Guard>} />
              <Route path="/forms" element={<Guard><ErrorBoundary><Forms /></ErrorBoundary></Guard>} />
              <Route path="/forms/:id" element={<Guard><ErrorBoundary><FormDetail /></ErrorBoundary></Guard>} />
              <Route path="/invoices" element={<Guard><ErrorBoundary><Invoices /></ErrorBoundary></Guard>} />
              <Route path="/daily" element={<Guard><ErrorBoundary><DailyBrief /></ErrorBoundary></Guard>} />
              <Route path="/insights" element={<Guard><ErrorBoundary><Insights /></ErrorBoundary></Guard>} />
              <Route path="/ai" element={<Guard><ErrorBoundary><AIAssistant /></ErrorBoundary></Guard>} />
              <Route path="/settings" element={<Guard><ErrorBoundary><Settings /></ErrorBoundary></Guard>} />
              <Route path="/meetings" element={<Guard><ErrorBoundary><Meetings /></ErrorBoundary></Guard>} />
              <Route path="/contracts" element={<Guard><ErrorBoundary><Contracts /></ErrorBoundary></Guard>} />
              <Route path="/partners" element={<Guard><ErrorBoundary><Partners /></ErrorBoundary></Guard>} />
              <Route path="/knowledge" element={<Guard><ErrorBoundary><KnowledgeBase /></ErrorBoundary></Guard>} />
              <Route path="/emails" element={<Guard><ErrorBoundary><Emails /></ErrorBoundary></Guard>} />
              <Route path="/curriculum" element={<Guard><ErrorBoundary><CurriculumTemplates /></ErrorBoundary></Guard>} />

              {/* Client portal */}
              <Route path="/portal" element={<RouteGuard allowedRoles={['client']}><ErrorBoundary><Portal /></ErrorBoundary></RouteGuard>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
