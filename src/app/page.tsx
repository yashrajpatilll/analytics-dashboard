import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { Dashboard } from '@/components/dashboard/Dashboard';

export default function Home() {
  return (
    <ErrorBoundary>
      <Dashboard />
    </ErrorBoundary>
  );
}
