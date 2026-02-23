import { useParams, Link as RouterLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Typography, Button, Stack, Paper, Chip, CircularProgress,
  Alert, Select, MenuItem, FormControl, InputLabel, Divider,
} from '@mui/material';
import { ArrowBack, History } from '@mui/icons-material';
import { useState } from 'react';
import { BaseLayout } from '../components/BaseLayout';
import { adminAPI } from '../api/client';

const EVENT_TYPE_COLOR = {
  DEVICE_REGISTERED: 'primary',
  STATUS_CHANGED: 'warning',
  CERTIFICATE_GENERATED: 'info',
  CERTIFICATE_DOWNLOADED: 'default',
  ANOMALY_RAISED: 'error',
  ANOMALY_RESOLVED: 'success',
  DEVICE_UPDATED: 'default',
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

export default function AdminAuditTrail() {
  const { deviceId } = useParams();
  const [eventTypeFilter, setEventTypeFilter] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['audit-trail', deviceId, eventTypeFilter],
    queryFn: () => adminAPI.getAuditTrail(deviceId, eventTypeFilter ? { event_type: eventTypeFilter } : {}).then(r => r.data),
  });

  const entries = data?.results || data || [];

  return (
    <BaseLayout>
      <Box p={3} maxWidth={800} mx="auto">
        <Button startIcon={<ArrowBack />} component={RouterLink} to="/c3ds-admin" sx={{ mb: 2 }}>
          Back to Admin
        </Button>

        <Stack direction="row" spacing={1} alignItems="center" mb={3}>
          <History color="primary" />
          <Typography variant="h5" fontWeight={700}>Device Audit Trail</Typography>
        </Stack>

        {/* Filter */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel>Filter by event type</InputLabel>
            <Select
              value={eventTypeFilter}
              label="Filter by event type"
              onChange={e => setEventTypeFilter(e.target.value)}
            >
              <MenuItem value="">All events</MenuItem>
              {Object.entries(EVENT_TYPE_LABEL).map(([k, v]) => (
                <MenuItem key={k} value={k}>{v}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Paper>

        {isLoading && <CircularProgress />}
        {isError && <Alert severity="error">Failed to load audit trail.</Alert>}
        {!isLoading && entries.length === 0 && (
          <Alert severity="info">No audit entries found.</Alert>
        )}

        <Stack spacing={1}>
          {entries.map((entry, i) => (
            <Paper key={entry.id} variant="outlined" sx={{ p: 2 }}>
              <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                <Chip
                  label={EVENT_TYPE_LABEL[entry.event_type] || entry.event_type}
                  color={EVENT_TYPE_COLOR[entry.event_type] || 'default'}
                  size="small"
                />
                <Typography variant="caption" color="text.secondary">
                  {new Date(entry.triggered_at).toLocaleString()}
                </Typography>
                {entry.triggered_by_username ? (
                  <Typography variant="caption" color="text.secondary">
                    · {entry.triggered_by_username}
                  </Typography>
                ) : (
                  <Typography variant="caption" color="text.secondary">· System</Typography>
                )}
              </Stack>
              <Typography variant="body2">{entry.description}</Typography>
              {Object.keys(entry.metadata || {}).length > 0 && (
                <Typography
                  variant="caption"
                  component="pre"
                  sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', mt: 0.5, color: 'text.secondary' }}
                >
                  {JSON.stringify(entry.metadata, null, 2)}
                </Typography>
              )}
            </Paper>
          ))}
        </Stack>
      </Box>
    </BaseLayout>
  );
}
