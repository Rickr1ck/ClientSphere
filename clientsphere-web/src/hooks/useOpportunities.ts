
import { useState, useEffect, useCallback } from 'react'
import { opportunityService } from '@/services/opportunityService'
import type { OpportunityResponse } from '@/types/opportunity.types'

interface State {
  items:   OpportunityResponse[]
  loading: boolean
  error:   string | null
}

export function useOpportunities() {
  const [state, setState] = useState<State>({
    items: [], loading: true, error: null,
  })

  const fetch = useCallback(async () => {
    setState(s => ({ ...s, loading: true, error: null }))
    try {
      // Load up to 200 opportunities for the board view
      const data = await opportunityService.getAll(1, 200)
      setState({ items: data.items, loading: false, error: null })
    } catch {
      setState(s => ({
        ...s,
        loading: false,
        error: 'Failed to load opportunities.',
      }))
    }
  }, [])

  useEffect(() => { void fetch() }, [fetch])

  // Optimistic stage update — updates local state instantly,
  // API call happens in PipelinePage and refetches on failure
  const updateStageLocally = useCallback(
    (id: string, stage: OpportunityResponse['stage']) => {
      setState(s => ({
        ...s,
        items: s.items.map(o => o.id === id ? { ...o, stage } : o),
      }))
    },
    [],
  )

  return { ...state, refetch: fetch, updateStageLocally }
}