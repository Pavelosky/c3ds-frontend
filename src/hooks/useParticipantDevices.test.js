/**
 * Tests for useParticipantDevices hooks.
 */
import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { createElement } from 'react'
import {
  useMyDevices,
  useMyDevice,
  useCreateDevice,
  useRevokeDevice,
  useGenerateCertificate,
  downloadCertificate,
  downloadPrivateKey,
} from './useParticipantDevices'

const DEVICES_URL = '/api/v1/devices/participant/'

const fakeDevices = [
  { id: 'uuid-1', name: 'Device A', status: 'ACTIVE' },
  { id: 'uuid-2', name: 'Device B', status: 'PENDING' },
]

const server = setupServer(
  http.get(DEVICES_URL, () => {
    return HttpResponse.json({ results: fakeDevices })
  }),
  http.get(`${DEVICES_URL}:id/`, ({ params }) => {
    const device = fakeDevices.find(d => d.id === params.id)
    if (!device) return new HttpResponse(null, { status: 404 })
    return HttpResponse.json(device)
  }),
  http.post(DEVICES_URL, async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({ id: 'uuid-new', ...body }, { status: 201 })
  }),
  http.delete(`${DEVICES_URL}:id/`, () => {
    return new HttpResponse(null, { status: 204 })
  }),
  http.post(`${DEVICES_URL}:id/generate-certificate/`, () => {
    return HttpResponse.json({ serial: 'abc123', expiry: '2027-01-01' }, { status: 201 })
  }),
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }) => createElement(QueryClientProvider, { client: qc }, children)
}

// ── useMyDevices ─────────────────────────────────────────────────────────────

describe('useMyDevices', () => {
  it('returns list of devices from paginated response', async () => {
    const { result } = renderHook(() => useMyDevices(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(fakeDevices)
  })

  it('returns empty array when results is missing', async () => {
    server.use(
      http.get(DEVICES_URL, () => HttpResponse.json({}))
    )
    const { result } = renderHook(() => useMyDevices(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([])
  })
})

// ── useMyDevice ──────────────────────────────────────────────────────────────

describe('useMyDevice', () => {
  it('returns single device by id', async () => {
    const { result } = renderHook(() => useMyDevice('uuid-1'), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data.name).toBe('Device A')
  })

  it('does not fetch when deviceId is falsy', () => {
    const { result } = renderHook(() => useMyDevice(null), { wrapper: makeWrapper() })
    expect(result.current.isFetching).toBe(false)
  })
})

// ── useCreateDevice ──────────────────────────────────────────────────────────

describe('useCreateDevice', () => {
  it('posts to devices endpoint and returns created device', async () => {
    let postedBody = null
    server.use(
      http.post(DEVICES_URL, async ({ request }) => {
        postedBody = await request.json()
        return HttpResponse.json({ id: 'uuid-new', ...postedBody }, { status: 201 })
      })
    )

    const { result } = renderHook(() => useCreateDevice(), { wrapper: makeWrapper() })

    let data
    await act(async () => {
      data = await result.current.mutateAsync({ name: 'New Device', device_type: 'FIXED' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(postedBody).toEqual({ name: 'New Device', device_type: 'FIXED' })
    expect(data.data.id).toBe('uuid-new')
  })

  it('exposes error on failure', async () => {
    server.use(
      http.post(DEVICES_URL, () => new HttpResponse(null, { status: 400 }))
    )

    const { result } = renderHook(() => useCreateDevice(), { wrapper: makeWrapper() })
    await act(async () => {
      try { await result.current.mutateAsync({ name: 'bad' }) } catch (_) { /* expected */ }
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

// ── useRevokeDevice ──────────────────────────────────────────────────────────

describe('useRevokeDevice', () => {
  it('sends DELETE to device endpoint', async () => {
    let deletedId = null
    server.use(
      http.delete(`${DEVICES_URL}:id/`, ({ params }) => {
        deletedId = params.id
        return new HttpResponse(null, { status: 204 })
      })
    )

    const { result } = renderHook(() => useRevokeDevice(), { wrapper: makeWrapper() })
    await act(async () => {
      await result.current.mutateAsync('uuid-1')
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(deletedId).toBe('uuid-1')
  })
})

// ── useGenerateCertificate ───────────────────────────────────────────────────

describe('useGenerateCertificate', () => {
  it('posts to generate-certificate endpoint', async () => {
    let calledId = null
    server.use(
      http.post(`${DEVICES_URL}:id/generate-certificate/`, ({ params }) => {
        calledId = params.id
        return HttpResponse.json({ serial: 'abc', expiry: '2027-01-01' }, { status: 201 })
      })
    )

    const { result } = renderHook(() => useGenerateCertificate(), { wrapper: makeWrapper() })
    await act(async () => {
      await result.current.mutateAsync('uuid-1')
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(calledId).toBe('uuid-1')
  })
})

// ── downloadCertificate / downloadPrivateKey ─────────────────────────────────
// Blob download mechanics are tested by mocking the API call directly.
// MSW + Node.js Blob/stream handling has compatibility issues with axios responseType:'blob'.

vi.mock('../api/client', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    participantDevicesAPI: {
      ...actual.participantDevicesAPI,
      downloadCertificate: vi.fn().mockResolvedValue({ data: 'MOCK_CERT_PEM' }),
      downloadPrivateKey: vi.fn().mockResolvedValue({ data: 'MOCK_KEY_PEM' }),
    },
  }
})

describe('downloadCertificate', () => {
  it('creates a blob anchor and triggers click', async () => {
    const createObjectURL = vi.fn(() => 'blob:mock-url')
    const revokeObjectURL = vi.fn()
    window.URL.createObjectURL = createObjectURL
    window.URL.revokeObjectURL = revokeObjectURL

    const realCreateElement = document.createElement.bind(document)
    const mockLink = { href: '', download: '', click: vi.fn() }
    const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'a') return mockLink
      return realCreateElement(tag)
    })
    const appendSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => {})
    const removeSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => {})

    await downloadCertificate('uuid-1', 'MyDevice')

    expect(mockLink.download).toBe('MyDevice_certificate.pem')
    expect(mockLink.click).toHaveBeenCalled()
    expect(createObjectURL).toHaveBeenCalled()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')

    createElementSpy.mockRestore()
    appendSpy.mockRestore()
    removeSpy.mockRestore()
  })
})

describe('downloadPrivateKey', () => {
  it('creates a blob anchor and triggers click', async () => {
    const createObjectURL = vi.fn(() => 'blob:mock-key-url')
    const revokeObjectURL = vi.fn()
    window.URL.createObjectURL = createObjectURL
    window.URL.revokeObjectURL = revokeObjectURL

    const realCreateElement = document.createElement.bind(document)
    const mockLink = { href: '', download: '', click: vi.fn() }
    const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'a') return mockLink
      return realCreateElement(tag)
    })
    const appendSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => {})
    const removeSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => {})

    await downloadPrivateKey('uuid-1', 'MyDevice')

    expect(mockLink.download).toBe('MyDevice_private.key')
    expect(mockLink.click).toHaveBeenCalled()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-key-url')

    createElementSpy.mockRestore()
    appendSpy.mockRestore()
    removeSpy.mockRestore()
  })
})
