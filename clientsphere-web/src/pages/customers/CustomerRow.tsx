// src/pages/customers/CustomerRow.tsx
import type { CustomerResponse } from '@/types/customer.types'
import { useAuthStore } from '@/store/authStore'

interface CustomerRowProps {
  customer: CustomerResponse
  onEdit:   (customer: CustomerResponse) => void
  onDelete: (customer: CustomerResponse) => void
}

// Format currency safely — annualRevenue is a number | null from the API
function formatRevenue(value: number | null): string {
  if (value == null) return '—'
  return new Intl.NumberFormat('en-PH', {
    style:    'currency',
    currency: 'PHP',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

function CompanyInitials({ name }: { name: string }) {
  const initials = typeof name === 'string'
    ? name
      .split(' ')
      .slice(0, 2)
      .map(w => w[0])
      .join('')
      .toUpperCase()
    : 'C'

  return (
    <div className="w-8 h-8 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center flex-shrink-0">
      <span className="text-brand-600 font-semibold text-xs">{initials}</span>
    </div>
  )
}

export default function CustomerRow({ customer, onEdit, onDelete }: CustomerRowProps) {
  const { role, hasRole, tenantStatus } = useAuthStore()
  const isReadOnly = role === 'ReadOnly'
  const isTenantActive = tenantStatus === 'Active' || tenantStatus === 'Trialing' || role === 'SuperAdmin'
  const canDelete = hasRole(['TenantAdmin', 'SuperAdmin'])

  return (
    <tr className={`group hover:bg-gray-50 transition-colors ${!isTenantActive ? 'opacity-75' : ''}`}>

      {/* Company */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <CompanyInitials name={customer.companyName} />
          <div>
            <p className="text-sm font-medium text-gray-900 leading-tight">
              {customer.companyName}
            </p>
            {customer.website && (
              <a
                href={customer.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-400 hover:text-brand-600 transition-colors"
                onClick={e => e.stopPropagation()}
              >
                {customer.website.replace(/^https?:\/\//, '')}
              </a>
            )}
          </div>
        </div>
      </td>

      {/* Industry */}
      <td className="px-4 py-3">
        {customer.industry
          ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-brand-50 text-brand-600">
              {customer.industry}
            </span>
          )
          : <span className="text-gray-300 text-sm">—</span>
        }
      </td>

      {/* Country */}
      <td className="px-4 py-3">
        <span className="text-sm text-gray-700">
          {customer.billingCountry ?? '—'}
        </span>
      </td>

      {/* Revenue */}
      <td className="px-4 py-3">
        <span className="text-sm text-gray-700 tabular-nums">
          {formatRevenue(customer.annualRevenue)}
        </span>
      </td>

      {/* Employees */}
      <td className="px-4 py-3">
        <span className="text-sm text-gray-700 tabular-nums">
          {customer.employeeCount != null
            ? customer.employeeCount.toLocaleString()
            : '—'}
        </span>
      </td>

      {/* Created */}
      <td className="px-4 py-3">
        <span className="text-xs text-gray-400">
          {new Date(customer.createdAt).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
          })}
        </span>
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className={`flex items-center gap-1.5 transition-opacity ${isTenantActive ? 'opacity-0 group-hover:opacity-100' : 'opacity-50'}`}>
          {!isReadOnly && (
            <button
              onClick={() => onEdit(customer)}
              disabled={!isTenantActive}
              className="
                w-7 h-7 rounded-md flex items-center justify-center
                border border-gray-200 text-gray-500
                hover:bg-gray-100 hover:text-gray-700 transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
              "
              aria-label={`Edit ${customer.companyName}`}
              title="Edit"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}

          {canDelete && (
            <button
              onClick={() => onDelete(customer)}
              disabled={!isTenantActive}
              className="
                w-7 h-7 rounded-md flex items-center justify-center
                border border-gray-200 text-gray-500
                hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
              "
              aria-label={`Delete ${customer.companyName}`}
              title="Delete"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </td>

    </tr>
  )
}