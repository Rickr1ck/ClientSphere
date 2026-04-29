
import { useState, useEffect, useCallback } from 'react'
import { campaignService } from '@/services/campaignService'
import type { CampaignResponse } from '@/types/campaign.types'

interface State {
  items:   CampaignResponse[]
  total:   number
  loading: boolean
  error:   string | null
}

export function useCampaigns(page: number, pageSize = 50) {
  const [state, setState] = useState<State>({
    items: [], total: 0, loading: true, error: null,
  })

  const fetch = useCallback(async () => {
    setState(s => ({ ...s, loading: true, error: null }))
    try {
      const data = await campaignService.getAll(page, pageSize)
      setState({ items: data.items, total: data.totalCount, loading: false, error: null })
    } catch {
      setState(s => ({ ...s, loading: false, error: 'Failed to load campaigns.' }))
    }
  }, [page, pageSize])

  useEffect(() => { void fetch() }, [fetch])

  return { ...state, refetch: fetch }
}