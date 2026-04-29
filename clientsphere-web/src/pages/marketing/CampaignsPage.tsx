
import { useState, useCallback } from 'react'
import { useCampaigns }          from '@/hooks/useCampaigns'
import { campaignService }       from '@/services/campaignService'
import { useAuthStore }          from '@/store/authStore'
import CampaignStatusBadge       from './CampaignStatusBadge'
import CampaignForm, { CAMPAIGN_FORM_ID } from './CampaignForm'
import Spinner                   from '@/components/ui/Spinner'
import type { CampaignResponse, CreateCampaignRequest } from '@/types/campaign.types'

function formatCurrency(v: number | null): string {
  if (v == null) return '—'
  return new Intl.NumberFormat('en-PH', {
    style: 'currency', currency: 'PHP',
    notation: 'compact', maximumFractionDigits: 1,
  }).format(v)
}

function formatDate(d: string | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function CampaignInitials({ name }: { name: string }) {
  const initials = typeof name === 'string'
    ? name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
    : 'C'
  const colors = [
    'bg-brand-50 text-brand-600',
    'bg-green-50 text-green-700',
    'bg-blue-50 text-blue-700',
    'bg-amber-50 text-amber-700',
    'bg-purple-50 text-purple-700',
  ]
  const idx = typeof name === 'string' && name.length > 0 ? name.charCodeAt(0) % colors.length : 0
  return (
    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-semibold ${colors[idx]}`}>
      {initials}
    </div>
  )
}

export default function CampaignsPage() {
  const { role, tenantStatus } = useAuthStore()
  const isTenantActive = tenantStatus === 'Active' || tenantStatus === 'Trialing' || role === 'SuperAdmin'
  const canCreate = (role === 'MarketingManager' || role === 'SuperAdmin') && isTenantActive

  const { items, total, loading, error, refetch } = useCampaigns(1, 50)

  const [submitting,  setSubmitting]  = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitOk,    setSubmitOk]    = useState(false)
  const [sending,     setSending]     = useState<string | null>(null)

  const handleCreate = useCallback(async (request: CreateCampaignRequest) => {
    setSubmitting(true)
    setSubmitError(null)
    try {
      await campaignService.create(request)
      setSubmitOk(true)
      setTimeout(() => setSubmitOk(false), 3000)
      void refetch()
    } catch {
      setSubmitError('Failed to create campaign. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }, [refetch])

  const handleSend = async (id: string) => {
    setSending(id)
    try {
      await campaignService.send(id)
      void refetch()
    } catch {
      // Surface error in a future toast system
    } finally {
      setSending(null)
    }
  }

  // Stats summary
  const activeCount    = items.filter(c => c.status === 'Active').length
  const totalBudget    = items.reduce((s, c) => s + (c.budget ?? 0), 0)
  const totalSpend     = items.reduce((s, c) => s + c.actualSpend, 0)
  const totalConv      = items.reduce((s, c) => s + c.conversions, 0)

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Marketing campaigns</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading ? 'Loading…' : `${total} campaigns · ${activeCount} active`}
          </p>
        </div>
      </div>

      {/* Summary stats */}
      {!loading && !error && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total budget</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1 tabular-nums">
              {formatCurrency(totalBudget)}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Actual spend</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1 tabular-nums">
              {formatCurrency(totalSpend)}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total conversions</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1 tabular-nums">
              {totalConv.toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Two-column layout */}
      <div className={`grid grid-cols-1 ${canCreate ? 'lg:grid-cols-[1fr_360px]' : ''} gap-5 items-start`}>

        {/* Campaign list */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">

          {loading && (
            <div className="flex items-center justify-center py-20 gap-3">
              <Spinner size="lg" />
              <p className="text-sm text-gray-400">Loading campaigns…</p>
            </div>
          )}

          {error && !loading && (
            <div className="flex flex-col items-center py-20 gap-3">
              <p className="text-sm text-gray-500">{error}</p>
              <button onClick={() => void refetch()} className="text-sm text-brand-600 hover:underline">
                Try again
              </button>
            </div>
          )}

          {!loading && !error && items.length === 0 && (
            <div className="flex items-center justify-center py-20">
              <p className="text-sm text-gray-400">No campaigns yet. {canCreate && 'Create your first one →'}</p>
            </div>
          )}

          {!loading && !error && items.length > 0 && (
            <div className="divide-y divide-gray-50">
              {items.map(campaign => (
                <CampaignRow
                  key={campaign.id}
                  campaign={campaign}
                  onSend={handleSend}
                  isSending={sending === campaign.id}
                />
              ))}
            </div>
          )}
        </div>

        {/* Create form panel */}
        {canCreate && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">New campaign</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Fill in the details and create a draft
              </p>
            </div>
            <div className="p-5">
              <CampaignForm
                onSubmit={handleCreate}
                submitting={submitting}
              />

              {submitError && (
                <p className="text-xs text-red-600 mt-3">{submitError}</p>
              )}
              {submitOk && (
                <p className="text-xs text-green-600 mt-3 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Campaign created successfully
                </p>
              )}

              <button
                type="submit"
                form={CAMPAIGN_FORM_ID}
                disabled={submitting || !isTenantActive}
                className="
                  w-full mt-5 px-4 h-10 rounded-lg
                  bg-brand-600 text-white text-sm font-medium
                  hover:bg-brand-800 active:scale-[0.98]
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all flex items-center justify-center gap-2
                "
              >
                {submitting ? (
                  <>
                    <Spinner size="sm" />
                    Creating…
                  </>
                ) : (
                  'Create campaign'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Campaign row ──────────────────────────────────────────────────────────────
interface CampaignRowProps {
  campaign:  CampaignResponse
  onSend:    (id: string) => Promise<void>
  isSending: boolean
}

function CampaignRow({ campaign, onSend, isSending }: CampaignRowProps) {
  const { role, tenantStatus } = useAuthStore()
  const isTenantActive = tenantStatus === 'Active' || tenantStatus === 'Trialing' || role === 'SuperAdmin'
  const canManage = (role === 'MarketingManager' || role === 'SuperAdmin') && isTenantActive
  const canDelete = (role === 'TenantAdmin' || role === 'SuperAdmin') && isTenantActive
  const canSend = (campaign.status === 'Draft' || campaign.status === 'Scheduled') && canManage && isTenantActive

  return (
    <div className={`flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors group ${!isTenantActive ? 'opacity-75' : ''}`}>
      <CampaignInitials name={campaign.name} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-medium text-gray-900 truncate">{campaign.name}</p>
          <CampaignStatusBadge status={campaign.status} />
        </div>
        <p className="text-xs text-gray-400">
          {campaign.channel && <span>{campaign.channel} · </span>}
          {campaign.startDate
            ? `Started ${formatDate(campaign.startDate)}`
            : 'No start date'
          }
        </p>
      </div>

      {/* Stats */}
      <div className="hidden lg:flex items-center gap-6 text-xs text-gray-500">
        <div className="text-right">
          <p className="font-medium text-gray-900 tabular-nums">
            {formatCurrency(campaign.budget)}
          </p>
          <p>budget</p>
        </div>
        <div className="text-right">
          <p className="font-medium text-gray-900 tabular-nums">
            {campaign.conversions.toLocaleString()}
          </p>
          <p>conversions</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {canSend && (
          <button
            onClick={() => void onSend(campaign.id)}
            disabled={isSending || !isTenantActive}
            className={`
              ${isTenantActive ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}
              inline-flex items-center gap-1.5 px-3 h-7 rounded-lg
              bg-brand-50 text-brand-600 text-xs font-medium border border-brand-100
              hover:bg-brand-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all
            `}
          >
            {isSending ? (
              <Spinner size="sm" />
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
            {isSending ? 'Sending…' : 'Send'}
          </button>
        )}

        {canManage && (
          <button
            disabled={!isTenantActive}
            className={`${isTenantActive ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'} p-1 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
            title="Edit campaign"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        )}

        {canDelete && (
          <button
            disabled={!isTenantActive}
            className={`${isTenantActive ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'} p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
            title="Delete campaign"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}