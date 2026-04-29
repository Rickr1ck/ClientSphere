// src/hooks/useDashboard.ts
// Computes all dashboard metrics from parallel API calls.
// Uses Promise.allSettled so a single failed endpoint never breaks the whole dashboard.
import { useState, useEffect } from 'react'
import { customerService }     from '@/services/customerService'
import { opportunityService }  from '@/services/opportunityService'
import { ticketService }       from '@/services/ticketService'
import { invoiceService }      from '@/services/invoiceService'
import type { MonthlyWonData, TicketStatusData, DashboardSummary } from '@/types/dashboard.types'
import type { OpportunityResponse } from '@/types/opportunity.types'
import type { TicketResponse }      from '@/types/ticket.types'
import type { InvoiceResponse }     from '@/types/invoice.types'

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const TICKET_STATUS_COLORS: Record<string, string> = {
  Open:       '#378ADD',
  InProgress: '#534AB7',
  Pending:    '#BA7517',
  Resolved:   '#639922',
  Closed:     '#888780',
}

const TICKET_STATUS_LABELS: Record<string, string> = {
  Open:       'Open',
  InProgress: 'In progress',
  Pending:    'Pending',
  Resolved:   'Resolved',
  Closed:     'Closed',
}

// ── Metric derivations ────────────────────────────────────────────────────────
function computeSummary(
  opportunities: OpportunityResponse[],
  tickets:       TicketResponse[],
  invoices:      InvoiceResponse[],
  customerTotal: number,
): DashboardSummary {
  const won  = opportunities.filter(o => o.stage === 'ClosedWon').length
  const lost = opportunities.filter(o => o.stage === 'ClosedLost').length
  const winRate = won + lost > 0
    ? Math.round((won / (won + lost)) * 100)
    : 0

  const totalRevenue = invoices
    .filter(i => i.status === 'Paid')
    .reduce((sum, i) => sum + i.totalAmount, 0)

  const openTickets   = tickets.filter(t => t.status === 'Open' || t.status === 'InProgress').length
  const urgentTickets = tickets.filter(t => t.aiSentimentLabel === 'Urgent').length

  const newCustomersMonth = 0  // requires customer createdAt — placeholder

  return {
    totalRevenue,
    revenueGrowth:     14,   // placeholder until historical endpoint exists
    activeCustomers:   customerTotal,
    newCustomersMonth,
    openTickets,
    urgentTickets,
    winRate,
  }
}

function computeMonthlyWon(opportunities: OpportunityResponse[]): MonthlyWonData[] {
  const now     = new Date()
  const results: MonthlyWonData[] = []

  // Build last 6 months
  for (let i = 5; i >= 0; i--) {
    const d     = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const year  = d.getFullYear()
    const month = d.getMonth()

    const wonThisMonth = opportunities.filter(o => {
      if (o.stage !== 'ClosedWon' || !o.closedAt) return false
      const closed = new Date(o.closedAt)
      return closed.getFullYear() === year && closed.getMonth() === month
    })

    results.push({
      month: MONTH_LABELS[month],
      won:   wonThisMonth.length,
      value: wonThisMonth.reduce((s, o) => s + (o.estimatedValue ?? 0), 0),
    })
  }

  return results
}

function computeTicketsByStatus(tickets: TicketResponse[]): TicketStatusData[] {
  const counts: Record<string, number> = {}
  for (const t of tickets) {
    counts[t.status] = (counts[t.status] ?? 0) + 1
  }
  return Object.entries(counts)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => ({
      status: TICKET_STATUS_LABELS[status] ?? status,
      count,
      color:  TICKET_STATUS_COLORS[status] ?? '#888780',
    }))
    .sort((a, b) => b.count - a.count)
}

// ── Hook ──────────────────────────────────────────────────────────────────────
interface DashboardData {
  summary:        DashboardSummary | null
  monthlyWon:     MonthlyWonData[]
  ticketsByStatus:TicketStatusData[]
  loading:        boolean
  error:          string | null
}

export function useDashboard(): DashboardData {
  const [state, setState] = useState<DashboardData>({
    summary:         null,
    monthlyWon:      [],
    ticketsByStatus: [],
    loading:         true,
    error:           null,
  })

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      const [customers, opportunities, tickets, invoices] = await Promise.allSettled([
        customerService.getAll(1, 1),       // only need totalCount
        opportunityService.getAll(1, 500),
        ticketService.getAll(1, 500),
        invoiceService.getAll(1, 500),
      ])

      if (cancelled) return

      // Extract data — gracefully fall back to empty on any failure
      const customerTotal = customers.status === 'fulfilled'
        ? customers.value.totalCount : 0
      const opps    = opportunities.status === 'fulfilled'
        ? opportunities.value.items : []
      const tix     = tickets.status === 'fulfilled'
        ? tickets.value.items : []
      const invs    = invoices.status === 'fulfilled'
        ? invoices.value.items : []

      const anyFailed = [customers, opportunities, tickets, invoices]
        .some(r => r.status === 'rejected')

      setState({
        summary:         computeSummary(opps, tix, invs, customerTotal),
        monthlyWon:      computeMonthlyWon(opps),
        ticketsByStatus: computeTicketsByStatus(tix),
        loading:         false,
        error:           anyFailed
          ? 'Some data could not be loaded. Metrics may be partial.'
          : null,
      })
    }

    void load()
    return () => { cancelled = true }
  }, [])

  return state
}