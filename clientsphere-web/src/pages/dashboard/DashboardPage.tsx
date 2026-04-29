// src/pages/dashboard/DashboardPage.tsx
import {
  DollarSign,
  Users,
  Ticket,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react'
import { useDashboard }          from '@/hooks/useDashboard'
import { useCampaigns }          from '@/hooks/useCampaigns'
import { useAuthStore }          from '@/store/authStore'
import SummaryCard               from './SummaryCard'
import OpportunitiesBarChart     from './OpportunitiesBarChart'
import TicketsPieChart           from './TicketsPieChart'

function formatRevenue(v: number): string {
  if (v >= 1_000_000)
    return `₱${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000)
    return `₱${(v / 1_000).toFixed(0)}K`
  return `₱${v.toFixed(0)}`
}

export default function DashboardPage() {
  const { userId, fullName, role, tenantStatus } = useAuthStore()
  const firstName = typeof fullName === 'string' ? fullName.split(' ')[0] : 'there'

  const isTenantActive = tenantStatus === 'Active' || tenantStatus === 'Trialing' || role === 'SuperAdmin'

  const {
    summary,
    monthlyWon,
    ticketsByStatus,
    loading,
    error,
  } = useDashboard()

  if (role === 'SalesManager' || role === 'SalesRep') {
    return (
      <div className={`space-y-6 ${!isTenantActive ? 'opacity-75 pointer-events-none' : ''}`}>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Welcome, {firstName}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Your ID: {userId ?? '—'}
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200">
            <AlertTriangle size={14} className="text-amber-600 flex-shrink-0" />
            <p className="text-xs text-amber-800">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <SummaryCard
            label="Your ID"
            value={userId ? userId.slice(0, 8) + '…' : '—'}
            delta={undefined}
            deltaType="neutral"
            icon={Users}
            iconBg="#EEEDFE"
            iconColor="#534AB7"
            loading={false}
          />
          <SummaryCard
            label="Win rate"
            value={summary ? `${summary.winRate}%` : '—'}
            delta="vs closed opportunities"
            deltaType={
              summary && summary.winRate >= 60 ? 'up' :
              summary && summary.winRate < 40  ? 'down' :
              'neutral'
            }
            icon={TrendingUp}
            iconBg="#FAEEDA"
            iconColor="#854F0B"
            loading={loading}
          />
          <SummaryCard
            label="Active customers"
            value={summary ? summary.activeCustomers.toLocaleString() : '—'}
            delta={
              summary && summary.newCustomersMonth > 0
                ? `${summary.newCustomersMonth} new this month`
                : undefined
            }
            deltaType="up"
            icon={Users}
            iconBg="#EAF3DE"
            iconColor="#3B6D11"
            loading={loading}
          />
        </div>
      </div>
    )
  }

  if (role === 'MarketingManager') {
    return (
      <div className={`space-y-6 ${!isTenantActive ? 'opacity-75 pointer-events-none' : ''}`}>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Welcome, {firstName}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Your ID: {userId ?? '—'}
          </p>
        </div>

        <MarketingDashboard />
      </div>
    )
  }

  if (role === 'SupportAgent') {
    return (
      <div className={`space-y-6 ${!isTenantActive ? 'opacity-75 pointer-events-none' : ''}`}>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Welcome, {firstName}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Your ID: {userId ?? '—'}
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200">
            <AlertTriangle size={14} className="text-amber-600 flex-shrink-0" />
            <p className="text-xs text-amber-800">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <SummaryCard
            label="Your ID"
            value={userId ? userId.slice(0, 8) + '…' : '—'}
            delta={undefined}
            deltaType="neutral"
            icon={Users}
            iconBg="#EEEDFE"
            iconColor="#534AB7"
            loading={false}
          />
          <SummaryCard
            label="Open tickets"
            value={summary ? summary.openTickets.toLocaleString() : '—'}
            delta={
              summary && summary.urgentTickets > 0
                ? `${summary.urgentTickets} urgent`
                : 'None urgent'
            }
            deltaType={
              summary && summary.urgentTickets > 0 ? 'down' : 'neutral'
            }
            icon={Ticket}
            iconBg="#FCEBEB"
            iconColor="#A32D2D"
            loading={loading}
          />
          <SummaryCard
            label="Urgent tickets"
            value={summary ? summary.urgentTickets.toLocaleString() : '—'}
            delta="Requiring attention"
            deltaType="down"
            icon={AlertTriangle}
            iconBg="#FCEBEB"
            iconColor="#A32D2D"
            loading={loading}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5 items-start">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">
              Tickets by status
            </h2>
            {loading ? (
              <div className="h-56 flex items-center justify-center">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <RefreshCw size={14} className="animate-spin" />
                  Loading chart…
                </div>
              </div>
            ) : ticketsByStatus.length === 0 ? (
              <div className="h-56 flex flex-col items-center justify-center gap-2">
                <p className="text-sm text-gray-400">No ticket data available.</p>
              </div>
            ) : (
              <TicketsPieChart data={ticketsByStatus} />
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${!isTenantActive ? 'opacity-75 pointer-events-none' : ''}`}>
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Welcome back, {firstName}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Here is your business overview for today.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200">
          <AlertTriangle size={14} className="text-amber-600 flex-shrink-0" />
          <p className="text-xs text-amber-800">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard
          label="Total revenue"
          value={summary ? formatRevenue(summary.totalRevenue) : '—'}
          delta={summary ? `${summary.revenueGrowth}% vs last quarter` : undefined}
          deltaType="up"
          icon={DollarSign}
          iconBg="#EEEDFE"
          iconColor="#534AB7"
          loading={loading}
        />
        <SummaryCard
          label="Active customers"
          value={summary ? summary.activeCustomers.toLocaleString() : '—'}
          delta={
            summary && summary.newCustomersMonth > 0
              ? `${summary.newCustomersMonth} new this month`
              : undefined
          }
          deltaType="up"
          icon={Users}
          iconBg="#EAF3DE"
          iconColor="#3B6D11"
          loading={loading}
        />
        <SummaryCard
          label="Open tickets"
          value={summary ? summary.openTickets.toLocaleString() : '—'}
          delta={
            summary && summary.urgentTickets > 0
              ? `${summary.urgentTickets} urgent`
              : 'None urgent'
          }
          deltaType={
            summary && summary.urgentTickets > 0 ? 'down' : 'neutral'
          }
          icon={Ticket}
          iconBg="#FCEBEB"
          iconColor="#A32D2D"
          loading={loading}
        />
        <SummaryCard
          label="Win rate"
          value={summary ? `${summary.winRate}%` : '—'}
          delta="vs closed opportunities"
          deltaType={
            summary && summary.winRate >= 60 ? 'up' :
            summary && summary.winRate < 40  ? 'down' :
            'neutral'
          }
          icon={TrendingUp}
          iconBg="#FAEEDA"
          iconColor="#854F0B"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5 items-start">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                Opportunities won by month
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Last 6 months · closed won deals
              </p>
            </div>
            {!loading && monthlyWon.length > 0 && (
              <div className="text-right">
                <p className="text-lg font-semibold text-brand-600 tabular-nums">
                  {monthlyWon.reduce((s, d) => s + d.won, 0)}
                </p>
                <p className="text-xs text-gray-400">total won</p>
              </div>
            )}
          </div>

          {loading ? (
            <div className="h-56 flex items-center justify-center">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <RefreshCw size={14} className="animate-spin" />
                Loading chart…
              </div>
            </div>
          ) : monthlyWon.every(d => d.won === 0) ? (
            <div className="h-56 flex flex-col items-center justify-center gap-2">
              <p className="text-sm text-gray-400">No closed won deals in the last 6 months.</p>
              <p className="text-xs text-gray-300">Close an opportunity to see data here.</p>
            </div>
          ) : (
            <OpportunitiesBarChart data={monthlyWon} />
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="mb-1">
            <h2 className="text-sm font-semibold text-gray-900">
              Tickets by status
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              All open and historical tickets
            </p>
          </div>

          {loading ? (
            <div className="h-56 flex items-center justify-center">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <RefreshCw size={14} className="animate-spin" />
                Loading chart…
              </div>
            </div>
          ) : ticketsByStatus.length === 0 ? (
            <div className="h-56 flex flex-col items-center justify-center gap-2">
              <p className="text-sm text-gray-400">No ticket data available.</p>
            </div>
          ) : (
            <TicketsPieChart data={ticketsByStatus} />
          )}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Quick actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
         {[
  { label: 'View all leads', path: '/leads', color: 'text-brand-600', bg: 'bg-brand-50 hover:bg-brand-100' },
  { label: 'Open pipeline board', path: '/pipeline', color: 'text-green-700', bg: 'bg-green-50 hover:bg-green-100' },
  { label: 'Urgent tickets', path: '/tickets', color: 'text-red-700', bg: 'bg-red-50 hover:bg-red-100' },
  { label: 'Review invoices', path: '/billing', color: 'text-amber-700', bg: 'bg-amber-50 hover:bg-amber-100' },
].map(link => (
  <a
    key={link.path}
    href={link.path}
    onClick={e => {
      e.preventDefault()
      window.history.pushState({}, '', link.path)
      window.dispatchEvent(new PopStateEvent('popstate'))
    }}
    className={`
      flex items-center justify-between px-4 py-3 rounded-xl
      text-sm font-medium transition-colors
      ${link.bg} ${link.color}
    `}
  >
    {link.label}
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  </a>
))}
        </div>
      </div>
    </div>
  )
}

function MarketingDashboard() {
  const { items, total, loading, error } = useCampaigns(1, 50)

  const activeCampaigns = items.filter(c => c.status === 'Active')
  const totalBudget = items.reduce((s, c) => s + (c.budget ?? 0), 0)
  const totalSpend = items.reduce((s, c) => s + c.actualSpend, 0)

  return (
    <>
      {error && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200">
          <AlertTriangle size={14} className="text-amber-600 flex-shrink-0" />
          <p className="text-xs text-amber-800">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <SummaryCard
          label="Active campaigns"
          value={activeCampaigns.length.toString()}
          delta={loading ? undefined : `${total} total campaigns`}
          deltaType={activeCampaigns.length > 0 ? 'up' : 'neutral'}
          icon={TrendingUp}
          iconBg="#EAF3DE"
          iconColor="#3B6D11"
          loading={loading}
        />
        <SummaryCard
          label="Total budget"
          value={totalBudget >= 1_000_000
            ? `₱${(totalBudget / 1_000_000).toFixed(1)}M`
            : totalBudget >= 1_000
              ? `₱${(totalBudget / 1_000).toFixed(0)}K`
              : `₱${totalBudget.toFixed(0)}`
          }
          delta="All campaigns"
          deltaType="neutral"
          icon={DollarSign}
          iconBg="#EEEDFE"
          iconColor="#534AB7"
          loading={loading}
        />
        <SummaryCard
          label="Total spend"
          value={totalSpend >= 1_000_000
            ? `₱${(totalSpend / 1_000_000).toFixed(1)}M`
            : totalSpend >= 1_000
              ? `₱${(totalSpend / 1_000).toFixed(0)}K`
              : `₱${totalSpend.toFixed(0)}`
          }
          delta="All campaigns"
          deltaType="neutral"
          icon={DollarSign}
          iconBg="#FAEEDA"
          iconColor="#854F0B"
          loading={loading}
        />
      </div>

      {activeCampaigns.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Active campaigns</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {activeCampaigns.slice(0, 5).map(campaign => (
              <div key={campaign.id} className="flex items-center gap-4 px-5 py-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-medium text-gray-900 truncate">{campaign.name}</p>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-800">
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {campaign.channel && <span>{campaign.channel} · </span>}
                    {campaign.startDate && `Started ${campaign.startDate}`}
                  </p>
                </div>
                <div className="text-right text-xs text-gray-500">
                  <p className="font-medium text-gray-900">
                    {campaign.budget ? `₱${campaign.budget.toLocaleString()}` : '—'}
                  </p>
                  <p>budget</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}