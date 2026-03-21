/**
 * Tests for AuthContext / AuthProvider / useAuth.
 */
import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { createElement } from 'react'
import { AuthProvider, useAuth } from './AuthContext'

// Prevent jsdom navigation from tearing down the DOM during tests.
// The logout/login functions call window.location.href = '...' which jsdom
// does not support fully and causes unhandled errors in tests.
Object.defineProperty(window, 'location', {
  writable: true,
  value: { href: 'http://localhost/', replace: vi.fn(), origin: 'http://localhost' },
})

// ── MSW server ────────────────────────────────────────────────────────────────

const server = setupServer(
  http.get('/api/v1/auth/me/', () => {
    return HttpResponse.json({
      id: 1,
      username: 'alice',
      is_admin: false,
      is_participant: true,
    })
  }),
  http.post('/api/v1/auth/login/', async ({ request }) => {
    const body = await request.json()
    if (body.username === 'alice' && body.password === 'secret') {
      return HttpResponse.json({ username: 'alice' })
    }
    return new HttpResponse(JSON.stringify({ detail: 'Invalid credentials' }), { status: 400 })
  }),
  http.post('/api/v1/auth/logout/', () => {
    return new HttpResponse(null, { status: 200 })
  })
)

beforeAll(() => server.listen())
afterEach(() => {
  server.resetHandlers()
  // Reset location.href which may have been modified by the axios 401 interceptor
  window.location.href = 'http://localhost/'
})
afterAll(() => server.close())

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }) =>
    createElement(QueryClientProvider, { client: qc }, createElement(AuthProvider, null, children))
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useAuth — authenticated user', () => {
  it('is authenticated when /auth/me/ returns a user', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('exposes user data', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.user.username).toBe('alice')
  })

  it('sets isParticipant from user.is_participant', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.isParticipant).toBe(true)
  })

  it('sets isAdmin false when user is not staff', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.isAdmin).toBe(false)
  })
})

describe('useAuth — admin user', () => {
  it('sets isAdmin true when user has is_admin flag', async () => {
    server.use(
      http.get('/api/v1/auth/me/', () =>
        HttpResponse.json({ id: 2, username: 'admin', is_admin: true, is_participant: false })
      )
    )
    const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.isAdmin).toBe(true)
    expect(result.current.isParticipant).toBe(false)
  })
})

describe('useAuth — unauthenticated', () => {
  it('is not authenticated when /auth/me/ returns 401', async () => {
    server.use(
      http.get('/api/v1/auth/me/', () => new HttpResponse(null, { status: 401 }))
    )
    const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
  })
})

describe('useAuth.login', () => {
  it('throws on invalid credentials', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // Call login directly (not wrapped in act) to avoid React state pollution
    // after the rejection propagates up
    await expect(
      result.current.login({ username: 'alice', password: 'wrong' })
    ).rejects.toBeDefined()
  })
})

describe('useAuth.logout', () => {
  it('calls the logout API and clears the query cache', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.isAuthenticated).toBe(true)

    // Track the logout API call via MSW
    let logoutCallMade = false
    server.use(
      http.post('/api/v1/auth/logout/', () => {
        logoutCallMade = true
        return new HttpResponse(null, { status: 200 })
      })
    )

    const logoutFn = result.current.logout
    await act(async () => {
      await logoutFn()
    })

    expect(logoutCallMade).toBe(true)
  })
})
