'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Database,
  FileText,
  Users,
  Package,
  Image,
  TrendingUp,
  TrendingDown,
  Wrench,
  Eye,
  Filter
} from 'lucide-react'

interface DataQualityIssue {
  id: string
  type: 'missing_field' | 'invalid_value' | 'inconsistent_data' | 'orphaned_record' | 'duplicate_data'
  severity: 'low' | 'medium' | 'high' | 'critical'
  entity: string
  entityId: string
  field: string
  description: string
  currentValue?: any
  expectedValue?: any
  suggestion?: string
}

interface DataQualityReport {
  overallScore: number
  totalRecords: number
  totalIssues: number
  issuesByType: Record<string, number>
  issuesBySeverity: Record<string, number>
  issues: DataQualityIssue[]
  recommendations: string[]
}

export default function DataQualityDashboard() {
  const [report, setReport] = useState<DataQualityReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [fixing, setFixing] = useState(false)

  const fetchDataQualityReport = async () => {
    try {
      setLoading(true)
      setError('')
      
      const token = localStorage.getItem('token')
      if (!token) {
        setError('Authentication required')
        return
      }

      const response = await fetch('/api/data-quality', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch data quality report')
      }

      const data = await response.json()
      setReport(data.report)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const fixDataQualityIssues = async (autoFix: boolean = false) => {
    try {
      setFixing(true)
      
      const token = localStorage.getItem('token')
      if (!token) {
        setError('Authentication required')
        return
      }

      const issueIds = report?.issues.map(issue => issue.id) || []
      
      const response = await fetch('/api/data-quality', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'fix_issues',
          issueIds,
          autoFix
        })
      })

      if (!response.ok) {
        throw new Error('Failed to fix data quality issues')
      }

      const data = await response.json()
      console.log('Fix results:', data.results)
      
      // Refresh the report after fixing
      await fetchDataQualityReport()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setFixing(false)
    }
  }

  useEffect(() => {
    fetchDataQualityReport()
  }, [])

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    if (score >= 50) return 'text-orange-600'
    return 'text-red-600'
  }

  const getScoreIcon = (score: number) => {
    if (score >= 90) return <CheckCircle className="w-5 h-5 text-green-600" />
    if (score >= 70) return <AlertTriangle className="w-5 h-5 text-yellow-600" />
    return <XCircle className="w-5 h-5 text-red-600" />
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'missing_field': return <FileText className="w-4 h-4" />
      case 'invalid_value': return <XCircle className="w-4 h-4" />
      case 'inconsistent_data': return <AlertTriangle className="w-4 h-4" />
      case 'orphaned_record': return <Database className="w-4 h-4" />
      case 'duplicate_data': return <TrendingUp className="w-4 h-4" />
      default: return <AlertTriangle className="w-4 h-4" />
    }
  }

  const getEntityIcon = (entity: string) => {
    switch (entity) {
      case 'Product': return <Package className="w-4 h-4" />
      case 'Category': return <FileText className="w-4 h-4" />
      case 'User': return <Users className="w-4 h-4" />
      case 'Media': return <Image className="w-4 h-4" />
      case 'InventoryHistory': return <TrendingUp className="w-4 h-4" />
      default: return <Database className="w-4 h-4" />
    }
  }

  const filteredIssues = report?.issues.filter(issue => {
    const severityMatch = selectedSeverity === 'all' || issue.severity === selectedSeverity
    const typeMatch = selectedType === 'all' || issue.type === selectedType
    return severityMatch && typeMatch
  }) || []

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Data Quality Dashboard</h2>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4 sm:p-6">
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-slate-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">Error loading data quality report: {error}</div>
        <Button onClick={fetchDataQualityReport} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  if (!report) return null

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Data Quality Dashboard</h2>
          <p className="text-sm sm:text-base text-slate-600">Monitor and improve your data quality</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2 w-full sm:w-auto">
          <Button onClick={fetchDataQualityReport} variant="outline" size="sm" className="w-full sm:w-auto flex-shrink-0">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          {report.totalIssues > 0 && (
            <Button 
              onClick={() => fixDataQualityIssues(true)} 
              variant="default" 
              size="sm"
              disabled={fixing}
              className="w-full sm:w-auto flex-shrink-0"
            >
              <Wrench className="w-4 h-4 mr-2" />
              {fixing ? 'Fixing...' : 'Auto Fix'}
            </Button>
          )}
        </div>
      </div>

      {/* Overall Score */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-x-2">
            {getScoreIcon(report.overallScore)}
            <span className="text-base sm:text-lg">Overall Data Quality Score</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
            <div>
              <div className={`text-3xl sm:text-4xl font-bold ${getScoreColor(report.overallScore)}`}>
                {report.overallScore}/100
              </div>
              <div className="text-xs sm:text-sm text-slate-600 mt-1">
                {report.totalRecords} total records • {report.totalIssues} issues found
              </div>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-xs sm:text-sm text-slate-600">Data Health</div>
              <div className={`text-base sm:text-lg font-semibold ${getScoreColor(report.overallScore)}`}>
                {report.overallScore >= 90 ? 'Excellent' : 
                 report.overallScore >= 70 ? 'Good' : 
                 report.overallScore >= 50 ? 'Fair' : 'Poor'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <Card>
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between space-y-2 sm:space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Critical Issues</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            <div className="text-xl sm:text-2xl font-bold text-red-600">
              {report.issuesBySeverity.critical || 0}
            </div>
            <p className="text-[10px] sm:text-xs text-slate-600">
              Require immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between space-y-2 sm:space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">High Priority</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            <div className="text-xl sm:text-2xl font-bold text-orange-600">
              {report.issuesBySeverity.high || 0}
            </div>
            <p className="text-[10px] sm:text-xs text-slate-600">
              Should be addressed soon
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between space-y-2 sm:space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Medium Priority</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            <div className="text-xl sm:text-2xl font-bold text-yellow-600">
              {report.issuesBySeverity.medium || 0}
            </div>
            <p className="text-[10px] sm:text-xs text-slate-600">
              Can be addressed later
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between space-y-2 sm:space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Low Priority</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            <div className="text-xl sm:text-2xl font-bold text-blue-600">
              {report.issuesBySeverity.low || 0}
            </div>
            <p className="text-[10px] sm:text-xs text-slate-600">
              Minor improvements
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Issue Types */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Issue Types</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
            {Object.entries(report.issuesByType).map(([type, count]) => (
              <div key={type} className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-slate-900">{count || 0}</div>
                <div className="text-xs sm:text-sm text-slate-600 capitalize">
                  {type.replace('_', ' ')}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center space-x-2">
            <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-base sm:text-lg">Issues ({filteredIssues.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <label className="text-xs sm:text-sm font-medium text-slate-700">Severity:</label>
              <select 
                value={selectedSeverity} 
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="mt-1 w-full px-3 py-1 border border-slate-300 rounded-md text-xs sm:text-sm"
              >
                <option value="all">All</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="flex-1 min-w-0">
              <label className="text-xs sm:text-sm font-medium text-slate-700">Type:</label>
              <select 
                value={selectedType} 
                onChange={(e) => setSelectedType(e.target.value)}
                className="mt-1 w-full px-3 py-1 border border-slate-300 rounded-md text-xs sm:text-sm"
              >
                <option value="all">All</option>
                <option value="missing_field">Missing Field</option>
                <option value="invalid_value">Invalid Value</option>
                <option value="inconsistent_data">Inconsistent Data</option>
                <option value="orphaned_record">Orphaned Record</option>
                <option value="duplicate_data">Duplicate Data</option>
              </select>
            </div>
          </div>

          <div className="space-y-2 sm:space-y-3 max-h-96 overflow-y-auto">
            {filteredIssues.map((issue) => (
              <div key={issue.id} className="p-3 sm:p-4 border border-slate-200 rounded-lg">
                <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-0">
                  <div className="flex items-start space-x-3 flex-1 min-w-0">
                    {getEntityIcon(issue.entity)}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                        <span className="text-xs sm:text-sm font-medium text-slate-900">{issue.entity}</span>
                        <Badge className={getSeverityColor(issue.severity)}>
                          <span className="text-[10px] sm:text-xs">{issue.severity}</span>
                        </Badge>
                        <Badge variant="outline" className="flex items-center space-x-1">
                          {getTypeIcon(issue.type)}
                          <span className="capitalize text-[10px] sm:text-xs hidden sm:inline">{issue.type.replace('_', ' ')}</span>
                          <span className="capitalize text-[10px] sm:hidden">{issue.type.split('_')[0]}</span>
                        </Badge>
                      </div>
                      <div className="text-xs sm:text-sm text-slate-600 mb-2">
                        {issue.description}
                      </div>
                      <div className="text-[10px] sm:text-xs text-slate-500">
                        <strong>Field:</strong> {issue.field}
                        {issue.currentValue && (
                          <span> • <strong>Current:</strong> {String(issue.currentValue)}</span>
                        )}
                        {issue.expectedValue && (
                          <span> • <strong>Expected:</strong> {String(issue.expectedValue)}</span>
                        )}
                      </div>
                      {issue.suggestion && (
                        <div className="text-[10px] sm:text-xs text-blue-600 mt-1">
                          💡 {issue.suggestion}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="flex-shrink-0 w-full sm:w-auto">
                    <Eye className="w-4 h-4 sm:mr-1" />
                    <span className="hidden sm:inline">View</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {report.recommendations.length > 0 && (
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-2">
              {report.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <div className="text-blue-600 mt-0.5">•</div>
                  <div className="text-xs sm:text-sm text-slate-700">{recommendation}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
