// src/pages/customers/CustomersPage.tsx
import { useState, useCallback } from 'react'
import { useCustomers } from '@/hooks/useCusomters'
import { customerService } from '@/services/customerService'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Spinner from '@/components/ui/Spinner'
import CustomerRow from './CustomerRow'
import CustomerForm, { CUSTOMER_FORM_ID } from './CustomerForm'
import type { CustomerResponse, CreateCustomerRequest } from '@/types/customer.types'
import { useAuthStore } from '@/store/authStore'


const PAGE_SIZE = 20

export default function CustomersPage() {
  const { role, tenantStatus } = useAuthStore()
  const isReadOnly = role === 'ReadOnly'
  const isTenantActive = tenantStatus === 'Active' || tenantStatus === 'Trialing' || role === 'SuperAdmin'
  const [page, setPage] = useState(1)
  const { data, loading, error, refetch } = useCustomers(page, PAGE_SIZE)

  // Modal state
  const [modalOpen,   setModalOpen]   = useState(false)
  const [editTarget,  setEditTarget]  = useState<CustomerResponse | null>(null)
  const [submitting,  setSubmitting]  = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Delete state
  const [deleteTarget,  setDeleteTarget]  = useState<CustomerResponse | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Search — client-side filter on loaded page
  const [search, setSearch] = useState('')

  const openCreate = () => {
    setEditTarget(null)
    setSubmitError(null)
    setModalOpen(true)
  }

  const openEdit = (customer: CustomerResponse) => {
    setEditTarget(customer)
    setSubmitError(null)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditTarget(null)
    setSubmitError(null)
  }

  const handleSubmit = useCallback(async (values: CreateCustomerRequest) => {
    setSubmitting(true)
    setSubmitError(null)
    try {
      if (editTarget) {
        await customerService.update(editTarget.id, values)
      } else {
        await customerService.create(values)
      }
      closeModal()
      void refetch()
    } catch {
      setSubmitError('Failed to save customer. Please check your input and try again.')
    } finally {
      setSubmitting(false)
    }
  }, [editTarget, refetch])

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await customerService.delete(deleteTarget.id)
      setDeleteTarget(null)
      void refetch()
    } catch {
      // Keep dialog open — show nothing extra here,
      // the error would surface in a toast in a future phase
    } finally {
      setDeleteLoading(false)
    }
  }

  // Client-side search filter applied to the current page
  const filtered = (data?.items ?? []).filter(c =>
    !search ||
    c.companyName.toLowerCase().includes(search.toLowerCase()) ||
    (c.industry?.toLowerCase().includes(search.toLowerCase()) ?? false)
  )

  return (
    <>
      <div className="space-y-5">

        {/* Page header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Customers</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {data ? `${data.totalCount.toLocaleString()} total accounts` : 'Loading…'}
            </p>
          </div>
          {!isReadOnly && (
            <button
              onClick={openCreate}
              disabled={!isTenantActive}
              className="
                inline-flex items-center gap-2 px-4 h-9 rounded-lg
                bg-brand-600 text-white text-sm font-medium
                hover:bg-brand-800 active:scale-[0.98] transition-all
                disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100
              "
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add customer
            </button>
          )}
        </div>

        {/* Search + filter bar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              placeholder="Search company or industry…"
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
        </div>

        {/* Table card */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">

          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center py-24">
              <div className="flex flex-col items-center gap-3">
                <Spinner size="lg" />
                <p className="text-sm text-gray-400">Loading customers…</p>
              </div>
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm text-gray-600">{error}</p>
              <button
                onClick={() => void refetch()}
                className="text-sm text-brand-600 font-medium hover:underline"
              >
                Try again
              </button>
            </div>
          )}

          {/* Table */}
          {!loading && !error && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['Company', 'Industry', 'Country', 'Revenue', 'Employees', 'Created', ''].map(h => (
                      <th
                        key={h}
                        className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-20 text-center">
                        <p className="text-sm text-gray-500">
                          {search ? 'No customers match your search.' : 'No customers yet.'}
                        </p>
                        {!search && (
                          <button
                            onClick={openCreate}
                            className="text-sm text-brand-600 font-medium hover:underline mt-2 block mx-auto"
                          >
                            Add your first customer
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filtered.map(customer => (
                      <CustomerRow
                        key={customer.id}
                        customer={customer}
                        onEdit={openEdit}
                        onDelete={setDeleteTarget}
                      />
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
                {data.totalCount.toLocaleString()} customers
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={!data.hasPrevPage}
                  className="
                    w-7 h-7 rounded-md border border-gray-200 flex items-center justify-center
                    text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed
                    transition-colors
                  "
                  aria-label="Previous page"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-xs text-gray-500 px-2">
                  {page} / {data.totalPages}
                </span>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={!data.hasNextPage}
                  className="
                    w-7 h-7 rounded-md border border-gray-200 flex items-center justify-center
                    text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed
                    transition-colors
                  "
                  aria-label="Next page"
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

      {/* ── Create / Edit modal ─────────────────────────────────────────── */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editTarget ? `Edit ${editTarget.companyName}` : 'Add customer'}
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
              className="
                px-4 h-9 rounded-lg border border-gray-200
                text-sm font-medium text-gray-700
                hover:bg-gray-50 disabled:opacity-50 transition-colors
              "
            >
              Cancel
            </button>
            {/* Submit via form ID so the button sits outside the form in the footer */}
            <button
              type="submit"
              form={CUSTOMER_FORM_ID}
              disabled={submitting}
              className="
                px-4 h-9 rounded-lg bg-brand-600 text-white
                text-sm font-medium hover:bg-brand-800
                disabled:opacity-60 transition-colors
                flex items-center gap-2
              "
            >
              {submitting && (
                <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              )}
              {editTarget ? 'Save changes' : 'Create customer'}
            </button>
          </>
        }
      >
        <CustomerForm
          customer={editTarget}
          onSubmit={handleSubmit}
          onCancel={closeModal}
          submitting={submitting}
        />
      </Modal>

      {/* ── Delete confirmation ─────────────────────────────────────────── */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleDeleteConfirm()}
        title="Delete customer"
        description={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.companyName}"? This action cannot be undone. All associated contacts and opportunities will also be removed.`
            : ''
        }
        loading={deleteLoading}
      />
    </>
  )
}