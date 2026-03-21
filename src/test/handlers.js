/**
 * MSW (Mock Service Worker) request handlers shared across hook/component tests.
 */
import { http, HttpResponse } from 'msw'

export const handlers = [
  // Dashboard stats
  http.get('/api/v1/dashboard/stats/', () =>
    HttpResponse.json({
      total_devices: 3,
      active_devices: 2,
      pending_devices: 1,
      revoked_devices: 0,
      total_messages: 50,
      messages_today: 10,
      messages_this_week: 40,
      alerts_last_2h: 1,
    })
  ),

  // Messages list
  http.get('/api/v1/messages/', ({ request }) => {
    const url = new URL(request.url)
    const type = url.searchParams.get('message_type')
    const messages = [
      { id: 1, message_type: 'heartbeat', device: 'uuid-1', timestamp: '2026-01-01T00:00:00Z', data: {} },
      { id: 2, message_type: 'detection', device: 'uuid-1', timestamp: '2026-01-01T00:01:00Z', data: {} },
    ]
    const filtered = type ? messages.filter(m => m.message_type === type) : messages
    return HttpResponse.json(filtered)
  }),

  // Participant devices list
  http.get('/api/v1/devices/participant/', () =>
    HttpResponse.json({ results: [
      { id: 'device-uuid-1', name: 'Device 1', status: 'ACTIVE' },
    ]})
  ),

  // Generate certificate
  http.post('/api/v1/devices/participant/:id/generate-certificate/', () =>
    HttpResponse.json({
      message: 'Certificate generated successfully.',
      certificate_serial: 'abc123',
      certificate_expiry: '2027-01-01T00:00:00Z',
      download_expires_at: '2026-01-02T00:00:00Z',
    }, { status: 201 })
  ),

  // Auth me
  http.get('/api/v1/auth/me/', () =>
    HttpResponse.json({
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      user_type: 'PARTICIPANT',
      is_participant: true,
      is_admin: false,
    })
  ),

  // Login
  http.post('/api/v1/auth/login/', async ({ request }) => {
    const body = await request.json()
    if (body.username === 'valid' && body.password === 'valid') {
      return HttpResponse.json({ id: 1, username: 'valid', is_admin: false, is_participant: true })
    }
    return HttpResponse.json({ errors: { non_field_errors: ['Invalid credentials'] } }, { status: 400 })
  }),

  // Logout
  http.post('/api/v1/auth/logout/', () =>
    HttpResponse.json({ detail: 'Successfully logged out.' })
  ),

  // Revoke device (DELETE)
  http.delete('/api/v1/devices/participant/:id/', () =>
    HttpResponse.json({ id: 'device-uuid-1', status: 'REVOKED' })
  ),
]
