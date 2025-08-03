# Shareable Dashboard Feature Documentation

## Overview

The Shareable Dashboard feature enables users to create and share analytics dashboards with external stakeholders through secure, time-limited URLs. This implementation provides two distinct sharing modes to balance accessibility with security requirements.

### Key Features
- **Public View**: View-only access without authentication requirements
- **Team Member Access**: Full dashboard functionality for authenticated team members
- **URL-based sharing**: Simple link sharing with automatic state restoration
- **Time-limited access**: Configurable expiration (default: 7 days)
- **Performance protection**: Built-in rate limiting and request caching

## Architecture Overview

### Database Schema
The feature utilizes the `dashboard_shares` table with the following structure:

```sql
CREATE TABLE public.dashboard_shares (
  id text PRIMARY KEY DEFAULT (gen_random_uuid())::text,
  created_by uuid REFERENCES public.user_profiles(id),
  share_type text CHECK (share_type IN ('public', 'member')),
  dashboard_state jsonb NOT NULL DEFAULT '{}',
  expires_at timestamp DEFAULT (now() + '7 days'::interval),
  is_active boolean DEFAULT true,
  access_count integer DEFAULT 0,
  last_accessed_at timestamp,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);
```

### Core Components

#### 1. ShareService (`src/lib/shareService.ts`)
Central service handling all sharing operations:
- **Share Creation**: Generates unique share IDs and stores dashboard state
- **Access Validation**: Authenticates and authorizes share access
- **State Extraction**: Captures current dashboard configuration
- **Rate Limiting**: Prevents API abuse with configurable limits

#### 2. Share Modal (`src/components/sharing/ShareModal.tsx`)
User interface for creating shares:
- Share type selection (Public/Member)
- URL generation and copying
- Real-time share creation feedback

#### 3. Shared Dashboard Page (`src/app/share/[shareId]/page.tsx`)
Dedicated route for accessing shared dashboards:
- Dynamic share validation
- Authentication wrapper for member shares
- Dashboard state restoration
- Error handling with user-friendly messages

#### 4. Dashboard Store Extensions (`src/stores/dashboardStore.ts`)
Enhanced state management:
- Shared view mode detection
- Permission-based feature restrictions
- Site selection with force parameters
- State synchronization for shared views

## Sharing Modes

### Public View (Anonymous Access)
**Capabilities:**
- View analytics charts and data
- See selected site information
- Access to all chart types (Line, Bar, Heatmap)
- Performance metrics visibility

**Restrictions:**
- No site selection/switching
- No filters or sorting
- No export functionality
- No real-time collaboration features
- Limited to pre-selected dashboard configuration

**Use Cases:**
- External stakeholder reports
- Client presentations
- Public performance dashboards
- Marketing team access

### Team Member Access (Authenticated)
**Capabilities:**
- Full dashboard functionality
- Site selection and switching
- Filter and search operations
- Export capabilities
- Real-time data updates
- Access to all dashboard features

**Requirements:**
- User authentication required
- Must be member of the organization
- Subject to role-based permissions

**Use Cases:**
- Cross-team collaboration
- Temporary access for consultants
- Remote team member access
- Stakeholder involvement in analysis

## Technical Implementation

### Share Creation Flow
1. User selects share type and configures options
2. Current dashboard state captured (site selection, filters, date range)
3. Share record created in database with unique ID
4. Shareable URL generated and presented to user
5. Rate limiting applied to prevent abuse

### Share Access Flow
1. User accesses shared URL (`/share/[shareId]`)
2. Share validation performed (existence, expiration, permissions)
3. For member shares: Authentication check performed
4. Dashboard state restored from share configuration
5. Restricted dashboard rendered based on share type
6. Access count incremented for analytics

### State Management
- **Dashboard State Capture**: Includes site selection, filters, date ranges, and chart settings
- **State Restoration**: Automatic application of shared state on page load
- **Permission Enforcement**: Dynamic feature availability based on share type
- **Pending State Handling**: Graceful handling of asynchronous site loading

## Security Considerations

### Access Control
- **Random Share IDs**: Cryptographically secure random identifiers
- **Time-based Expiration**: Automatic share invalidation after 7 days
- **Active State Management**: Ability to deactivate shares manually
- **Permission Validation**: Role-based access control for member shares

### Rate Limiting
Implemented multi-tier rate limiting:
- **Share Creation**: 10 requests per minute per user
- **Share Validation**: 200 requests per minute globally
- **Share Retrieval**: 100 requests per minute globally
- **Circuit Breaker**: Additional protection against infinite loops

### Data Protection
- **Minimal Data Exposure**: Only necessary dashboard state included
- **No Sensitive Information**: User credentials never stored in shares
- **Request Caching**: 30-second TTL to prevent duplicate API calls
- **Error Handling**: Graceful degradation without data leakage

## Performance Optimizations

### Caching Strategy
- **Request-level caching**: 30-second TTL for share validations
- **Component memoization**: Optimized React re-renders
- **State management**: Efficient Zustand store updates

### Database Optimizations
- **Indexed queries**: Primary key and foreign key indexing
- **Minimal data retrieval**: Select only required fields
- **Connection pooling**: Efficient database connection management

### API Protection ✓
- **Rate limiting**: Multi-tier protection against abuse
- **Circuit breakers**: Automatic protection against infinite loops
- **Request deduplication**: Prevents redundant API calls

## Current Limitations

### Technical Constraints
1. **No Real-time Sync**: Shared views use static snapshots, not live collaboration
2. **Single Site Focus**: Public shares limited to one pre-selected site
3. **Limited Customization**: No per-share branding or styling options
4. **Basic Analytics**: Limited tracking of share usage and engagement

### Scalability Considerations
1. **Database Growth**: Share records accumulate over time (mitigated by expiration)
2. **Memory Usage**: Dashboard state stored as JSON in database
3. **Rate Limiting**: Global limits may affect legitimate high-traffic scenarios

### User Experience Limitations
1. **Static Configuration**: Share settings cannot be modified after creation
2. **No Preview**: Creators cannot preview shared view before sharing
3. **Limited Feedback**: Minimal analytics on share engagement
4. **Mobile Optimization**: Some responsive design considerations remain

## Future Enhancement Opportunities

### Short-term Improvements
- **Share Analytics**: Detailed usage tracking and engagement metrics
- **Custom Expiration**: User-configurable expiration times
- **Share Management**: Dashboard for managing created shares
- **Preview Mode**: Preview shared view before finalizing

### Medium-term Features
- **Real-time Collaboration**: Live updates and multi-user editing
- **Custom Branding**: Organization-specific styling for shared views
- **Advanced Permissions**: Granular control over feature access
- **Export Integration**: Direct export capabilities from shared views

### Long-term Vision
- **Embedded Dashboards**: iFrame embedding for external websites
- **API Access**: Programmatic share creation and management
- **White-label Solutions**: Fully customizable shared dashboard experiences
- **Advanced Analytics**: Comprehensive sharing and engagement analytics

## Implementation Files

### Core Implementation
- `src/lib/shareService.ts` - Central sharing logic and API integration
- `src/lib/rateLimiter.ts` - Rate limiting and abuse prevention
- `src/lib/requestCache.ts` - Request caching and circuit breaker
- `src/app/share/[shareId]/page.tsx` - Shared dashboard route and rendering

### UI Components
- `src/components/sharing/ShareModal.tsx` - Share creation interface
- `src/components/dashboard/Dashboard.tsx` - Enhanced with sharing capabilities
- `src/stores/dashboardStore.ts` - Extended state management for sharing

### Database
- `dashboard_shares_migration.sql` - Database schema for sharing functionality
- Row Level Security (RLS) policies for secure data access

## Testing Recommendations

### Manual Testing Scenarios
1. **Public Share Creation and Access**: Verify anonymous access works correctly
2. **Member Share Authentication**: Test authentication flow for team members
3. **State Restoration**: Confirm dashboard state is properly restored
4. **Error Handling**: Test expired, invalid, and deactivated shares
5. **Rate Limiting**: Verify protection against API abuse

### Performance Testing
1. **Load Testing**: Share creation under high concurrent usage
2. **Database Performance**: Query performance with large share datasets
3. **Memory Usage**: Dashboard state storage and retrieval efficiency

## Conclusion

The Shareable Dashboard feature provides a robust foundation for secure dashboard sharing with clear separation between public and authenticated access modes. The implementation prioritizes security, performance, and user experience while maintaining the flexibility for future enhancements.

The current MVP successfully addresses core sharing requirements while establishing architectural patterns that support future scalability and feature development.