
import { useState, useEffect, useCallback } from 'react'
import { leadService } from '@/services/leadService'
import type { LeadResponse } from '@/types/lead.types'
import type { PagedResult } from '@/types/api.types'

interface State {
  data:    PagedResult<LeadResponse> | null
  loading: boolean
  error:   string | null
}

export function useLeads(page: number, pageSize = 20) {
  const [state, setState] = useState<State>({
    data: null, loading: true, error: null,
  })

  const fetch = useCallback(async () => {
    setState(s => ({ ...s, loading: true, error: null }))
    try {
      const data = await leadService.getAll(page, pageSize)
      setState({ data, loading: false, error: null })
    } catch {
      setState(s => ({
        ...s,
        loading: false,
        error: 'Failed to load leads.',
      }))
    }
  }, [page, pageSize])

  useEffect(() => { void fetch() }, [fetch])

  return { ...state, refetch: fetch }
}