// src/pages/leads/LeadsPage.tsx
import { useState, useCallback } from 'react'
import { useLeads } from '@/hooks/useLeads'
import { useAuthStore } from '@/store/authStore'
import Spinner from '@/components/ui/Spinner'
import Modal from '@/components/ui/Modal'
import LeadScoreBadge from './LeadScoreBadge'
import LeadStatusBadge from './LeadStatusBadge'
import LeadForm, { LEAD_FORM_ID } from './LeadForm'
import { leadService } from '@/services/leadService'
import type { LeadResponse, CreateLeadRequest } from '@/types/lead.types'

const PAGE_SIZE = 20

function formatValue(value: number | null): string {
  if (value == null) return '—'
  return new Intl.NumberFormat('en-PH', {
    style:    'currency',
    currency: 'PHP',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

export default function LeadsPage() {
  const { role, tenantStatus } = useAuthStore()
  const isTenantActive = tenantStatus === 'Active' || tenantStatus === 'Trialing' || role === 'SuperAdmin'
  const canCreate = (role === 'TenantAdmin' || role === 'SalesManager' || role === 'SalesRep' || role === 'SuperAdmin') && isTenantActive

  const [page,   setPage]   = useState(1)
  const [search, setSearch] = useState('')
  const { data, loading, error, refetch } = useLeads(page, PAGE_SIZE)

  const [modalOpen,   setModalOpen]   = useState(false)
  const [editTarget,  setEditTarget]  = useState<LeadResponse | null>(null)
  const [submitting,  setSubmitting]  = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const filtered = (data?.items ?? []).filter(l => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      l.firstName.toLowerCase().includes(q)  ||
      l.lastName.toLowerCase().includes(q)   ||
      (l.companyName?.toLowerCase().includes(q) ?? false) ||
      (l.email?.toLowerCase().includes(q)       ?? false)
    )
  })

  // Sort: highest AI score first
  const sorted = [...filtered].sort((a, b) =>
    (b.aiConversionScore ?? -1) - (a.aiConversionScore ?? -1)
  )

  const openCreate = () => {
    setEditTarget(null)
    setSubmitError(null)
    setModalOpen(true)
  }

  const openEdit = (lead: LeadResponse) => {
    setEditTarget(lead)
    setSubmitError(null)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditTarget(null)
    setSubmitError(null)
  }

  const handleSubmit = useCallback(async (values: CreateLeadRequest) => {
    setSubmitting(true)
    setSubmitError(null)
    try {
      if (editTarget) {
        await leadService.update(editTarget.id, {
          ...values,
          status: editTarget.status,
        })
      } else {
        await leadService.create(values)
      }
      closeModal()
      void refetch()
    } catch {
      setSubmitError('Failed to save lead. Please check your input and try again.')
    } finally {
      setSubmitting(false)
    }
  }, [editTarget, refetch])

  return (
    <>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Leads</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {data
                ? `${data.totalCount.toLocaleString()} leads · sorted by AI conversion score`
                : 'Loading…'}
            </p>
          </div>
          {canCreate && (
            <button
              onClick={openCreate}
              className="
                inline-flex items-center gap-2 px-4 h-9 rounded-lg
                bg-brand-600 text-white text-sm font-medium
                hover:bg-brand-800 active:scale-[0.98] transition-all
              "
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add lead
            </button>
          )}
        </div>

        {/* AI score legend */}
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="font-medium">AI score:</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            High (≥80)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Mid (50–79)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            Low (&lt;50)
          </span>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            placeholder="Search leads…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="
              w-full h-9 pl-9 pr-3 rounded-lg border border-gray-200
              text-sm text-gray-900 placeholder:text-gray-400
              focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent
              transition-shadow
            "
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading && (
            <div className="flex items-center justify-center py-24 gap-3">
              <Spinner size="lg" />
              <p className="text-sm text-gray-400">Loading leads…</p>
            </div>
          )}

          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <p className="text-sm text-gray-600">{error}</p>
              <button
                onClick={() => void refetch()}
                className="text-sm text-brand-600 font-medium hover:underline"
              >
                Try again
              </button>
            </div>
          )}

          {!loading && !error && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {[
                      'Name', 'Company', 'Source', 'Status',
                      'AI score', 'Est. value', 'Created', 'Actions',
                    ].map(h => (
                      <th
                        key={h}
                        className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                      >
                        {h === 'AI score' ? (
                          <span className="flex items-center gap-1">
                            {h}
                            <span className="text-brand-400">↓</span>
                          </span>
                        ) : h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sorted.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-20 text-center">
                        <p className="text-sm text-gray-500">
                          {search ? 'No leads match your search.' : 'No leads yet.'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    sorted.map(lead => (
                      <LeadRow key={lead.id} lead={lead} onEdit={openEdit} />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {data && data.totalPages > 1 && !loading && !error && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, data.totalCount)} of{' '}
                {data.totalCount.toLocaleString()} leads
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={!data.hasPrevPage}
                  className="w-7 h-7 rounded-md border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-xs text-gray-500 px-2">{page} / {data.totalPages}</span>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={!data.hasNextPage}
                  className="w-7 h-7 rounded-md border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editTarget ? 'Edit lead' : 'Add lead'}
        size="lg"
        footer={
          <>
            {submitError && (
              <p className="text-xs text-red-600 mr-auto">{submitError}</p>
            )}
            <button
              type="button"
              onClick={closeModal}
              disabled={submitting}
              className="px-4 h-9 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form={LEAD_FORM_ID}
              disabled={submitting}
              className="px-4 h-9 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-800 disabled:opacity-60 transition-colors flex items-center gap-2"
            >
              {submitting && (
                <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              )}
              {editTarget ? 'Save changes' : 'Create lead'}
            </button>
          </>
        }
      >
        <LeadForm
          lead={editTarget ?? undefined}
          onSubmit={handleSubmit}
          onCancel={closeModal}
          submitting={submitting}
        />
      </Modal>
    </>
  )
}

// ── Row component ─────────────────────────────────────────────────────────────
function LeadRow({ lead, onEdit }: { lead: LeadResponse, onEdit: (l: LeadResponse) => void }) {
  const { role, tenantStatus } = useAuthStore()
  const isTenantActive = tenantStatus === 'Active' || tenantStatus === 'Trialing' || role === 'SuperAdmin'
  const canEdit = (role === 'TenantAdmin' || role === 'SalesManager' || role === 'SalesRep' || role === 'SuperAdmin') && isTenantActive
  const canDelete = (role === 'TenantAdmin' || role === 'SuperAdmin') && isTenantActive

  return (
    <tr className={`group hover:bg-gray-50 transition-colors ${!isTenantActive ? 'opacity-75' : ''}`}>
      <td className="px-4 py-3">
        <p className="text-sm font-medium text-gray-900">
          {lead.firstName} {lead.lastName}
        </p>
        {lead.jobTitle && (
          <p className="text-xs text-gray-400">{lead.jobTitle}</p>
        )}
      </td>
      <td className="px-4 py-3">
        <p className="text-sm text-gray-700">{lead.companyName ?? '—'}</p>
        {lead.email && (
          <p className="text-xs text-gray-400">{lead.email}</p>
        )}
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-gray-600">{lead.source ?? '—'}</span>
      </td>
      <td className="px-4 py-3">
        <LeadStatusBadge status={lead.status} />
      </td>
      <td className="px-4 py-3">
        <LeadScoreBadge score={lead.aiConversionScore} />
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-gray-700 tabular-nums">
          {formatValue(lead.estimatedValue)}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className="text-xs text-gray-400 whitespace-nowrap">
          {new Date(lead.createdAt).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
          })}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-1">
          {canEdit && (
            <button
              onClick={() => onEdit(lead)}
              className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-md transition-colors"
              title="Edit lead"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
          {canDelete && (
            <button
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
              title="Delete lead"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
          {!canEdit && !canDelete && <span className="text-xs text-gray-300 italic">No actions</span>}
        </div>
      </td>
    </tr>
  )
}