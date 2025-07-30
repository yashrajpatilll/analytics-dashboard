# Analytics Dashboard - SonarLabs Assessment

A real-time analytics dashboard built with Next.js 14, TypeScript, and WebSocket integration for monitoring website performance across multiple client sites.

## 🚀 Features

### Day 1 Implementation (Foundation)
- **Real-time WebSocket Connection**: Connects to `ws://localhost:8080` with robust reconnection logic
- **State Management**: Zustand store with automatic data pruning (max 1000 points per site)
- **Three Chart Types**:
  - Line Chart: Page views trend visualization
  - Bar Chart: Performance metrics display
  - HeatMap: User behavior flow visualization
- **Performance Monitoring**: Real-time FPS and memory usage tracking
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Error Boundaries**: Comprehensive error handling and recovery

## 🏗️ Architecture

### Project Structure
```
src/
├── app/                    # Next.js App Router
├── components/
│   ├── dashboard/         # Main dashboard components
│   ├── charts/           # Chart components (Line, Bar, HeatMap)
│   └── ui/              # Reusable UI components
├── hooks/               # Custom React hooks
├── stores/             # Zustand state management
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

### Key Technologies
- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts library
- **State Management**: Zustand with devtools
- **Real-time**: WebSocket with reconnection logic
- **Icons**: Lucide React

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start WebSocket Server**
   ```bash
   # In one terminal
   node websocket-server.js
   # Should show: Analytics WebSocket Server running on ws://localhost:8080
   ```

3. **Start Development Server**
   ```bash
   # In another terminal
   npm run dev
   # Visit http://localhost:3000
   ```

4. **Build for Production**
   ```bash
   npm run build
   npm start
   ```

## 📊 Data Structure

The WebSocket server streams analytics data in this format:

```typescript
interface AnalyticsDataPoint {
  timestamp: string;
  siteId: string;
  siteName: string;
  pageViews: number;
  uniqueVisitors: number;
  bounceRate: number;
  avgSessionDuration: number;
  topPages: Array<{ path: string; views: number; }>;
  performanceMetrics: {
    loadTime: number;
    firstContentfulPaint: number;
    largestContentfulPaint: number;
  };
  userFlow: Array<{
    from: string;
    to: string;
    count: number;
  }>;
}
```

## 🚀 Performance Features

### Memory Management
- **Automatic Data Pruning**: Limits to 1000 data points per site
- **Time-based Cleanup**: Removes data older than 30 minutes
- **Memory Monitoring**: Real-time memory usage tracking

### Performance Optimizations
- **Memoized Components**: React.memo for chart components
- **Optimized Re-renders**: Strategic use of useMemo and useCallback
- **Efficient State Updates**: Zustand for minimal re-renders
- **Data Virtualization Ready**: Structure prepared for large datasets

## 🎯 Dashboard Features

### Site Management
- **Multi-site Support**: Handle 50+ sites simultaneously
- **Site Selection**: Click to focus on specific site data
- **Real-time Updates**: Live data streaming from WebSocket

### Charts & Visualization
- **Page Views Trend**: Line chart showing traffic over time
- **Performance Metrics**: Bar chart for load times
- **User Behavior**: Heatmap of page transitions

### Connection Management
- **Connection Status**: Visual indicator (Connected/Disconnected)
- **Auto Reconnection**: Configurable retry logic
- **Error Handling**: Graceful degradation on connection issues

## 🔧 Technical Decisions

### Architecture Choices
1. **Zustand over Redux**: Simpler API, better performance for real-time data
2. **Recharts**: Mature library with good TypeScript support
3. **Custom WebSocket Hook**: Flexible reconnection and error handling
4. **Component Composition**: Modular design for maintainability

### Performance Strategies
1. **Data Pruning**: Prevent unbounded memory growth
2. **Component Memoization**: Reduce unnecessary re-renders
3. **Efficient State Shape**: Normalized data structure
4. **Strategic Re-renders**: Minimize chart updates

## 🧪 Testing the Dashboard

1. **Start both servers** (WebSocket + Next.js)
2. **Open browser** to http://localhost:3000
3. **Verify real-time data** appears within seconds
4. **Test site selection** by clicking different site buttons
5. **Monitor performance** metrics in the bottom panel
6. **Test reconnection** by stopping/starting WebSocket server

## 📱 Responsive Design

- **Mobile First**: Optimized for mobile devices
- **Tablet Support**: Adapted layouts for medium screens
- **Desktop Enhanced**: Full feature set on large screens
- **Touch Friendly**: Appropriate touch targets and interactions

## 🐛 Troubleshooting

### WebSocket Connection Issues
- Ensure WebSocket server is running on port 8080
- Check firewall settings
- Verify no other services using port 8080

### Performance Issues
- Monitor memory usage in Chrome DevTools
- Check Network tab for connection issues
- Use React Developer Tools for component analysis

### Build Issues
- Clear `.next` folder and rebuild
- Verify all dependencies are installed
- Check TypeScript configuration

## 📄 License

This project is created for the SonarLabs Frontend Engineer Assessment.
