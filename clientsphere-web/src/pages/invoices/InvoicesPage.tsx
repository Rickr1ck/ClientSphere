// src/pages/invoices/InvoicesPage.tsx
import { useState } from 'react'
import { useInvoices }       from '@/hooks/useInvoices'
import InvoiceStatusBadge    from './InvoiceStatusBadge'
import Spinner               from '@/components/ui/Spinner'
import type { InvoiceStatus } from '@/types/invoice.types'

const PAGE_SIZE = 20

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency', currency, minimumFractionDigits: 2,
  }).format(amount)
}

type FilterStatus = 'all' | InvoiceStatus

export default function InvoicesPage() {
  const [page,          setPage]   = useState(1)
  const [statusFilter,  setFilter] = useState<FilterStatus>('all')
  const { items, total, loading, error, refetch } = useInvoices(page, PAGE_SIZE)

  const filtered = statusFilter === 'all'
    ? items
    : items.filter(i => i.status === statusFilter)

  // Summary financials
  const totalPaid = items
    .filter(i => i.status === 'Paid')
    .reduce((s, i) => s + i.totalAmount, 0)
  const totalOutstanding = items
    .filter(i => i.status === 'Sent')
    .reduce((s, i) => s + i.totalAmount, 0)
  const totalDraft = items
    .filter(i => i.status === 'Draft')
    .reduce((s, i) => s + i.totalAmount, 0)

  const FILTER_OPTIONS: { value: FilterStatus; label: string }[] = [
    { value: 'all',           label: 'All'           },
    { value: 'Draft',         label: 'Draft'         },
    { value: 'Sent',          label: 'Sent'          },
    { value: 'Paid',          label: 'Paid'          },
    { value: 'Void',          label: 'Void'          },
    { value: 'Uncollectible', label: 'Uncollectible' },
  ]

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Invoices</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading ? 'Loading…' : `${total.toLocaleString()} invoices`}
          </p>
        </div>
      </div>

      {/* Summary stat cards */}
      {!loading && !error && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-green-50 rounded-xl border border-green-100 p-4">
            <p className="text-xs font-medium text-green-700 uppercase tracking-wide">
              Total collected
            </p>
            <p className="text-2xl font-semibold text-green-900 mt-1 tabular-nums">
              {new Intl.NumberFormat('en-PH', {
                style: 'currency', currency: 'PHP',
                notation: 'compact', maximumFractionDigits: 1,
              }).format(totalPaid)}
            </p>
          </div>
          <div className="bg-blue-50 rounded-xl border border-blue-100 p-4">
            <p className="text-xs font-medium text-blue-700 uppercase tracking-wide">
              Outstanding
            </p>
            <p className="text-2xl font-semibold text-blue-900 mt-1 tabular-nums">
              {new Intl.NumberFormat('en-PH', {
                style: 'currency', currency: 'PHP',
                notation: 'compact', maximumFractionDigits: 1,
              }).format(totalOutstanding)}
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              In draft
            </p>
            <p className="text-2xl font-semibold text-gray-900 mt-1 tabular-nums">
              {new Intl.NumberFormat('en-PH', {
                style: 'currency', currency: 'PHP',
                notation: 'compact', maximumFractionDigits: 1,
              }).format(totalDraft)}
            </p>
          </div>
        </div>
      )}

      {/* Filter chips */}
      <div className="flex items-center gap-2 flex-wrap">
        {FILTER_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`
              px-3 h-7 rounded-full text-xs font-medium transition-all
              ${statusFilter === opt.value
                ? 'bg-brand-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }
            `}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">

        {loading && (
          <div className="flex items-center justify-center py-20 gap-3">
            <Spinner size="lg" />
            <p className="text-sm text-gray-400">Loading invoices…</p>
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center py-20 gap-3">
            <p className="text-sm text-gray-500">{error}</p>
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
                    'Invoice no.', 'Customer', 'Issue date',
                    'Due date', 'Amount', 'Tax', 'Total',
                    'Stripe status', 'Stripe ID',
                  ].map(h => (
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
                    <td colSpan={9} className="px-4 py-16 text-center text-sm text-gray-400">
                      No invoices match the selected filter.
                    </td>
                  </tr>
                ) : (
                  filtered.map(invoice => (
                    <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-gray-700">
                          {invoice.invoiceNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {/* customerId shown — replace with customer name in a future phase */}
                        <span className="font-mono text-xs text-gray-400">
                          {invoice.customerId.slice(0, 8)}…
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                        {formatDate(invoice.issueDate)}
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        <span className={
                          new Date(invoice.dueDate) < new Date() && invoice.status !== 'Paid'
                            ? 'text-red-600 font-medium'
                            : 'text-gray-700'
                        }>
                          {formatDate(invoice.dueDate)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 tabular-nums">
                        {formatCurrency(invoice.subtotal, invoice.currencyCode)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 tabular-nums">
                        {(invoice.taxRate * 100).toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900 tabular-nums whitespace-nowrap">
                        {formatCurrency(invoice.totalAmount, invoice.currencyCode)}
                      </td>
                      <td className="px-4 py-3">
                        <InvoiceStatusBadge status={invoice.status} />
                      </td>
                      <td className="px-4 py-3">
                        {invoice.stripeInvoiceId ? (
                          <span className="font-mono text-xs text-gray-400">
                            {invoice.stripeInvoiceId.slice(0, 14)}…
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > PAGE_SIZE && !loading && !error && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, total)} of{' '}
              {total.toLocaleString()} invoices
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-7 h-7 rounded-md border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-xs text-gray-500 px-2">{page}</span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page * PAGE_SIZE >= total}
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
  )
}