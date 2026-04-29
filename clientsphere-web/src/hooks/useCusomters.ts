// src/hooks/useCustomers.ts
import { useState, useEffect, useCallback } from 'react'
import { customerService } from '@/services/customerService'
import type { CustomerResponse } from '@/types/customer.types'
import type { PagedResult } from '@/types/api.types'

interface UseCustomersState {
  data:    PagedResult<CustomerResponse> | null
  loading: boolean
  error:   string | null
}

export function useCustomers(page: number, pageSize = 20) {
  const [state, setState] = useState<UseCustomersState>({
    data:    null,
    loading: true,
    error:   null,
  })

  const fetch = useCallback(async () => {
    setState(s => ({ ...s, loading: true, error: null }))
    try {
      const data = await customerService.getAll(page, pageSize)
      setState({ data, loading: false, error: null })
    } catch {
      setState(s => ({
        ...s,
        loading: false,
        error: 'Failed to load customers. Please try again.',
      }))
    }
  }, [page, pageSize])

  useEffect(() => { void fetch() }, [fetch])

  return { ...state, refetch: fetch }
}