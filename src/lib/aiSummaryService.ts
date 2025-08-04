import { AIInsight, AIAnalysisContext } from '@/types/ai';
import { AnalyticsDataPoint } from '@/types/analytics';

/**
 * Mock AI Summary Service
 * Simulates AI-powered analysis of analytics data
 * Provides realistic insights based on actual data patterns
 */
export class AISummaryService {
  private static instance: AISummaryService;

  static getInstance(): AISummaryService {
    if (!AISummaryService.instance) {
      AISummaryService.instance = new AISummaryService();
    }
    return AISummaryService.instance;
  }

  /**
   * Generate AI insights based on current analytics context
   */
  async generateInsights(context: AIAnalysisContext): Promise<AIInsight[]> {
    // Simulate AI processing delay
    await this.simulateProcessingDelay();

    const insights: AIInsight[] = [];
    const { recentData, currentMetrics, selectedSiteId } = context;

    if (!selectedSiteId || !recentData.length) {
      return this.getPlaceholderInsights();
    }

    // Analyze performance patterns
    insights.push(...this.analyzePerformance(recentData, currentMetrics));
    
    // Analyze traffic patterns
    insights.push(...this.analyzeTraffic(recentData, currentMetrics));
    
    // Analyze user behavior
    insights.push(...this.analyzeUserBehavior(recentData, currentMetrics));
    
    // Generate recommendations
    insights.push(...this.generateRecommendations(recentData, currentMetrics));
    
    // Add some additional random insights for variety
    insights.push(...this.generateRandomInsights(recentData, currentMetrics));

    // Sort by severity and confidence, then shuffle similar confidence insights
    return insights
      .sort((a, b) => {
        const severityOrder = { high: 3, medium: 2, low: 1 };
        return (severityOrder[b.severity] - severityOrder[a.severity]) || 
               (b.confidence - a.confidence);
      })
      .slice(0, 5); // Return top 5 insights for more variety
  }

  private async simulateProcessingDelay(): Promise<void> {
    // Realistic AI processing time simulation
    const delay = Math.random() * 1500 + 500; // 500-2000ms
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  private analyzePerformance(data: AnalyticsDataPoint[], currentMetrics: AIAnalysisContext['currentMetrics']): AIInsight[] {
    const insights: AIInsight[] = [];
    const avgLoadTime = currentMetrics.avgLoadTime || 0;
    const recentLoadTimes = data.slice(-10).map(d => d.performanceMetrics.loadTime);
    const avgRecentLoadTime = recentLoadTimes.reduce((a, b) => a + b, 0) / recentLoadTimes.length;

    // Slow loading detection
    if (avgRecentLoadTime > 3.0) {
      insights.push({
        id: `perf-slow-${Date.now()}`,
        type: 'performance',
        severity: avgRecentLoadTime > 5.0 ? 'high' : 'medium',
        title: 'Page Load Speed Alert',
        description: `Site is responding ${avgRecentLoadTime > 5.0 ? 'significantly' : 'moderately'} slower than optimal. Average load time is ${avgRecentLoadTime.toFixed(1)}s, consider optimizing critical resources.`,
        timestamp: new Date().toISOString(),
        confidence: 0.85,
        relatedMetrics: ['loadTime', 'firstContentfulPaint'],
        actionable: true
      });
    }

    // Performance improvement detection
    if (avgRecentLoadTime < avgLoadTime * 0.8 && avgLoadTime > 0) {
      insights.push({
        id: `perf-improved-${Date.now()}`,
        type: 'performance',
        severity: 'low',
        title: 'Performance Improvement Detected',
        description: `Great news! Page load times have improved by ${((1 - avgRecentLoadTime / avgLoadTime) * 100).toFixed(0)}% in recent activity.`,
        timestamp: new Date().toISOString(),
        confidence: 0.78,
        relatedMetrics: ['loadTime'],
        actionable: false
      });
    }

    return insights;
  }

  private analyzeTraffic(data: AnalyticsDataPoint[], _currentMetrics: AIAnalysisContext['currentMetrics']): AIInsight[] {
    const insights: AIInsight[] = [];
    const recentViews = data.slice(-10).map(d => d.pageViews);
    const avgRecentViews = recentViews.reduce((a, b) => a + b, 0) / recentViews.length;
    const totalViews = data.reduce((sum, d) => sum + d.pageViews, 0);

    // Traffic spike detection
    const maxRecentViews = Math.max(...recentViews);
    if (maxRecentViews > avgRecentViews * 2 && avgRecentViews > 10) {
      insights.push({
        id: `traffic-spike-${Date.now()}`,
        type: 'traffic',
        severity: 'medium',
        title: 'Unusual Traffic Activity',
        description: `Detected ${((maxRecentViews / avgRecentViews - 1) * 100).toFixed(0)}% increase in page views. Monitor server capacity and user experience during this surge.`,
        timestamp: new Date().toISOString(),
        confidence: 0.82,
        relatedMetrics: ['pageViews', 'uniqueVisitors'],
        actionable: true
      });
    }

    // Low traffic alert
    if (avgRecentViews < 5 && totalViews > 50) {
      insights.push({
        id: `traffic-low-${Date.now()}`,
        type: 'alert',
        severity: 'medium',
        title: 'Decreased Traffic Pattern',
        description: `Traffic appears lower than historical patterns. Consider reviewing recent changes or external factors affecting site visibility.`,
        timestamp: new Date().toISOString(),
        confidence: 0.71,
        relatedMetrics: ['pageViews', 'uniqueVisitors'],
        actionable: true
      });
    }

    return insights;
  }

  private analyzeUserBehavior(data: AnalyticsDataPoint[], _currentMetrics: AIAnalysisContext['currentMetrics']): AIInsight[] {
    const insights: AIInsight[] = [];
    const recentBounceRates = data.slice(-5).map(d => d.bounceRate);
    const avgBounceRate = recentBounceRates.reduce((a, b) => a + b, 0) / recentBounceRates.length;

    // High bounce rate detection
    if (avgBounceRate > 0.7) {
      insights.push({
        id: `behavior-bounce-${Date.now()}`,
        type: 'user_behavior',
        severity: avgBounceRate > 0.85 ? 'high' : 'medium',
        title: 'High Bounce Rate Detected',
        description: `${(avgBounceRate * 100).toFixed(0)}% of recent visitors are leaving without interaction. Review page content relevance and loading experience.`,
        timestamp: new Date().toISOString(),
        confidence: 0.88,
        relatedMetrics: ['bounceRate', 'avgSessionDuration'],
        actionable: true
      });
    }

    // Good engagement detection
    if (avgBounceRate < 0.4 && recentBounceRates.length >= 3) {
      insights.push({
        id: `behavior-good-${Date.now()}`,
        type: 'user_behavior',
        severity: 'low',
        title: 'Strong User Engagement',
        description: `Excellent user engagement with only ${(avgBounceRate * 100).toFixed(0)}% bounce rate. Users are actively exploring your content.`,
        timestamp: new Date().toISOString(),
        confidence: 0.75,
        relatedMetrics: ['bounceRate', 'avgSessionDuration'],
        actionable: false
      });
    }

    return insights;
  }

  private generateRecommendations(data: AnalyticsDataPoint[], _currentMetrics: AIAnalysisContext['currentMetrics']): AIInsight[] {
    const insights: AIInsight[] = [];
    const topPages = data.flatMap(d => d.topPages).reduce((acc, page) => {
      acc[page.path] = (acc[page.path] || 0) + page.views;
      return acc;
    }, {} as Record<string, number>);

    const topPagesArray = Object.entries(topPages)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    if (topPagesArray.length > 0) {
      const topPage = topPagesArray[0];
      insights.push({
        id: `rec-optimize-${Date.now()}`,
        type: 'recommendation',
        severity: 'low',
        title: 'Optimization Opportunity',
        description: `"${topPage[0]}" is your highest traffic page with ${topPage[1]} views. Consider A/B testing improvements to maximize conversions on this key page.`,
        timestamp: new Date().toISOString(),
        confidence: 0.68,
        relatedMetrics: ['topPages'],
        actionable: true
      });
    }

    return insights;
  }

  private getPlaceholderInsights(): AIInsight[] {
    return [
      {
        id: 'placeholder-1',
        type: 'recommendation',
        severity: 'low',
        title: 'Ready for AI Analysis',
        description: 'Select a site and wait for data collection to begin receiving AI-powered insights about your analytics patterns.',
        timestamp: new Date().toISOString(),
        confidence: 1.0,
        actionable: false
      }
    ];
  }

  private generateRandomInsights(data: AnalyticsDataPoint[], currentMetrics: AIAnalysisContext['currentMetrics']): AIInsight[] {
    const insights: AIInsight[] = [];
    const randomTemplates = [
      {
        type: 'performance' as const,
        severity: 'medium' as const,
        titles: [
          'Cache Performance Analysis',
          'Database Query Optimization',
          'Asset Loading Efficiency',
          'CDN Performance Review'
        ],
        descriptions: [
          'Browser caching effectiveness could be improved to reduce server load and enhance user experience.',
          'Database queries are performing well but could benefit from index optimization.',
          'Static assets are loading efficiently with minimal impact on page performance.',
          'Content delivery network is functioning optimally across geographic regions.'
        ]
      },
      {
        type: 'traffic' as const,
        severity: 'low' as const,
        titles: [
          'Geographic Traffic Distribution',
          'Mobile vs Desktop Usage',
          'Peak Hour Analysis',
          'Referral Source Insights'
        ],
        descriptions: [
          'Traffic is well-distributed across regions with consistent engagement patterns.',
          'Mobile traffic represents 60% of total visits with strong conversion rates.',
          'Peak usage occurs between 2-4 PM, suggesting optimal content publishing times.',
          'Organic search continues to be the primary traffic source with high-quality leads.'
        ]
      },
      {
        type: 'user_behavior' as const,
        severity: 'low' as const,
        titles: [
          'Session Duration Trends',
          'Content Engagement Patterns',
          'Navigation Flow Analysis',
          'Exit Point Investigation'
        ],
        descriptions: [
          'Average session duration has increased by 15%, indicating improved content relevance.',
          'Users are engaging deeply with blog content, spending 3+ minutes per article.',
          'Navigation flow shows users are successfully finding desired information.',
          'Most exits occur naturally at content completion rather than mid-session.'
        ]
      }
    ];

    // Randomly select and generate 1-2 additional insights
    const numInsights = Math.random() > 0.5 ? 2 : 1;
    
    for (let i = 0; i < numInsights; i++) {
      const template = randomTemplates[Math.floor(Math.random() * randomTemplates.length)];
      const title = template.titles[Math.floor(Math.random() * template.titles.length)];
      const description = template.descriptions[Math.floor(Math.random() * template.descriptions.length)];
      
      insights.push({
        id: `random-${template.type}-${Date.now()}-${i}`,
        type: template.type,
        severity: template.severity,
        title,
        description,
        timestamp: new Date().toISOString(),
        confidence: 0.6 + Math.random() * 0.3, // Random confidence between 0.6-0.9
        actionable: Math.random() > 0.7 // 30% chance of being actionable
      });
    }

    return insights;
  }

  /**
   * Get a single insight for streaming display
   */
  async getStreamingInsight(context: AIAnalysisContext): Promise<AIInsight | null> {
    const insights = await this.generateInsights(context);
    if (insights.length === 0) return null;
    
    // Randomly select an insight instead of always taking the first one
    const randomIndex = Math.floor(Math.random() * insights.length);
    const selectedInsight = insights[randomIndex];
    
    // Add some randomness to the insight properties to make each one unique
    return {
      ...selectedInsight,
      id: `${selectedInsight.type}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      confidence: Math.max(0.5, Math.min(0.95, selectedInsight.confidence + (Math.random() - 0.5) * 0.2)),
      timestamp: new Date().toISOString()
    };
  }
}

export const aiSummaryService = AISummaryService.getInstance();