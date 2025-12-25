import { describe, it, expect } from 'vitest'
import {
  parsePaginationParams,
  parseSortParams,
  parseQueryOptions,
  calculateRange,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from '@/lib/api/pagination'

describe('pagination utilities', () => {
  // =========================================================================
  // parsePaginationParams
  // =========================================================================
  describe('parsePaginationParams', () => {
    it('should return defaults when no params provided', () => {
      const params = new URLSearchParams()
      const result = parsePaginationParams(params)

      expect(result.page).toBe(1)
      expect(result.pageSize).toBe(DEFAULT_PAGE_SIZE)
    })

    it('should parse valid page and pageSize', () => {
      const params = new URLSearchParams({ page: '3', pageSize: '25' })
      const result = parsePaginationParams(params)

      expect(result.page).toBe(3)
      expect(result.pageSize).toBe(25)
    })

    it('should enforce minimum page of 1', () => {
      const params = new URLSearchParams({ page: '0' })
      const result = parsePaginationParams(params)

      expect(result.page).toBe(1)
    })

    it('should enforce minimum page of 1 for negative values', () => {
      const params = new URLSearchParams({ page: '-5' })
      const result = parsePaginationParams(params)

      expect(result.page).toBe(1)
    })

    it('should enforce maximum pageSize', () => {
      const params = new URLSearchParams({ pageSize: '500' })
      const result = parsePaginationParams(params)

      expect(result.pageSize).toBe(MAX_PAGE_SIZE)
    })

    it('should handle invalid numeric values', () => {
      const params = new URLSearchParams({ page: 'abc', pageSize: 'xyz' })
      const result = parsePaginationParams(params)

      expect(result.page).toBe(1)
      expect(result.pageSize).toBe(DEFAULT_PAGE_SIZE)
    })

    it('should parse cursor when provided', () => {
      const params = new URLSearchParams({ cursor: 'abc123' })
      const result = parsePaginationParams(params)

      expect(result.cursor).toBe('abc123')
    })
  })

  // =========================================================================
  // parseSortParams
  // =========================================================================
  describe('parseSortParams', () => {
    it('should return defaults when no params provided', () => {
      const params = new URLSearchParams()
      const result = parseSortParams(params)

      expect(result.field).toBe('created_at')
      expect(result.order).toBe('desc')
    })

    it('should parse valid sort params', () => {
      const params = new URLSearchParams({ sort: 'name', order: 'asc' })
      const result = parseSortParams(params)

      expect(result.field).toBe('name')
      expect(result.order).toBe('asc')
    })

    it('should use custom defaults', () => {
      const params = new URLSearchParams()
      const result = parseSortParams(params, { field: 'email', order: 'asc' })

      expect(result.field).toBe('email')
      expect(result.order).toBe('asc')
    })

    it('should ignore invalid order values', () => {
      const params = new URLSearchParams({ order: 'invalid' })
      const result = parseSortParams(params)

      expect(result.order).toBe('desc')
    })
  })

  // =========================================================================
  // calculateRange
  // =========================================================================
  describe('calculateRange', () => {
    it('should calculate correct range for page 1', () => {
      const { from, to } = calculateRange(1, 10)

      expect(from).toBe(0)
      expect(to).toBe(9)
    })

    it('should calculate correct range for page 2', () => {
      const { from, to } = calculateRange(2, 10)

      expect(from).toBe(10)
      expect(to).toBe(19)
    })

    it('should calculate correct range for page 5 with pageSize 25', () => {
      const { from, to } = calculateRange(5, 25)

      expect(from).toBe(100)
      expect(to).toBe(124)
    })

    it('should handle pageSize of 1', () => {
      const { from, to } = calculateRange(3, 1)

      expect(from).toBe(2)
      expect(to).toBe(2)
    })
  })

  // =========================================================================
  // parseQueryOptions
  // =========================================================================
  describe('parseQueryOptions', () => {
    it('should parse all query options', () => {
      const params = new URLSearchParams({
        page: '2',
        pageSize: '20',
        sort: 'name',
        order: 'asc',
        search: 'john',
        status: 'active',
        propertyId: 'prop-123',
      })

      const result = parseQueryOptions(params, ['status', 'propertyId'])

      expect(result.page).toBe(2)
      expect(result.pageSize).toBe(20)
      expect(result.sort?.field).toBe('name')
      expect(result.sort?.order).toBe('asc')
      expect(result.search).toBe('john')
      expect(result.filters?.status).toBe('active')
      expect(result.filters?.propertyId).toBe('prop-123')
    })

    it('should only include allowed filters', () => {
      const params = new URLSearchParams({
        status: 'active',
        malicious: 'payload',
      })

      const result = parseQueryOptions(params, ['status'])

      expect(result.filters?.status).toBe('active')
      expect(result.filters?.malicious).toBeUndefined()
    })

    it('should return undefined for empty search', () => {
      const params = new URLSearchParams({ search: '' })
      const result = parseQueryOptions(params, [])

      expect(result.search).toBeUndefined()
    })
  })
})
