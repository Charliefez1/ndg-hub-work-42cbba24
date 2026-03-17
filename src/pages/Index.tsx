import { AppShell } from '@/components/layout/AppShell';

const Index = () => {
  return (
    <AppShell>
      <div className="space-y-lg">
        <h1 className="text-page-title">Home</h1>
        <div className="bg-surface rounded-lg border p-lg text-center text-text-2">
          <p className="text-body">Welcome to NDG Hub! Create your first project to get started.</p>
        </div>
      </div>
    </AppShell>
  );
};

export default Index;
