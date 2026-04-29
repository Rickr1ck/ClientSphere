
import { useState, useEffect, useCallback } from 'react'
import { invoiceService } from '@/services/invoiceService'
import type { InvoiceResponse } from '@/types/invoice.types'

interface State {
  items:   InvoiceResponse[]
  total:   number
  loading: boolean
  error:   string | null
}

export function useInvoices(page: number, pageSize = 50) {
  const [state, setState] = useState<State>({
    items: [], total: 0, loading: true, error: null,
  })

  const fetch = useCallback(async () => {
    setState(s => ({ ...s, loading: true, error: null }))
    try {
      const data = await invoiceService.getAll(page, pageSize)
      setState({ items: data.items, total: data.totalCount, loading: false, error: null })
    } catch {
      setState(s => ({ ...s, loading: false, error: 'Failed to load invoices.' }))
    }
  }, [page, pageSize])

  useEffect(() => { void fetch() }, [fetch])

  return { ...state, refetch: fetch }
}