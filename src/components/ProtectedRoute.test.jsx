/**
 * Tests for ProtectedRoute component.
 *
 * ProtectedRoute relies on useAuth() and react-router-dom Navigate.
 * Mock useAuth to control auth state and wrap in MemoryRouter
 * to support Navigate.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { createElement } from 'react'
import { ProtectedRoute } from './ProtectedRoute'

// Mock useAuth so tests control auth state without real API calls
vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

import { useAuth } from '../contexts/AuthContext'

// Helper: render ProtectedRoute inside a minimal router
function renderRoute(authState, routeProps = {}) {
  useAuth.mockReturnValue({
    isAuthenticated: false,
    isLoading: false,
    isParticipant: false,
    isAdmin: false,
    ...authState,
  })

  return render(
    createElement(
      MemoryRouter,
      { initialEntries: ['/protected'] },
      createElement(
        Routes,
        null,
        createElement(
          Route,
          {
            path: '/protected',
            element: createElement(
              ProtectedRoute,
              routeProps,
              createElement('div', null, 'Protected Content')
            ),
          }
        ),
        createElement(Route, { path: '/', element: createElement('div', null, 'Home') })
      )
    )
  )
}

describe('ProtectedRoute', () => {
  it('shows loading spinner while auth is loading', () => {
    renderRoute({ isLoading: true, isAuthenticated: false })
    // CircularProgress renders a role=progressbar in MUI
    expect(document.querySelector('[role="progressbar"]')).not.toBeNull()
    expect(screen.queryByText('Protected Content')).toBeNull()
  })

  it('redirects unauthenticated user to home', () => {
    renderRoute({ isAuthenticated: false })
    expect(screen.queryByText('Protected Content')).toBeNull()
    expect(screen.getByText('Home')).toBeDefined()
  })

  it('renders children for authenticated user', () => {
    renderRoute({ isAuthenticated: true })
    expect(screen.getByText('Protected Content')).toBeDefined()
  })

  it('redirects non-admin user when requireAdmin=true', () => {
    renderRoute({ isAuthenticated: true, isAdmin: false }, { requireAdmin: true })
    expect(screen.queryByText('Protected Content')).toBeNull()
    expect(screen.getByText('Home')).toBeDefined()
  })

  it('renders children for admin user when requireAdmin=true', () => {
    renderRoute({ isAuthenticated: true, isAdmin: true }, { requireAdmin: true })
    expect(screen.getByText('Protected Content')).toBeDefined()
  })

  it('redirects non-participant when requireParticipant=true', () => {
    renderRoute({ isAuthenticated: true, isParticipant: false }, { requireParticipant: true })
    expect(screen.queryByText('Protected Content')).toBeNull()
    expect(screen.getByText('Home')).toBeDefined()
  })

  it('renders children for participant when requireParticipant=true', () => {
    renderRoute({ isAuthenticated: true, isParticipant: true }, { requireParticipant: true })
    expect(screen.getByText('Protected Content')).toBeDefined()
  })
})
