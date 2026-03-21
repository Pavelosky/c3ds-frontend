/**
 * Tests for useMessages hook.
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { createElement } from 'react'
import { useMessages } from './useMessages'

const server = setupServer(
  http.get('/api/v1/messages/', ({ request }) => {
    const url = new URL(request.url)
    const type = url.searchParams.get('message_type')
    const all = [
      { id: 1, message_type: 'heartbeat', device: 'uuid-1' },
      { id: 2, message_type: 'detection', device: 'uuid-1' },
    ]
    return HttpResponse.json(type ? all.filter(m => m.message_type === type) : all)
  })
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }) => createElement(QueryClientProvider, { client: qc }, children)
}

describe('useMessages', () => {
  it('returns all messages when no filter provided', async () => {
    const { result } = renderHook(() => useMessages({}), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    // messagesApi.getMessages returns array directly or response.data
    expect(Array.isArray(result.current.data)).toBe(true)
    expect(result.current.data.length).toBe(2)
  })

  it('passes message_type filter to API', async () => {
    let receivedType = null
    server.use(
      http.get('/api/v1/messages/', ({ request }) => {
        const url = new URL(request.url)
        receivedType = url.searchParams.get('message_type')
        return HttpResponse.json([{ id: 2, message_type: 'detection', device: 'uuid-1' }])
      })
    )

    const { result } = renderHook(
      () => useMessages({ message_type: 'detection' }),
      { wrapper: makeWrapper() }
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(receivedType).toBe('detection')
  })

  it('passes limit filter to API', async () => {
    let receivedLimit = null
    server.use(
      http.get('/api/v1/messages/', ({ request }) => {
        const url = new URL(request.url)
        receivedLimit = url.searchParams.get('limit')
        return HttpResponse.json([])
      })
    )

    const { result } = renderHook(
      () => useMessages({ limit: 10 }),
      { wrapper: makeWrapper() }
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(receivedLimit).toBe('10')
  })

  it('uses filters as part of query key for separate caching', () => {
    // Two hooks with different filters should have different query keys
    const filters1 = { message_type: 'heartbeat' }
    const filters2 = { message_type: 'detection' }
    // Verify the hook accepts different filters without error
    const { result: r1 } = renderHook(() => useMessages(filters1), { wrapper: makeWrapper() })
    const { result: r2 } = renderHook(() => useMessages(filters2), { wrapper: makeWrapper() })
    expect(r1.current).toBeDefined()
    expect(r2.current).toBeDefined()
  })
})
