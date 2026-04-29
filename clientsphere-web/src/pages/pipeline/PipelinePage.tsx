// src/pages/pipeline/PipelinePage.tsx
// Add these additions to the existing PipelinePage from Phase 3
// Only the changed/added parts are shown — merge with existing file

import { useState, useCallback }     from 'react'
import { useOpportunities }          from '@/hooks/useOpportunities'
import { opportunityService }        from '@/services/opportunityService'
import { invoiceService }            from '@/services/invoiceService'
import { useAuthStore }              from '@/store/authStore'
import KanbanBoard                   from './KanbanBoard'
import GenerateInvoiceModal          from './GenerateInvoiceModal'
import Modal                         from '@/components/ui/Modal'
import OpportunityForm, { OPPORTUNITY_FORM_ID } from './OpportunityForm'
import Spinner                       from '@/components/ui/Spinner'
import type { OpportunityStage, OpportunityResponse, CreateOpportunityRequest } from '@/types/opportunity.types'
import type { GenerateInvoiceFromOpportunityRequest } from '@/types/invoice.types'

export default function PipelinePage() {
  const { role, tenantStatus } = useAuthStore()
  const isTenantActive = tenantStatus === 'Active' || tenantStatus === 'Trialing' || role === 'SuperAdmin'
  const canCreate = (role === 'SalesManager' || role === 'SalesRep' || role === 'SuperAdmin') && isTenantActive

  const {
    items, loading, error, refetch, updateStageLocally,
  } = useOpportunities()

  // ── Generate invoice state ────────────────────────────────────────────────
  const [invoiceTarget,     setInvoiceTarget]     = useState<OpportunityResponse | null>(null)
  const [invoiceModalOpen,  setInvoiceModalOpen]  = useState(false)
  const [invoiceSuccess,    setInvoiceSuccess]    = useState<string | null>(null)

  // ── Create opportunity state ────────────────────────────────────────────────
  const [oppModalOpen,   setOppModalOpen]   = useState(false)
  const [oppEditTarget,  setOppEditTarget]  = useState<OpportunityResponse | null>(null)
  const [oppSubmitting,  setOppSubmitting]  = useState(false)
  const [oppSubmitError, setOppSubmitError] = useState<string | null>(null)

  const openGenerateModal = useCallback((opportunity: OpportunityResponse) => {
    setInvoiceTarget(opportunity)
    setInvoiceModalOpen(true)
    setInvoiceSuccess(null)
  }, [])

  const handleGenerateInvoice = useCallback(async (
    opportunityId: string,
    request:       GenerateInvoiceFromOpportunityRequest,
  ) => {
    const invoice = await invoiceService.generateFromOpportunity(opportunityId, request)
    setInvoiceSuccess(`Invoice ${invoice.invoiceNumber} created successfully.`)
    setTimeout(() => setInvoiceSuccess(null), 5000)
  }, [])

  const handleStageChange = useCallback(
    async (id: string, stage: OpportunityStage) => {
      await opportunityService.updateStage(id, { stage })
    },
    [],
  )

  const openOppCreate = useCallback(() => {
    setOppEditTarget(null)
    setOppSubmitError(null)
    setOppModalOpen(true)
  }, [])

  const handleOppSubmit = useCallback(async (values: CreateOpportunityRequest) => {
    setOppSubmitting(true)
    setOppSubmitError(null)
    try {
      if (oppEditTarget) {
        await opportunityService.update(oppEditTarget.id, values)
      } else {
        await opportunityService.create(values)
      }
      setOppModalOpen(false)
      void refetch()
    } catch {
      setOppSubmitError('Failed to save opportunity. Please check your input and try again.')
    } finally {
      setOppSubmitting(false)
    }
  }, [oppEditTarget, refetch])

  // Summary stats
  const openValue = items
    .filter(o => o.stage !== 'ClosedWon' && o.stage !== 'ClosedLost')
    .reduce((sum, o) => sum + (o.estimatedValue ?? 0), 0)

  const wonValue = items
    .filter(o => o.stage === 'ClosedWon')
    .reduce((sum, o) => sum + (o.estimatedValue ?? 0), 0)

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('en-PH', {
      style: 'currency', currency: 'PHP',
      notation: 'compact', maximumFractionDigits: 1,
    }).format(v)

  return (
    <>
      <div className="space-y-5">

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Pipeline</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {loading ? 'Loading…' : `${items.length} opportunities`}
            </p>
          </div>
          {canCreate && (
            <button
              onClick={openOppCreate}
              disabled={!isTenantActive}
              className="
                inline-flex items-center gap-2 px-4 h-9 rounded-lg
                bg-brand-600 text-white text-sm font-medium
                hover:bg-brand-800 active:scale-[0.98] transition-all
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add opportunity
            </button>
          )}
        </div>

        {/* Invoice success toast */}
        {invoiceSuccess && (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-green-50 border border-green-200">
            <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-sm text-green-800 font-medium">{invoiceSuccess}</p>
            <button
              onClick={() => setInvoiceSuccess(null)}
              className="ml-auto text-green-600 hover:text-green-800"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Open pipeline</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1 tabular-nums">{formatCurrency(openValue)}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-xs font-medium text-green-700 uppercase tracking-wide">Won this period</p>
              <p className="text-2xl font-semibold text-green-900 mt-1 tabular-nums">{formatCurrency(wonValue)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total opportunities</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1 tabular-nums">{items.length}</p>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-24 gap-3">
            <Spinner size="lg" />
            <p className="text-sm text-gray-400">Loading pipeline…</p>
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center py-24 gap-3">
            <p className="text-sm text-gray-600">{error}</p>
            <button onClick={() => void refetch()} className="text-sm text-brand-600 hover:underline">Try again</button>
          </div>
        )}

        {!loading && !error && (
          <KanbanBoard
            opportunities={items}
            onStageChange={handleStageChange}
            onUpdateLocally={updateStageLocally}
            onGenerateInvoice={openGenerateModal}
          />
        )}

        {!loading && !error && items.length > 0 && (
          <p className="text-xs text-gray-400 text-center">
            Drag cards between columns to update stage · Use "Generate invoice" on Won cards to create an invoice
          </p>
        )}
      </div>

      <GenerateInvoiceModal
        open={invoiceModalOpen}
        opportunity={invoiceTarget}
        onClose={() => setInvoiceModalOpen(false)}
        onGenerate={handleGenerateInvoice}
      />

      <Modal
        open={oppModalOpen}
        onClose={() => setOppModalOpen(false)}
        title={oppEditTarget ? 'Edit opportunity' : 'Add opportunity'}
        size="lg"
        footer={
          <>
            {oppSubmitError && (
              <p className="text-xs text-red-600 mr-auto">{oppSubmitError}</p>
            )}
            <button
              type="button"
              onClick={() => setOppModalOpen(false)}
              disabled={oppSubmitting}
              className="px-4 h-9 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form={OPPORTUNITY_FORM_ID}
              disabled={oppSubmitting}
              className="px-4 h-9 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-800 disabled:opacity-60 transition-colors flex items-center gap-2"
            >
              {oppSubmitting && (
                <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              )}
              {oppEditTarget ? 'Save changes' : 'Create opportunity'}
            </button>
          </>
        }
      >
        <OpportunityForm opportunity={oppEditTarget ?? undefined} onSubmit={handleOppSubmit} onCancel={() => setOppModalOpen(false)} submitting={oppSubmitting} />
      </Modal>
    </>
  )
}