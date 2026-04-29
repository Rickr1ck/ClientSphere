
import { useState, useEffect, useCallback } from 'react'
import { ticketService } from '@/services/ticketService'
import type { TicketResponse, TicketStatus } from '@/types/ticket.types'

interface State {
  items:   TicketResponse[]
  total:   number
  loading: boolean
  error:   string | null
}

export function useTickets(page: number, pageSize = 50) {
  const [state, setState] = useState<State>({
    items: [], total: 0, loading: true, error: null,
  })

  const fetch = useCallback(async () => {
    setState(s => ({ ...s, loading: true, error: null }))
    try {
      const data = await ticketService.getAll(page, pageSize)
      setState({
        items:   data.items,
        total:   data.totalCount,
        loading: false,
        error:   null,
      })
    } catch {
      setState(s => ({
        ...s,
        loading: false,
        error: 'Failed to load tickets. Please try again.',
      }))
    }
  }, [page, pageSize])

  useEffect(() => { void fetch() }, [fetch])

  // Optimistic status update — reflects immediately in the list
  const updateStatusLocally = useCallback(
    (id: string, status: TicketStatus) => {
      setState(s => ({
        ...s,
        items: s.items.map(t =>
          t.id === id
            ? { ...t, status, resolvedAt: status === 'Resolved' ? new Date().toISOString() : t.resolvedAt }
            : t
        ),
      }))
    },
    [],
  )

  return { ...state, refetch: fetch, updateStatusLocally }
}