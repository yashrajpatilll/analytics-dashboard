# Analytics Dashboard - SonarLabs Assessment

A comprehensive real-time analytics dashboard built with Next.js 14, TypeScript, and WebSocket integration for monitoring website performance across multiple client sites. Features advanced data export capabilities with professional PDF reports and CSV downloads.

## 🚀 Features

### Core Analytics Dashboard
- **Real-time WebSocket Connection**: Connects to `ws://localhost:8080` with robust reconnection logic
- **State Management**: Zustand store with automatic data pruning (max 1000 points per site)
- **Three Chart Types**:
  - Line Chart: Page views trend visualization
  - Bar Chart: Performance metrics display
  - HeatMap: User behavior flow visualization
- **Performance Monitoring**: Real-time FPS and memory usage tracking
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Error Boundaries**: Comprehensive error handling and recovery

### Advanced Export System
- **CSV Export**: Professional data export with formatted dates and proper structure
- **PDF Export**: High-quality reports with embedded charts and themed layouts
- **Role-based Access**: Admin, Analyst, and Viewer permission levels
- **Chart Integration**: Professional PDF layout with captured visualizations
- **Multiple Data Scopes**: Current site, all sites, or filtered data export
- **Smart UX**: Separate Share/Export buttons, loading states, and success feedback

### Collaborative Features
- **URL Sharing**: Shareable dashboard links with preserved filters and selections
- **User Authentication**: Secure login system with Supabase integration

## 🏗️ Architecture

### Project Structure
```
src/
├── app/                    # Next.js App Router
├── components/
│   ├── auth/              # Authentication components
│   ├── dashboard/         # Main dashboard components
│   ├── charts/           # Chart components (Line, Bar, HeatMap)
│   ├── export/           # Export functionality (Modal, Options)
│   └── ui/              # Reusable UI components
├── hooks/               # Custom React hooks (useExport, useWebSocket)
├── lib/                 # Core services (exportService, collaborativeSessionService)
├── stores/             # Zustand state management
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

### Key Technologies
- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS with semantic theme variables
- **Charts**: Recharts library with html2canvas capture
- **Export**: jsPDF, papaparse for professional data export
- **State Management**: Zustand with devtools and persistence
- **Authentication**: Supabase Auth with role-based permissions
- **Real-time**: WebSocket with reconnection logic
- **Database**: Supabase PostgreSQL
- **Icons**: Lucide React

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account (for authentication and collaboration features)

### Installation

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd analytics-dashboard
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Database Setup** (Optional - for collaboration features)
   ```bash
   # Run the collaboration setup SQL in your Supabase SQL editor
   # Files: setup_collaboration_tables.sql or simple_collaboration_setup.sql
   ```

5. **Start WebSocket Server**
   ```bash
   # In one terminal
   node websocket-server.js
   # Should show: Analytics WebSocket Server running on ws://localhost:8080
   ```

6. **Start Development Server**
   ```bash
   # In another terminal
   npm run dev
   # Visit http://localhost:3000
   ```

7. **Build for Production**
   ```bash
   npm run build
   npm start
   ```

## 📊 Data Export Formats

### CSV Export Structure
The CSV export provides flattened analytics data with human-readable formatting:

```csv
timestamp,siteId,siteName,pageViews,uniqueVisitors,bounceRate,avgSessionDuration,loadTime,topPage,topPageViews
8/3/2025 10:30,site_005,Corporate Website,216,148,0.67,113,256,/,66
```

### PDF Export Features
- **Professional Layout**: Themed headers with app branding
- **Chart Integration**: High-resolution chart captures
- **Structured Pages**: Chart 1 on page 1, subsequent charts on separate pages
- **Data Tables**: Formatted summary tables with alternating row colors
- **Metadata**: Export timestamp, user role, and data scope information

## 📊 WebSocket Data Structure

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
- **Site Filtering**: Advanced filtering options for targeted analysis

### Charts & Visualization
- **Page Views Trend**: Line chart showing traffic over time
- **Performance Metrics**: Bar chart for load times and Core Web Vitals
- **User Behavior**: Heatmap of page transitions and flow analysis
- **Interactive Charts**: Hover tooltips, zoom, and responsive design

### Data Export & Sharing
- **CSV Export**: Formatted data with proper headers and date formatting
- **PDF Reports**: Professional layouts with embedded charts and metadata
- **Role-based Access**: Export permissions based on user roles (Admin/Analyst/Viewer)
- **Multiple Scopes**: Export current site, all sites, or filtered datasets
- **Chart Inclusion**: Optional chart embedding in PDF exports
- **Shareable URLs**: Generate links with preserved dashboard state

### Authentication & Collaboration
- **Secure Login**: Supabase-powered authentication system
- **User Roles**: Admin, Analyst, and Viewer permission levels
- **Real-time Presence**: See who else is viewing the dashboard
- **Session Persistence**: Maintain state across browser tabs and sessions

### Connection Management
- **Connection Status**: Visual indicator (Connected/Disconnected)
- **Auto Reconnection**: Configurable retry logic with exponential backoff
- **Error Handling**: Graceful degradation on connection issues
- **Performance Monitoring**: Real-time FPS and memory usage tracking

## 🔧 Technical Decisions

### Architecture Choices
1. **Zustand over Redux**: Simpler API, better performance for real-time data
2. **Recharts**: Mature library with good TypeScript support and chart capture compatibility
3. **Custom WebSocket Hook**: Flexible reconnection and error handling
4. **Component Composition**: Modular design for maintainability
5. **Supabase Integration**: Managed authentication and real-time database
6. **Export Service Pattern**: Centralized logic for CSV/PDF generation

### Export System Design
1. **html2canvas Integration**: Reliable chart capture with fallback handling
2. **jsPDF + papaparse**: Professional document generation
3. **Color Compatibility**: Modern CSS function support (oklab, oklch)
4. **Role-based Permissions**: Secure data access control
5. **Optimized Chart Scaling**: Different scales for different chart types

### Performance Strategies
1. **Data Pruning**: Prevent unbounded memory growth
2. **Component Memoization**: Reduce unnecessary re-renders
3. **Efficient State Shape**: Normalized data structure
4. **Strategic Re-renders**: Minimize chart updates
5. **Export Optimization**: Async processing with progress feedback
6. **Memory Management**: Proper cleanup of chart captures and generated files

## 🧪 Testing the Dashboard

### Basic Functionality
1. **Start both servers** (WebSocket + Next.js)
2. **Open browser** to http://localhost:3000
3. **Verify real-time data** appears within seconds
4. **Test site selection** by clicking different site buttons
5. **Monitor performance** metrics in the bottom panel
6. **Test reconnection** by stopping/starting WebSocket server

### Export Functionality Testing
1. **CSV Export**: Click Export → Select CSV → Choose data types → Export
2. **PDF Export**: Click Export → Select PDF → Enable charts → Export
3. **Permission Testing**: Test different user roles (Admin/Analyst/Viewer)
4. **Scope Testing**: Export current site vs all sites data
5. **Chart Verification**: Ensure all charts appear in PDF exports
6. **Error Handling**: Test with no data or network issues

### Authentication & Collaboration
1. **Login Flow**: Test Supabase authentication
2. **Role Assignment**: Verify correct permissions per role
3. **URL Sharing**: Generate and test shareable dashboard links
4. **Multi-user**: Open dashboard in multiple tabs/browsers

### Responsive Design Testing
1. **Mobile Devices**: Test on phones (320px+)
2. **Tablets**: Test on medium screens (768px+)
3. **Desktop**: Test on large screens (1024px+)
4. **Export Modal**: Verify modal responsiveness across devices

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
- Monitor connection status indicator in dashboard

### Export Issues
- **Charts not in PDF**: Verify `data-chart` attributes on chart containers
- **Large PDF files**: Reduce chart scale or disable chart inclusion
- **Permission errors**: Check user role and scope selection
- **Browser compatibility**: Ensure modern browser for html2canvas support
- **Memory issues**: Close other tabs during large exports

### Authentication Issues
- Verify Supabase environment variables in `.env.local`
- Check Supabase project settings and URL configuration
- Ensure proper database setup for collaboration features
- Test authentication flow in incognito mode

### Performance Issues
- Monitor memory usage in Chrome DevTools
- Check Network tab for connection issues
- Use React Developer Tools for component analysis
- Monitor export processing times for large datasets

### Build Issues
- Clear `.next` folder and rebuild
- Verify all dependencies are installed (including export packages)
- Check TypeScript configuration
- Ensure all environment variables are set for production

### Development Setup Issues
- Verify Node.js version (18+ required)
- Check WebSocket server logs for connection errors
- Ensure Supabase project is active and accessible
- Test with sample data if WebSocket server is not providing data

## 📚 Documentation

For detailed technical documentation on specific features:
- **Export System**: See `docs/EXPORT_FUNCTIONALITY.md` for comprehensive export implementation details
- **Testing Setup**: See `TESTING_SETUP.md` for collaboration feature testing
- **Configuration**: See `CLAUDE.md` for development guidelines and configurations

## 🚀 Current Status

### Completed Features ✅
- ✅ Real-time WebSocket dashboard with three chart types
- ✅ Responsive design with mobile-first approach
- ✅ Professional CSV/PDF export system
- ✅ Role-based authentication with Supabase
- ✅ URL sharing with state preservation
- ✅ Performance monitoring and memory management
- ✅ Comprehensive error handling and reconnection logic

### Architecture Highlights
- **Modern Stack**: Next.js 14, TypeScript, Tailwind CSS
- **State Management**: Zustand with persistence and devtools
- **Real-time**: WebSocket with robust reconnection
- **Export Quality**: Professional PDF reports with embedded charts
- **Security**: Role-based access control and secure authentication
- **Performance**: Optimized rendering and memory management

## 📄 License

This project is created for the SonarLabs Frontend Engineer Assessment.
