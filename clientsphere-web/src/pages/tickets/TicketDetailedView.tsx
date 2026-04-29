// src/pages/tickets/TicketDetailView.tsx
import { useState, useEffect } from 'react'
import { useAuthStore }       from '@/store/authStore'
import type { TicketResponse, TicketStatus } from '@/types/ticket.types'
import { STATUS_TRANSITIONS } from '@/types/ticket.types'
import { ticketService }      from '@/services/ticketService'
import SentimentBadge         from './SentimentBadge'
import PriorityBadge          from './PriorityBadge'
import TicketStatusBadge      from './TicketStatusBadge'
import Spinner                from '@/components/ui/Spinner'

interface TicketDetailViewProps {
  ticket:            TicketResponse
  onStatusUpdated:   (id: string, status: TicketStatus) => void
  onEdit:            (ticket: TicketResponse) => void
}

const STATUS_DISPLAY_LABELS: Record<TicketStatus, string> = {
  Open:       'Open',
  Pending:    'Pending',
  InProgress: 'In progress',
  Resolved:   'Resolved',
  Closed:     'Closed',
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
        {label}
      </p>
      <div>{children}</div>
    </div>
  )
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

export default function TicketDetailView({
  ticket,
  onStatusUpdated,
  onEdit,
}: TicketDetailViewProps) {
  const { role, tenantStatus } = useAuthStore()
  const isTenantActive = tenantStatus === 'Active' || tenantStatus === 'Trialing' || role === 'SuperAdmin'
  const canEdit = (role === 'TenantAdmin' || role === 'SupportAgent' || role === 'SuperAdmin') && isTenantActive
  const canUpdate = (role === 'TenantAdmin' || role === 'SupportAgent' || role === 'SuperAdmin') && isTenantActive
  const canDelete = (role === 'TenantAdmin' || role === 'SuperAdmin') && isTenantActive

  const [selectedStatus, setSelectedStatus] = useState<TicketStatus>(ticket.status)
  const [updating,       setUpdating]       = useState(false)
  const [updateError,    setUpdateError]    = useState<string | null>(null)
  const [justUpdated,    setJustUpdated]    = useState(false)

  // Reset local state when a different ticket is selected
  useEffect(() => {
    setSelectedStatus(ticket.status)
    setUpdateError(null)
    setJustUpdated(false)
  }, [ticket.id, ticket.status])

  const availableTransitions = STATUS_TRANSITIONS[ticket.status]
  const hasStatusChanged      = selectedStatus !== ticket.status

  const handleUpdateStatus = async () => {
    if (!hasStatusChanged) return
    setUpdating(true)
    setUpdateError(null)
    try {
      await ticketService.updateStatus(ticket.id, { status: selectedStatus })
      onStatusUpdated(ticket.id, selectedStatus)
      setJustUpdated(true)
      setTimeout(() => setJustUpdated(false), 2000)
    } catch {
      setUpdateError('Failed to update status. Please try again.')
      setSelectedStatus(ticket.status) // rollback select
    } finally {
      setUpdating(false)
    }
  }

  // Sentiment confidence bar — absolute value, always 0–1
  const confidenceAbs = ticket.aiSentimentScore != null
    ? Math.abs(ticket.aiSentimentScore)
    : null

  const sentimentBarColor: Record<string, string> = {
    Urgent:   'bg-red-500',
    Negative: 'bg-amber-500',
    Neutral:  'bg-gray-400',
    Positive: 'bg-green-500',
  }

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-gray-400">
                {ticket.ticketNumber}
              </span>
              <PriorityBadge priority={ticket.priority} />
              <TicketStatusBadge status={ticket.status} />
            </div>
            <h2 className="text-base font-semibold text-gray-900 leading-snug">
              {ticket.subject}
            </h2>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {canEdit && (
              <button
                onClick={() => onEdit(ticket)}
                className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                title="Edit ticket"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
            {canDelete && (
              <button
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete ticket"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
            {ticket.aiSentimentLabel && (
              <SentimentBadge
                label={ticket.aiSentimentLabel}
                score={ticket.aiSentimentScore}
                size="md"
              />
            )}
          </div>
        </div>
      </div>

      {/* Body — scrollable */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

        {/* AI sentiment panel */}
        {ticket.aiSentimentLabel && (
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              AI sentiment analysis
            </p>
            <div className="flex items-center gap-3">
              <SentimentBadge
                label={ticket.aiSentimentLabel}
                score={ticket.aiSentimentScore}
                size="md"
              />
              {confidenceAbs != null && (
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-gray-500">Confidence</span>
                    <span className="text-xs font-semibold text-gray-700 tabular-nums">
                      {(confidenceAbs * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`
                        h-full rounded-full transition-all duration-500
                        ${sentimentBarColor[ticket.aiSentimentLabel] ?? 'bg-gray-400'}
                      `}
                      style={{ width: `${(confidenceAbs * 100).toFixed(0)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
            {ticket.aiSentimentLabel === 'Urgent' && (
              <div className="mt-3 flex items-start gap-2 p-2.5 rounded-lg bg-red-50 border border-red-100">
                <svg className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-xs text-red-700 font-medium">
                  AI flagged this ticket as urgent. Consider prioritising immediate response.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Description */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Description
          </p>
          {ticket.description ? (
            <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
              {ticket.description}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">No description provided.</p>
          )}
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          <DetailRow label="Priority">
            <PriorityBadge priority={ticket.priority} />
          </DetailRow>

          <DetailRow label="Current status">
            <TicketStatusBadge status={ticket.status} />
          </DetailRow>

          <DetailRow label="Due date">
            <p className="text-sm text-gray-700">
              {ticket.dueAt
                ? formatDateTime(ticket.dueAt)
                : <span className="text-gray-400">No due date</span>
              }
            </p>
          </DetailRow>

          <DetailRow label="First response">
            <p className="text-sm text-gray-700">
              {ticket.firstResponseAt
                ? formatDateTime(ticket.firstResponseAt)
                : <span className="text-gray-400">Not yet</span>
              }
            </p>
          </DetailRow>

          <DetailRow label="Created">
            <p className="text-sm text-gray-700">
              {formatDateTime(ticket.createdAt)}
            </p>
          </DetailRow>

          <DetailRow label="Resolved">
            <p className="text-sm text-gray-700">
              {ticket.resolvedAt
                ? formatDateTime(ticket.resolvedAt)
                : <span className="text-gray-400">Not yet</span>
              }
            </p>
          </DetailRow>
        </div>

        {/* Tags */}
        {ticket.tags && ticket.tags.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Tags
            </p>
            <div className="flex flex-wrap gap-1.5">
              {ticket.tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Footer — status update */}
      <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100">
        {!canUpdate ? (
          <p className="text-xs text-gray-400 italic text-center">
            You do not have permission to update ticket status.
          </p>
        ) : (
          <>
            {updateError && (
              <p className="text-xs text-red-600 mb-2">{updateError}</p>
            )}

            {justUpdated && (
              <p className="text-xs text-green-600 mb-2 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Status updated successfully
              </p>
            )}

            <div className="flex items-center gap-3">
              {/* Status selector — only shows valid transitions */}
              <div className="flex-1">
                <label htmlFor="status-select" className="block text-xs text-gray-500 mb-1">
                  Update status
                </label>
                <select
                  id="status-select"
                  value={selectedStatus}
                  onChange={e => setSelectedStatus(e.target.value as TicketStatus)}
                  disabled={updating || !isTenantActive}
                  className="
                    w-full h-9 px-3 rounded-lg border border-gray-200
                    text-sm text-gray-900 bg-white
                    focus:outline-none focus:ring-2 focus:ring-brand-400
                    disabled:opacity-50 transition-shadow
                  "
                >
                  {/* Current status always present */}
                  <option value={ticket.status}>
                    {STATUS_DISPLAY_LABELS[ticket.status]} (current)
                  </option>
                  {/* Valid next transitions */}
                  {availableTransitions.map(s => (
                    <option key={s} value={s}>
                      {STATUS_DISPLAY_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => void handleUpdateStatus()}
                disabled={updating || !hasStatusChanged || !isTenantActive}
                className="
                  mt-4 px-4 h-9 rounded-lg text-sm font-medium
                  bg-brand-600 text-white
                  hover:bg-brand-800 active:scale-[0.98]
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all flex items-center gap-2 flex-shrink-0
                "
              >
                {updating ? (
                  <>
                    <Spinner size="sm" />
                    Updating…
                  </>
                ) : (
                  'Update status'
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}