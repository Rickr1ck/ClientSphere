// src/types/api.types.ts
export interface PagedResult<T> {
  items:      T[]
  totalCount: number
  page:       number
  pageSize:   number
  totalPages: number
  hasNextPage:boolean
  hasPrevPage:boolean
}

export interface ApiError {
  type:    string
  title:   string
  status:  number
  detail:  string
  traceId: string
}

export interface ValidationProblemDetails extends ApiError {
  errors: Record<string, string[]>
}