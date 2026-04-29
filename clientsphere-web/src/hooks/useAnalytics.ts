import { useState, useEffect } from 'react'
import { analyticsService, type DashboardSummary, type EmployeeSalesStats, type TicketsOverview, type CampaignPerformance } from '@/services/analyticsService'

export function useDashboardAnalytics() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true)
        const response = await analyticsService.getSummary()
        setSummary(response.data)
        setError(null)
      } catch (err: any) {
        setError(err.message || 'Failed to fetch dashboard summary')
      } finally {
        setLoading(false)
      }
    }

    fetchSummary()
  }, [])

  return { summary, loading, error, refetch: () => window.location.reload() }
}

export function useSalesByEmployee() {
  const [stats, setStats] = useState<EmployeeSalesStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const response = await analyticsService.getSalesByEmployee()
        setStats(response.data)
        setError(null)
      } catch (err: any) {
        setError(err.message || 'Failed to fetch sales by employee')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return { stats, loading, error, refetch: () => window.location.reload() }
}

export function useTicketsOverview() {
  const [overview, setOverview] = useState<TicketsOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        setLoading(true)
        const response = await analyticsService.getTicketsOverview()
        setOverview(response.data)
        setError(null)
      } catch (err: any) {
        setError(err.message || 'Failed to fetch tickets overview')
      } finally {
        setLoading(false)
      }
    }

    fetchOverview()
  }, [])

  return { overview, loading, error, refetch: () => window.location.reload() }
}

export function useCampaignPerformance() {
  const [performance, setPerformance] = useState<CampaignPerformance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPerformance = async () => {
      try {
        setLoading(true)
        const response = await analyticsService.getCampaignPerformance()
        setPerformance(response.data)
        setError(null)
      } catch (err: any) {
        setError(err.message || 'Failed to fetch campaign performance')
      } finally {
        setLoading(false)
      }
    }

    fetchPerformance()
  }, [])

  return { performance, loading, error, refetch: () => window.location.reload() }
}
