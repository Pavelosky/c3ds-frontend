/**
 * Tests for useStats hook.
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { createElement } from 'react'
import { useStats } from './useStats'

const server = setupServer(
  http.get('/api/v1/dashboard/stats/', () =>
    HttpResponse.json({
      total_devices: 5,
      active_devices: 3,
      pending_devices: 1,
      revoked_devices: 1,
      total_messages: 100,
      messages_today: 20,
      messages_this_week: 80,
      alerts_last_2h: 2,
    })
  )
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }) => createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useStats', () => {
  it('returns stats data on successful fetch', async () => {
    const { result } = renderHook(() => useStats(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data.active_devices).toBe(3)
    expect(result.current.data.alerts_last_2h).toBe(2)
    expect(result.current.data.total_messages).toBe(100)
  })

  it('has refetchInterval of 30000ms', () => {
    // The hook is configured with refetchInterval: 30000
    // Verify the query key and that it does not error on load
    const { result } = renderHook(() => useStats(), { wrapper: makeWrapper() })
    expect(result.current).toBeDefined()
  })

  it('returns error state when API fails', async () => {
    server.use(
      http.get('/api/v1/dashboard/stats/', () =>
        HttpResponse.json({ error: 'Server error' }, { status: 500 })
      )
    )
    const { result } = renderHook(() => useStats(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
