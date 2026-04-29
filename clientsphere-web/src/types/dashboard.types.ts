// src/types/dashboard.types.ts
// Derived locally from existing API data — no dedicated backend endpoint needed.
// All metrics computed client-side from the data already loaded in other hooks.

export interface DashboardSummary {
  totalRevenue:       number   // sum of Paid invoice totalAmounts
  revenueGrowth:      number   // placeholder — requires historical data
  activeCustomers:    number
  newCustomersMonth:  number
  openTickets:        number
  urgentTickets:      number
  winRate:            number   // ClosedWon / (ClosedWon + ClosedLost) * 100
}

export interface MonthlyWonData {
  month:  string   // "Jan", "Feb" etc.
  won:    number
  value:  number   // total estimated value of won deals
}

export interface TicketStatusData {
  status: string
  count:  number
  color:  string
}