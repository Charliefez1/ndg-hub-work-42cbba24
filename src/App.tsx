import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initTheme } from '@/lib/theme';
import { AuthProvider } from '@/hooks/useAuth';
import { RouteGuard } from '@/components/auth/RouteGuard';
import Index from './pages/Index';
import Login from './pages/Login';
import Portal from './pages/Portal';
import Services from './pages/Services';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    initTheme();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/"
                element={
                  <RouteGuard allowedRoles={['admin', 'team']}>
                    <Index />
                  </RouteGuard>
                }
              />
              <Route
                path="/services"
                element={
                  <RouteGuard allowedRoles={['admin', 'team']}>
                    <Services />
                  </RouteGuard>
                }
              />
              <Route
                path="/portal"
                element={
                  <RouteGuard allowedRoles={['client']}>
                    <Portal />
                  </RouteGuard>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
