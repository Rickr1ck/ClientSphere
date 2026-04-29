// src/pages/tickets/TicketsPage.tsx
import { useState, useMemo, useCallback }  from 'react'
import { useTickets }         from '@/hooks/useTickets'
import { ticketService }      from '@/services/ticketService'
import { useAuthStore }       from '@/store/authStore'
import TicketCard             from './TicketCard'
import TicketDetailView       from './TicketDetailedView'
import Modal                  from '@/components/ui/Modal'
import TicketForm, { TICKET_FORM_ID } from './TicketForm'
import Spinner                from '@/components/ui/Spinner'
import type {
  TicketResponse,
  TicketStatus,
  TicketFilter,
  AiSentimentLabel,
  CreateTicketRequest,
} from '@/types/ticket.types'
import {
  SENTIMENT_SORT_WEIGHT,
  PRIORITY_SORT_WEIGHT,
} from '@/types/ticket.types'

const PAGE_SIZE = 50
type SortBy = 'urgency' | 'created' | 'priority'

export default function TicketsPage() {
  const { role, userId, tenantStatus } = useAuthStore()
  const isTenantActive = tenantStatus === 'Active' || tenantStatus === 'Trialing' || role === 'SuperAdmin'
  const canCreate = (role === 'SupportAgent' || role === 'SuperAdmin') && isTenantActive

  const [search, setSearch] = useState('')
  const [activeFilter, setFilter] = useState<TicketFilter>('all')
  const [sortBy, setSortBy] = useState<SortBy>('urgency')
  const [selected, setSelected] = useState<TicketResponse | null>(null)

  const [page]                       = useState(1)
  const { items, total, loading, error, refetch, updateStatusLocally } =
    useTickets(page, PAGE_SIZE)

  // ── Filter ──────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = [...items]

    // Text search
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(t =>
        t.subject.toLowerCase().includes(q)         ||
        t.ticketNumber.toLowerCase().includes(q)    ||
        (t.description?.toLowerCase().includes(q) ?? false)
      )
    }

    // Tab filter
    switch (activeFilter) {
      case 'urgent':
        result = result.filter(t => t.aiSentimentLabel === 'Urgent')
        break
      case 'open':
        result = result.filter(t =>
          t.status === 'Open' || t.status === 'InProgress' || t.status === 'Pending'
        )
        break
      case 'mine':
        result = result.filter(t => t.assignedToId === userId)
        break
    }

    return result
  }, [items, search, activeFilter, userId])

  // ── Sort ────────────────────────────────────────────────────────────────
  // Urgent tickets ALWAYS appear first regardless of sort selection —
  // this is the core business rule from the brief
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      // Rule 1: Urgent always first
      const aUrgent = a.aiSentimentLabel === 'Urgent' ? 0 : 1
      const bUrgent = b.aiSentimentLabel === 'Urgent' ? 0 : 1
      if (aUrgent !== bUrgent) return aUrgent - bUrgent

      // Rule 2: User-selected sort
      switch (sortBy) {
        case 'urgency': {
          const sentA = SENTIMENT_SORT_WEIGHT[a.aiSentimentLabel as AiSentimentLabel] ?? 99
          const sentB = SENTIMENT_SORT_WEIGHT[b.aiSentimentLabel as AiSentimentLabel] ?? 99
          if (sentA !== sentB) return sentA - sentB
          return PRIORITY_SORT_WEIGHT[a.priority] - PRIORITY_SORT_WEIGHT[b.priority]
        }
        case 'priority':
          return PRIORITY_SORT_WEIGHT[a.priority] - PRIORITY_SORT_WEIGHT[b.priority]
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })
  }, [filtered, sortBy])

  // Keep detail view in sync when local status changes
  const handleStatusUpdated = (id: string, status: TicketStatus) => {
    updateStatusLocally(id, status)
    setSelected(prev =>
      prev?.id === id ? { ...prev, status } : prev
    )
  }

  // ── Create ticket state ───────────────────────────────────────────────────
  const [ticketModalOpen,  setTicketModalOpen]  = useState(false)
  const [ticketEditTarget, setTicketEditTarget] = useState<TicketResponse | null>(null)
  const [ticketSubmitting, setTicketSubmitting] = useState(false)
  const [ticketSubmitError,setTicketSubmitError]= useState<string | null>(null)

  const openTicketCreate = useCallback(() => {
    setTicketEditTarget(null)
    setTicketSubmitError(null)
    setTicketModalOpen(true)
  }, [])

  const openTicketEdit = useCallback((ticket: TicketResponse) => {
    setTicketEditTarget(ticket)
    setTicketSubmitError(null)
    setTicketModalOpen(true)
  }, [])

  const handleTicketSubmit = useCallback(async (values: CreateTicketRequest) => {
    setTicketSubmitting(true)
    setTicketSubmitError(null)
    try {
      if (ticketEditTarget) {
        await ticketService.update(ticketEditTarget.id, {
          ...values,
          status: ticketEditTarget.status
        } as any)
      } else {
        await ticketService.create(values)
      }
      setTicketModalOpen(false)
      void refetch()
    } catch {
      setTicketSubmitError(`Failed to ${ticketEditTarget ? 'update' : 'create'} ticket. Please check your input and try again.`)
    } finally {
      setTicketSubmitting(false)
    }
  }, [ticketEditTarget, refetch])

  // Filter counts for badge display
  const urgentCount = items.filter(t => t.aiSentimentLabel === 'Urgent').length
  const openCount   = items.filter(t =>
    t.status === 'Open' || t.status === 'InProgress' || t.status === 'Pending'
  ).length
  const mineCount   = items.filter(t => t.assignedToId === userId).length

  const FILTERS: { id: TicketFilter; label: string; count?: number }[] = [
    { id: 'all',    label: 'All',    count: total     },
    { id: 'urgent', label: 'Urgent', count: urgentCount },
    { id: 'open',   label: 'Open',   count: openCount  },
    { id: 'mine',   label: 'Mine',   count: mineCount  },
  ]

  return (
    <div className="flex gap-5 h-full min-h-0" style={{ height: 'calc(100vh - 112px)' }}>

      {/* ── Left panel: list ───────────────────────────────────────────── */}
      <div className="w-80 flex-shrink-0 flex flex-col gap-3 min-h-0">

        {/* Page header */}
        <div className="flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Tickets</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {loading ? 'Loading…' : `${total.toLocaleString()} total`}
            </p>
          </div>
          {canCreate && (
            <button
              onClick={openTicketCreate}
              disabled={!isTenantActive}
              className="
                inline-flex items-center gap-1.5 px-3 h-8 rounded-lg
                bg-brand-600 text-white text-xs font-medium
                hover:bg-brand-800 transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              New ticket
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative flex-shrink-0">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            placeholder="Search tickets…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="
              w-full h-9 pl-8 pr-3 rounded-lg border border-gray-200
              text-sm text-gray-900 placeholder:text-gray-400
              focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent
              transition-shadow
            "
          />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1.5 flex-shrink-0 flex-wrap">
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`
                inline-flex items-center gap-1.5 px-3 h-7 rounded-full
                text-xs font-medium transition-all
                ${activeFilter === f.id
                  ? 'bg-brand-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }
              `}
            >
              {f.label}
              {f.count != null && f.count > 0 && (
                <span className={`
                  inline-flex items-center justify-center w-4 h-4
                  rounded-full text-[10px] font-semibold
                  ${activeFilter === f.id
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-100 text-gray-500'
                  }
                  ${f.id === 'urgent' && urgentCount > 0
                    ? 'bg-red-100 text-red-700'
                    : ''
                  }
                `}>
                  {f.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-gray-400">Sort by</span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as SortBy)}
            className="
              h-7 px-2 text-xs rounded-lg border border-gray-200
              text-gray-700 bg-white
              focus:outline-none focus:ring-1 focus:ring-brand-400
            "
          >
            <option value="urgency">AI urgency</option>
            <option value="priority">Priority</option>
            <option value="created">Newest first</option>
          </select>
        </div>

        {/* Ticket list — scrollable */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
          {loading && (
            <div className="flex items-center justify-center py-12 gap-2">
              <Spinner />
              <span className="text-sm text-gray-400">Loading tickets…</span>
            </div>
          )}

          {error && !loading && (
            <div className="flex flex-col items-center py-12 gap-2">
              <p className="text-sm text-gray-500">{error}</p>
              <button
                onClick={() => void refetch()}
                className="text-xs text-brand-600 font-medium hover:underline"
              >
                Try again
              </button>
            </div>
          )}

          {!loading && !error && sorted.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-gray-400">
                {search ? 'No tickets match your search.' : 'No tickets found.'}
              </p>
            </div>
          )}

          {!loading && !error && sorted.map(ticket => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              isSelected={selected?.id === ticket.id}
              onSelect={setSelected}
            />
          ))}
        </div>
      </div>

      {/* ── Right panel: detail view ───────────────────────────────────── */}
      <div className="flex-1 min-w-0 bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col">
        {selected ? (
          <TicketDetailView
            key={selected.id}
            ticket={selected}
            onStatusUpdated={handleStatusUpdated}
            onEdit={openTicketEdit}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-12 h-12 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-700 mb-1">
              Select a ticket to view details
            </p>
            <p className="text-xs text-gray-400">
              Click any ticket in the list to see its description and update its status
            </p>
            {urgentCount > 0 && (
              <button
                onClick={() => setFilter('urgent')}
                className="
                  mt-4 inline-flex items-center gap-1.5 px-3 h-8 rounded-full
                  bg-red-50 text-red-700 text-xs font-medium border border-red-100
                  hover:bg-red-100 transition-colors
                "
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                {urgentCount} urgent ticket{urgentCount !== 1 ? 's' : ''} need attention
              </button>
            )}
          </div>
        )}
      </div>

      <Modal
        open={ticketModalOpen}
        onClose={() => setTicketModalOpen(false)}
        title={ticketEditTarget ? 'Edit ticket' : 'New ticket'}
        size="lg"
        footer={
          <>
            {ticketSubmitError && (
              <p className="text-xs text-red-600 mr-auto">{ticketSubmitError}</p>
            )}
            <button
              type="button"
              onClick={() => setTicketModalOpen(false)}
              disabled={ticketSubmitting}
              className="px-4 h-9 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form={TICKET_FORM_ID}
              disabled={ticketSubmitting}
              className="px-4 h-9 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-800 disabled:opacity-60 transition-colors flex items-center gap-2"
            >
              {ticketSubmitting && (
                <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              )}
              {ticketEditTarget ? 'Save changes' : 'Create ticket'}
            </button>
          </>
        }
      >
        <TicketForm ticket={ticketEditTarget ?? undefined} onSubmit={handleTicketSubmit} onCancel={() => setTicketModalOpen(false)} submitting={ticketSubmitting} />
      </Modal>
    </div>
  )
}