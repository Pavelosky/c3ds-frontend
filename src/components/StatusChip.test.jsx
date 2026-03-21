/**
 * Tests for StatusChip component.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusChip } from './StatusChip'

// MUI Chip renders its label as text content
const cases = [
  { status: 'PENDING',  label: 'Pending' },
  { status: 'ACTIVE',   label: 'Active' },
  { status: 'INACTIVE', label: 'Inactive' },
  { status: 'REVOKED',  label: 'Revoked' },
  { status: 'EXPIRED',  label: 'Expired' },
]

describe('StatusChip', () => {
  for (const { status, label } of cases) {
    it(`renders "${label}" label for status ${status}`, () => {
      render(<StatusChip status={status} />)
      expect(screen.getByText(label)).toBeDefined()
    })
  }

  it('falls back to "Expired" label for unknown status', () => {
    render(<StatusChip status="UNKNOWN_STATUS" />)
    expect(screen.getByText('Expired')).toBeDefined()
  })

  it('accepts a custom size prop without error', () => {
    render(<StatusChip status="ACTIVE" size="medium" />)
    expect(screen.getByText('Active')).toBeDefined()
  })
})
