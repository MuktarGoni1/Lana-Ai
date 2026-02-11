// SEO Dashboard Component for Monitoring and Analytics
'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2,
  Eye,
  MousePointerClick,
  Timer,
  Target,
  BarChart3
} from 'lucide-react'
import useSeoMonitoring, { SeoHealthChecker, KeywordTracker } from '@/lib/seo-monitoring'
import { usePerformanceMonitoring } from '@/lib/performance-monitoring'

interface SeoDashboardProps {
  showDetailedView?: boolean;
  refreshInterval?: number; // minutes
}

export function SeoDashboard({ showDetailedView = false, refreshInterval = 5 }: SeoDashboardProps) {
  const { metrics, searchConsoleData, loading } = useSeoMonitoring()
  const [keywordTracker] = useState(() => new KeywordTracker([
    'ai tutoring software',
    'personalized learning platform',
    'ai homework helper',
    'educational ai tools'
  ], process.env.NEXT_PUBLIC_SEO_API_KEY || ''))
  
  const [keywordRankings, setKeywordRankings] = useState<Record<string, number>>({})
  const [seoScore, setSeoScore] = useState<number>(0)
  const [healthIssues, setHealthIssues] = useState<string[]>([])

  usePerformanceMonitoring()

  useEffect(() => {
    const fetchData = async () => {
      if (metrics) {
        // Calculate SEO score
        const score = SeoHealthChecker.getSeoScore(metrics)
        setSeoScore(score)
        
        // Get keyword rankings
        const rankings = await keywordTracker.getKeywordRankings()
        setKeywordRankings(rankings)
        
        // Check for SEO health issues
        const issues = await checkSeoHealth()
        setHealthIssues(issues)
      }
    }

    fetchData()
    
    // Set up refresh interval
    const interval = setInterval(fetchData, refreshInterval * 60 * 1000)
    return () => clearInterval(interval)
  }, [metrics, keywordTracker, refreshInterval])

  const checkSeoHealth = async (): Promise<string[]> => {
    const issues: string[] = []
    
    if (!metrics) return issues
    
    // Check Core Web Vitals
    if (metrics.coreWebVitals.lcp > 2500) issues.push('LCP too slow (>2.5s)')
    if (metrics.coreWebVitals.cls > 0.1) issues.push('CLS too high (>0.1)')
    if (metrics.coreWebVitals.inp > 200) issues.push('INP too slow (>200ms)')
    
    // Check engagement metrics
    if (metrics.bounceRate > 70) issues.push('High bounce rate (>70%)')
    if (metrics.avgSessionDuration < 60) issues.push('Low session duration (<1 min)')
    
    // Check traffic metrics
    if (metrics.organicTraffic < 100) issues.push('Low organic traffic (<100 visits)')
    
    return issues
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">SEO Performance Dashboard</h2>
        <div className="flex items-center gap-2">
          <Badge variant={seoScore >= 80 ? "default" : seoScore >= 60 ? "secondary" : "destructive"}>
            SEO Score: {seoScore}/100
          </Badge>
          <Button variant="outline" size="sm">
            <BarChart3 className="mr-2 h-4 w-4" />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Health Status */}
      {healthIssues.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-5 w-5" />
              SEO Health Alerts ({healthIssues.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {healthIssues.map((issue, index) => (
                <li key={index} className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-yellow-700">{issue}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Organic Traffic"
          value={metrics?.organicTraffic.toLocaleString() || '0'}
          icon={<Eye className="h-5 w-5" />}
          trend={12.5}
          positive={true}
        />
        <MetricCard
          title="Avg. Session Duration"
          value={`${Math.round((metrics?.avgSessionDuration || 0) / 60)}m ${(metrics?.avgSessionDuration || 0) % 60}s`}
          icon={<Timer className="h-5 w-5" />}
          trend={8.2}
          positive={true}
        />
        <MetricCard
          title="Bounce Rate"
          value={`${Math.round(metrics?.bounceRate || 0)}%`}
          icon={<MousePointerClick className="h-5 w-5" />}
          trend={-5.3}
          positive={true}
        />
        <MetricCard
          title="Conversion Rate"
          value={`${Math.round(metrics?.conversionRate || 0)}%`}
          icon={<Target className="h-5 w-5" />}
          trend={3.1}
          positive={true}
        />
      </div>

      {/* Search Console Data */}
      {searchConsoleData && (
        <Card>
          <CardHeader>
            <CardTitle>Search Console Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <StatBox
                label="Clicks"
                value={searchConsoleData.clicks.toLocaleString()}
                change={15.2}
              />
              <StatBox
                label="Impressions"
                value={searchConsoleData.impressions.toLocaleString()}
                change={8.7}
              />
              <StatBox
                label="CTR"
                value={`${searchConsoleData.ctr.toFixed(2)}%`}
                change={2.1}
              />
              <StatBox
                label="Avg. Position"
                value={searchConsoleData.position.toFixed(1)}
                change={-0.3}
                inverse={true}
              />
            </div>

            {showDetailedView && (
              <div>
                <h3 className="font-semibold mb-3">Top Performing Queries</h3>
                <div className="space-y-2">
                  {searchConsoleData.queries.slice(0, 5).map((query, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="font-medium">{query.query}</span>
                      <div className="flex items-center gap-4 text-sm">
                        <span>{query.clicks} clicks</span>
                        <span className={query.position <= 10 ? 'text-green-600' : 'text-orange-600'}>
                          #{Math.round(query.position)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Keyword Rankings */}
      {Object.keys(keywordRankings).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Keyword Rankings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(keywordRankings).map(([keyword, position]) => (
                <div key={keyword} className="flex justify-between items-center p-3 border rounded">
                  <span className="font-medium">{keyword}</span>
                  <Badge variant={position <= 10 ? "default" : position <= 25 ? "secondary" : "outline"}>
                    #{Math.round(position)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Core Web Vitals */}
      {metrics && (
        <Card>
          <CardHeader>
            <CardTitle>Core Web Vitals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <VitalMetric
                name="Largest Contentful Paint"
                value={`${(metrics.coreWebVitals.lcp / 1000).toFixed(2)}s`}
                target="< 2.5s"
                status={metrics.coreWebVitals.lcp <= 2500 ? 'good' : 'needs-improvement'}
              />
              <VitalMetric
                name="Cumulative Layout Shift"
                value={metrics.coreWebVitals.cls.toFixed(3)}
                target="< 0.1"
                status={metrics.coreWebVitals.cls <= 0.1 ? 'good' : 'needs-improvement'}
              />
              <VitalMetric
                name="Interaction to Next Paint"
                value={`${metrics.coreWebVitals.inp}ms`}
                target="< 200ms"
                status={metrics.coreWebVitals.inp <= 200 ? 'good' : 'needs-improvement'}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Helper Components
function MetricCard({ 
  title, 
  value, 
  icon, 
  trend, 
  positive 
}: { 
  title: string; 
  value: string; 
  icon: React.ReactNode; 
  trend: number; 
  positive: boolean; 
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className={`flex items-center text-sm ${positive ? 'text-green-600' : 'text-red-600'}`}>
          {positive ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
          {Math.abs(trend)}% from last month
        </div>
      </CardContent>
    </Card>
  )
}

function StatBox({ label, value, change, inverse = false }: { 
  label: string; 
  value: string; 
  change: number; 
  inverse?: boolean; 
}) {
  const isPositive = inverse ? change < 0 : change > 0
  
  return (
    <div className="text-center">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
      <div className={`text-xs flex items-center justify-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
        {Math.abs(change)}%
      </div>
    </div>
  )
}

function VitalMetric({ name, value, target, status }: { 
  name: string; 
  value: string; 
  target: string; 
  status: 'good' | 'needs-improvement' | 'poor' 
}) {
  return (
    <div className="text-center p-4 border rounded">
      <div className="font-semibold mb-1">{name}</div>
      <div className={`text-2xl font-bold mb-1 ${
        status === 'good' ? 'text-green-600' : status === 'needs-improvement' ? 'text-yellow-600' : 'text-red-600'
      }`}>
        {value}
      </div>
      <div className="text-sm text-gray-500">Target: {target}</div>
      <Badge variant={status === 'good' ? 'default' : status === 'needs-improvement' ? 'secondary' : 'destructive'} className="mt-2">
        {status.replace('-', ' ')}
      </Badge>
    </div>
  )
}

export default SeoDashboard