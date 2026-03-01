import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Typography, Stack, CircularProgress, MenuItem, Select,
  FormControl, InputLabel,
} from '@mui/material';
import { ArrowBack, Send } from '@mui/icons-material';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import AdminPageLayout from '../components/AdminPageLayout';
import { adminAPI } from '../api/client';

// ─── constants ───────────────────────────────────────────────────────────────

const ACTIONS = ['SET_INTERVAL', 'SET_THRESHOLD', 'REBOOT'];

const STATUS_COLORS = {
  PENDING:      '#ff9800',
  DELIVERED:    '#29b6f6',
  ACKNOWLEDGED: '#00e676',
  EXPIRED:      '#546e7a',
};

const PARAM_FIELDS = {
  SET_INTERVAL:  [{ key: 'seconds', label: 'Seconds', type: 'number', min: 1 }],
  SET_THRESHOLD: [{ key: 'cm',      label: 'Distance (cm)', type: 'number', min: 1 }],
  REBOOT:        [],
};

// ─── styles ──────────────────────────────────────────────────────────────────

const mono = { fontFamily: 'monospace' };

const inputStyle = {
  background: 'rgba(255,255,255,0.06)', color: '#e0e0e0',
  border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4,
  padding: '6px 8px', fontSize: '0.8rem', fontFamily: 'monospace',
  colorScheme: 'dark', width: '100%', boxSizing: 'border-box',
};

const selectSx = {
  color: '#e0e0e0', fontFamily: 'monospace', fontSize: '0.8rem',
  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.15)' },
  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#00ff41' },
  '& .MuiSvgIcon-root': { color: '#90a4ae' },
};

const labelSx = {
  color: '#90a4ae', fontFamily: 'monospace', fontSize: '0.75rem',
  '&.Mui-focused': { color: '#00ff41' },
};

// ─── StatusChip ──────────────────────────────────────────────────────────────

function StatusChip({ value }) {
  return (
    <Box sx={{
      display: 'inline-block', px: 0.75, py: 0.25,
      border: `1px solid ${STATUS_COLORS[value] || '#546e7a'}`,
      color: STATUS_COLORS[value] || '#546e7a',
      fontFamily: 'monospace', fontSize: '0.65rem', letterSpacing: 1,
    }}>
      {value}
    </Box>
  );
}

// ─── DispatchPanel ───────────────────────────────────────────────────────────

function DispatchPanel({ devices, initialDeviceId = '', onDispatched }) {
  const [deviceId, setDeviceId] = useState(initialDeviceId);
  const [action, setAction]     = useState('SET_INTERVAL');
  const [params, setParams]     = useState({});
  const [expiresIn, setExpiresIn] = useState('');
  const [error, setError]       = useState('');

  const mutation = useMutation({
    mutationFn: () => adminAPI.dispatchCommand(deviceId, {
      action,
      params,
      ...(expiresIn ? { expires_in_minutes: parseInt(expiresIn, 10) } : {}),
    }),
    onSuccess: () => {
      setError('');
      onDispatched();
    },
    onError: (err) => {
      setError(err.response?.data?.error || 'Dispatch failed.');
    },
  });

  const fields = PARAM_FIELDS[action] || [];

  function handleParamChange(key, value) {
    setParams(p => ({ ...p, [key]: value === '' ? '' : Number(value) }));
  }

  function handleActionChange(a) {
    setAction(a);
    setParams({});
  }

  function handleSubmit() {
    if (!deviceId) { setError('Select a device.'); return; }
    // Validate required params
    for (const f of fields) {
      if (params[f.key] === '' || params[f.key] === undefined) {
        setError(`${f.label} is required.`); return;
      }
    }
    setError('');
    mutation.mutate();
  }

  return (
    <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)' }}>
      <Typography sx={{ ...mono, color: '#00ff41', fontSize: '0.65rem', letterSpacing: 2, mb: 1.5 }}>
        DISPATCH COMMAND
      </Typography>

      <Stack spacing={1.5}>
        {/* Device selector */}
        <FormControl size="small" fullWidth>
          <InputLabel sx={labelSx}>Device</InputLabel>
          <Select value={deviceId} onChange={e => setDeviceId(e.target.value)} label="Device" sx={selectSx}>
            {devices.map(d => (
              <MenuItem key={d.id} value={d.id} sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                {d.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Action selector */}
        <FormControl size="small" fullWidth>
          <InputLabel sx={labelSx}>Action</InputLabel>
          <Select value={action} onChange={e => handleActionChange(e.target.value)} label="Action" sx={selectSx}>
            {ACTIONS.map(a => (
              <MenuItem key={a} value={a} sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{a}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Dynamic param fields */}
        {fields.map(f => (
          <Box key={f.key}>
            <Typography sx={{ ...mono, color: '#90a4ae', fontSize: '0.7rem', mb: 0.5 }}>{f.label.toUpperCase()}</Typography>
            <Box
              component="input"
              type={f.type}
              min={f.min}
              value={params[f.key] ?? ''}
              onChange={e => handleParamChange(f.key, e.target.value)}
              placeholder={f.label}
              style={inputStyle}
            />
          </Box>
        ))}

        {/* Optional expiry */}
        <Box>
          <Typography sx={{ ...mono, color: '#90a4ae', fontSize: '0.7rem', mb: 0.5 }}>EXPIRES IN (MINUTES, OPTIONAL)</Typography>
          <Box
            component="input"
            type="number"
            min={1}
            value={expiresIn}
            onChange={e => setExpiresIn(e.target.value)}
            placeholder="Never"
            style={inputStyle}
          />
        </Box>

        {error && (
          <Typography sx={{ ...mono, color: '#f44336', fontSize: '0.75rem' }}>{error}</Typography>
        )}

        <Box
          component="button"
          onClick={handleSubmit}
          disabled={mutation.isPending}
          sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5,
            px: 2, py: 0.75, bgcolor: 'transparent', cursor: 'pointer',
            border: '1px solid #00ff41', color: '#00ff41',
            fontFamily: 'monospace', fontSize: '0.75rem', letterSpacing: 1,
            '&:hover': { bgcolor: 'rgba(0,255,65,0.08)' },
            '&:disabled': { opacity: 0.4, cursor: 'default' },
          }}
        >
          {mutation.isPending
            ? <CircularProgress size={14} sx={{ color: '#00ff41' }} />
            : <><Send sx={{ fontSize: 14 }} /> DISPATCH</>
          }
        </Box>

        {mutation.isSuccess && (
          <Typography sx={{ ...mono, color: '#00e676', fontSize: '0.75rem' }}>
            Command dispatched.
          </Typography>
        )}
      </Stack>
    </Box>
  );
}

// ─── CommandTable ─────────────────────────────────────────────────────────────

function CommandTable({ commands }) {
  if (!commands.length) {
    return (
      <Typography sx={{ ...mono, color: '#546e7a', fontSize: '0.8rem' }}>
        No commands found.
      </Typography>
    );
  }

  const cols = ['DEVICE', 'ACTION', 'PARAMS', 'STATUS', 'ISSUED', 'DELIVERED', 'ACKNOWLEDGED'];

  return (
    <Box sx={{ overflowX: 'auto' }}>
      <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
        <Box component="thead">
          <Box component="tr">
            {cols.map(c => (
              <Box component="th" key={c} sx={{
                ...mono, color: '#546e7a', fontSize: '0.6rem', letterSpacing: 1,
                textAlign: 'left', pb: 0.75, pr: 2, borderBottom: '1px solid rgba(255,255,255,0.08)',
              }}>
                {c}
              </Box>
            ))}
          </Box>
        </Box>
        <Box component="tbody">
          {commands.map(cmd => (
            <Box component="tr" key={cmd.id} sx={{ '&:hover td': { bgcolor: 'rgba(255,255,255,0.02)' } }}>
              <Box component="td" sx={{ ...mono, color: '#e0e0e0', fontSize: '0.75rem', py: 0.75, pr: 2 }}>
                {cmd.device_name || cmd.device}
              </Box>
              <Box component="td" sx={{ ...mono, color: '#90caf9', fontSize: '0.75rem', py: 0.75, pr: 2 }}>
                {cmd.action}
              </Box>
              <Box component="td" sx={{ ...mono, color: '#90a4ae', fontSize: '0.7rem', py: 0.75, pr: 2 }}>
                {JSON.stringify(cmd.params)}
              </Box>
              <Box component="td" sx={{ py: 0.75, pr: 2 }}>
                <StatusChip value={cmd.status} />
              </Box>
              <Box component="td" sx={{ ...mono, color: '#546e7a', fontSize: '0.7rem', py: 0.75, pr: 2 }}>
                {cmd.created_at ? new Date(cmd.created_at).toLocaleString() : '—'}
              </Box>
              <Box component="td" sx={{ ...mono, color: '#546e7a', fontSize: '0.7rem', py: 0.75, pr: 2 }}>
                {cmd.delivered_at ? new Date(cmd.delivered_at).toLocaleString() : '—'}
              </Box>
              <Box component="td" sx={{ ...mono, color: '#546e7a', fontSize: '0.7rem', py: 0.75 }}>
                {cmd.acknowledged_at ? new Date(cmd.acknowledged_at).toLocaleString() : '—'}
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function AdminCommandQueue() {
  const [searchParams] = useSearchParams();
  const initialDeviceId = searchParams.get('device_id') || '';

  const [statusFilter, setStatusFilter] = useState('');
  const queryClient = useQueryClient();

  const { data: devicesData } = useQuery({
    queryKey: ['admin-devices'],
    queryFn: () => adminAPI.getAllDevices().then(r => r.data),
  });
  const devices = devicesData || [];

  const { data: commands, isLoading, isError, refetch } = useQuery({
    queryKey: ['command-queue', statusFilter],
    queryFn: () => adminAPI.getCommandQueue(statusFilter ? { status: statusFilter } : {}).then(r => r.data),
    refetchInterval: 10000,
  });

  function handleDispatched() {
    queryClient.invalidateQueries({ queryKey: ['command-queue'] });
    setTimeout(() => refetch(), 500);
  }

  return (
    <AdminPageLayout>
      {/* Top bar */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
        <Box
          component={RouterLink}
          to="/c3ds-admin"
          sx={{
            display: 'inline-flex', alignItems: 'center', gap: 0.5,
            color: '#90a4ae', fontFamily: 'monospace', fontSize: '0.75rem',
            textDecoration: 'none', letterSpacing: 1,
            '&:hover': { color: '#00ff41' },
          }}
        >
          <ArrowBack sx={{ fontSize: 16 }} /> BACK
        </Box>
        <Typography sx={{ color: '#546e7a', fontFamily: 'monospace', fontSize: '0.75rem' }}>/</Typography>
        <Typography sx={{ color: '#e0e0e0', fontFamily: 'monospace', fontWeight: 700, fontSize: '0.9rem', letterSpacing: 1 }}>
          COMMAND QUEUE
        </Typography>
      </Box>

      {/* Two-column layout */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>

        {/* Left: dispatch panel */}
        <Box sx={{ width: 300, flexShrink: 0 }}>
          <DispatchPanel devices={devices} initialDeviceId={initialDeviceId} onDispatched={handleDispatched} />
        </Box>

        {/* Right: queue table */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {/* Filter bar */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
            <Typography sx={{ ...mono, color: '#00ff41', fontSize: '0.65rem', letterSpacing: 2 }}>
              ALL COMMANDS
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {['', 'PENDING', 'DELIVERED', 'ACKNOWLEDGED', 'EXPIRED'].map(s => (
                <Box
                  key={s}
                  component="button"
                  onClick={() => setStatusFilter(s)}
                  sx={{
                    px: 1, py: 0.25, bgcolor: 'transparent', cursor: 'pointer',
                    border: `1px solid ${statusFilter === s ? '#00ff41' : 'rgba(255,255,255,0.15)'}`,
                    color: statusFilter === s ? '#00ff41' : '#90a4ae',
                    fontFamily: 'monospace', fontSize: '0.65rem', letterSpacing: 1,
                    '&:hover': { borderColor: '#00ff41', color: '#00ff41' },
                  }}
                >
                  {s || 'ALL'}
                </Box>
              ))}
            </Box>
            {isLoading && <CircularProgress size={14} sx={{ color: '#00ff41' }} />}
          </Box>

          <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)' }}>
            {isError && (
              <Typography sx={{ ...mono, color: '#f44336', fontSize: '0.8rem' }}>
                Failed to load command queue.
              </Typography>
            )}
            {!isLoading && !isError && (
              <CommandTable commands={commands || []} />
            )}
          </Box>
        </Box>
      </Box>
    </AdminPageLayout>
  );
}
