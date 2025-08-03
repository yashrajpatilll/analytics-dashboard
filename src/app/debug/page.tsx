"use client";

import React, { useState, useEffect } from "react";
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Card } from "@/components/ui/Card";

export default function DebugPage() {
  const [wsStatus, setWsStatus] = useState("disconnected");
  const [dataCount, setDataCount] = useState(0);
  const [memoryUsage, setMemoryUsage] = useState(0);
  const [userAgent, setUserAgent] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Set mounted to true to avoid hydration mismatch
    setMounted(true);
    
    // Set client-side only values
    setUserAgent(navigator.userAgent);
    setCurrentTime(new Date().toLocaleString());
    
    // Update time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date().toLocaleString());
    }, 1000);
    
    // Test WebSocket connection
    const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || "ws://localhost:8080";
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("WebSocket connected");
      setWsStatus("connected");
    };

    ws.onmessage = (event) => {
      console.log("Received data:", event.data);
      setDataCount((prev) => prev + 1);
    };

    ws.onerror = (error) => {
      console.warn("WebSocket connection failed - this is expected if server is not running:", error.type);
      setWsStatus("error");
    };

    ws.onclose = () => {
      console.log("WebSocket closed");
      setWsStatus("disconnected");
    };

    // Memory monitoring
    const memoryInterval = setInterval(() => {
      if ("memory" in performance) {
        const memory = (performance as { memory?: { usedJSHeapSize: number } }).memory;
        if (memory) {
          setMemoryUsage(Math.round(memory.usedJSHeapSize / 1048576));
        }
      }
    }, 1000);

    return () => {
      ws.close();
      clearInterval(memoryInterval);
      clearInterval(timeInterval);
    };
  }, []);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-foreground">Debug Page</h1>
          <ThemeToggle />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-card text-card-foreground p-4 rounded-lg shadow border border-border">
            <h3 className="font-semibold text-foreground">WebSocket Status</h3>
            <p
              className={`text-lg font-mono ${
                wsStatus === "connected" ? "text-green-600" : "text-red-600"
              }`}
            >
              {wsStatus}
            </p>
          </div>

          <div className="bg-card text-card-foreground p-4 rounded-lg shadow border border-border">
            <h3 className="font-semibold text-foreground">Data Received</h3>
            <p className="text-lg font-mono text-blue-600 dark:text-blue-400">{dataCount}</p>
          </div>

          <div className="bg-card text-card-foreground p-4 rounded-lg shadow border border-border">
            <h3 className="font-semibold text-foreground">Memory Usage</h3>
            <p className="text-lg font-mono text-purple-600 dark:text-purple-400">
              {memoryUsage} MB
            </p>
          </div>
        </div>

        <Card className="bg-muted border border-border p-4 rounded-lg">
          <h3 className="font-semibold mb-2 text-foreground">Browser Info</h3>
          <p className="text-sm text-muted-foreground">
            User Agent: {mounted ? userAgent : 'Loading...'}
          </p>
          <p className="text-sm text-muted-foreground">
            Current Time: {mounted ? currentTime : 'Loading...'}
          </p>
        </Card>

        <div className="mt-8">
          <h3 className="font-semibold mb-2 text-foreground">Instructions</h3>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>Check if WebSocket status shows &quot;connected&quot;</li>
            <li>Data Received should increment every 1-3 seconds</li>
            <li>Memory usage should be reasonable (&lt; 100MB initially)</li>
            <li>Open browser console (F12) to see detailed logs</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
