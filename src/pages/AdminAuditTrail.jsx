import { useParams, Link as RouterLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Typography, Stack, CircularProgress,
  Select, MenuItem, FormControl,
} from '@mui/material';
import { ArrowBack, History } from '@mui/icons-material';
import { useState } from 'react';
import AdminPageLayout from '../components/AdminPageLayout';
import { adminAPI } from '../api/client';

const EVENT_TYPE_COLOR = {
  DEVICE_REGISTERED: '#2196f3',
  STATUS_CHANGED: '#ff9800',
  CERTIFICATE_GENERATED: '#9c27b0',
  CERTIFICATE_DOWNLOADED: '#546e7a',
  ANOMALY_RAISED: '#f44336',
  ANOMALY_RESOLVED: '#00ff41',
  DEVICE_UPDATED: '#78909c',
};

const EVENT_TYPE_LABEL = {
  DEVICE_REGISTERED: 'Registered',
  STATUS_CHANGED: 'Status Changed',
  CERTIFICATE_GENERATED: 'Certificate Generated',
  CERTIFICATE_DOWNLOADED: 'Certificate Downloaded',
  ANOMALY_RAISED: 'Anomaly Raised',
  ANOMALY_RESOLVED: 'Anomaly Resolved',
  DEVICE_UPDATED: 'Details Updated',
};

const darkSelect = {
  color: '#e0e0e0',
  fontFamily: 'monospace',
  fontSize: '0.8rem',
  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.15)' },
  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
  '& .MuiSvgIcon-root': { color: '#90a4ae' },
};

export default function AdminAuditTrail() {
  const { deviceId } = useParams();
  const [eventTypeFilter, setEventTypeFilter] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['audit-trail', deviceId, eventTypeFilter],
    queryFn: () => adminAPI.getAuditTrail(deviceId, eventTypeFilter ? { event_type: eventTypeFilter } : {}).then(r => r.data),
  });

  const entries = data?.results || data || [];

  return (
    <AdminPageLayout>
      <Box maxWidth={800} mx="auto">
        {/* Back button */}
        <Box
          component={RouterLink}
          to="/c3ds-admin"
          sx={{
            display: 'inline-flex', alignItems: 'center', gap: 0.5, mb: 2,
            color: '#90a4ae', fontFamily: 'monospace', fontSize: '0.75rem',
            textDecoration: 'none', letterSpacing: 1,
            '&:hover': { color: '#00ff41' },
          }}
        >
          <ArrowBack sx={{ fontSize: 16 }} /> BACK TO ADMIN
        </Box>

        {/* Title */}
        <Stack direction="row" spacing={1} alignItems="center" mb={3}>
          <History sx={{ color: '#00ff41', fontSize: 20 }} />
          <Typography sx={{ color: '#e0e0e0', fontFamily: 'monospace', fontWeight: 700, fontSize: '1.1rem', letterSpacing: 1 }}>
            DEVICE AUDIT TRAIL
          </Typography>
        </Stack>

        {/* Filter */}
        <Box sx={{ p: 2, mb: 3, bgcolor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)' }}>
          <Typography sx={{ color: '#00ff41', fontFamily: 'monospace', fontSize: '0.65rem', letterSpacing: 2, display: 'block', mb: 1 }}>
            FILTER
          </Typography>
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <Select value={eventTypeFilter} onChange={e => setEventTypeFilter(e.target.value)} displayEmpty sx={darkSelect}>
              <MenuItem value="" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>All events</MenuItem>
              {Object.entries(EVENT_TYPE_LABEL).map(([k, v]) => (
                <MenuItem key={k} value={k} sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{v}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4 }}>
            <CircularProgress size={24} sx={{ color: '#00ff41' }} />
          </Box>
        )}
        {isError && (
          <Typography sx={{ color: '#f44336', fontFamily: 'monospace', fontSize: '0.8rem' }}>
            Failed to load audit trail.
          </Typography>
        )}
        {!isLoading && entries.length === 0 && (
          <Typography sx={{ color: '#546e7a', fontFamily: 'monospace', fontSize: '0.8rem' }}>
            No audit entries found.
          </Typography>
        )}

        <Stack spacing={1}>
          {entries.map((entry) => {
            const color = EVENT_TYPE_COLOR[entry.event_type] || '#78909c';
            return (
              <Box
                key={entry.id}
                sx={{
                  p: 2,
                  bgcolor: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderLeft: `3px solid ${color}`,
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center" mb={0.5} flexWrap="wrap">
                  <Box sx={{ px: 0.75, py: 0.25, bgcolor: `${color}22`, border: `1px solid ${color}` }}>
                    <Typography sx={{ color, fontFamily: 'monospace', fontSize: '0.65rem', letterSpacing: 1 }}>
                      {EVENT_TYPE_LABEL[entry.event_type] || entry.event_type}
                    </Typography>
                  </Box>
                  <Typography sx={{ color: '#78909c', fontFamily: 'monospace', fontSize: '0.7rem' }}>
                    {new Date(entry.triggered_at).toLocaleString()}
                  </Typography>
                  <Typography sx={{ color: '#546e7a', fontFamily: 'monospace', fontSize: '0.7rem' }}>
                    {entry.triggered_by_username ? `· ${entry.triggered_by_username}` : '· System'}
                  </Typography>
                </Stack>
                <Typography sx={{ color: '#e0e0e0', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                  {entry.description}
                </Typography>
                {Object.keys(entry.metadata || {}).length > 0 && (
                  <Typography
                    component="pre"
                    sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', mt: 0.5, color: '#78909c', fontSize: '0.7rem' }}
                  >
                    {JSON.stringify(entry.metadata, null, 2)}
                  </Typography>
                )}
              </Box>
            );
          })}
        </Stack>
      </Box>
    </AdminPageLayout>
  );
}
