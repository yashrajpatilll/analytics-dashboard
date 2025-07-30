import Link from 'next/link';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export default function SimplePage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-start mb-6">
          <h1 className="text-4xl font-bold text-foreground">
            Simple Test Page
          </h1>
          <ThemeToggle />
        </div>
        <p className="text-lg text-muted-foreground mb-8">
          If you can see this page with proper styling, Next.js is working correctly.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card text-card-foreground p-6 rounded-lg shadow border border-border">
            <h3 className="text-xl font-semibold text-foreground mb-2">Status</h3>
            <p className="text-green-600 dark:text-green-400 font-mono text-lg">✓ Working</p>
          </div>
          
          <div className="bg-card text-card-foreground p-6 rounded-lg shadow border border-border">
            <h3 className="text-xl font-semibold text-foreground mb-2">Time</h3>
            <p className="text-blue-600 dark:text-blue-400 font-mono text-lg">
              {new Date().toLocaleTimeString()}
            </p>
          </div>
          
          <div className="bg-card text-card-foreground p-6 rounded-lg shadow border border-border">
            <h3 className="text-xl font-semibold text-foreground mb-2">Ready</h3>
            <p className="text-purple-600 dark:text-purple-400 font-mono text-lg">🚀 Yes</p>
          </div>
        </div>

        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Next Steps:</h4>
          <ul className="list-disc list-inside text-blue-800 dark:text-blue-200 space-y-1">
            <li>Visit <Link href="/debug" className="underline font-medium">localhost:3000/debug</Link> to test WebSocket</li>
            <li>Visit <Link href="/" className="underline font-medium">localhost:3000</Link> for main dashboard</li>
            <li>Check browser console (F12) for any errors</li>
          </ul>
        </div>
      </div>
    </div>
  );
}