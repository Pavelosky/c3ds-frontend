import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Typography, Card, CardHeader,
  Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, FormControl,
  Select, MenuItem, CircularProgress, Divider, Tooltip,
  IconButton, Collapse, Stack,
} from '@mui/material';
import {
  ExpandMore, ExpandLess, CheckCircle, Warning,
  Error as ErrorIcon, Info, Shield,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { Navigation } from '../components/Navigation';
import AdminDeviceSidebar from '../components/AdminDeviceSidebar';
import MessageRateGraph from '../components/MessageRateGraph';
import ServerLoadPanel from '../components/ServerLoadPanel';
import { adminAPI } from '../api/client';


// ── Severity / type helpers ────────────────────────────────────────────────────

const SEVERITY_CHIP_COLOR = {
  CRITICAL: '#f44336',
  HIGH: '#ff5722',
  MEDIUM: '#ff9800',
  LOW: '#2196f3',
};

const FLAG_TYPE_LABEL = {
  DETECTION_RATE_SPIKE: 'Rate Spike',
  SILENT_DEVICE: 'Silent Device',
  AUTH_UNKNOWN_IP: 'Unknown IP',
  AUTH_MALFORMED_MESSAGE: 'Malformed Msg',
};

const INCIDENT_STATUS_COLOR = {
  OPEN: '#f44336',
  INVESTIGATING: '#ff9800',
  RESOLVED: '#00ff41',
  ESCALATED: '#9c27b0',
};

// Shared SCADA card style
const scadaCard = {
  bgcolor: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: 0,
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
};

const scadaHeader = {
  pb: 0,
  pt: 1,
  px: 1.5,
  '& .MuiCardHeader-title': { color: '#e0e0e0', fontFamily: 'monospace', fontSize: '0.7rem', letterSpacing: 1 },
  '& .MuiCardHeader-action': { mt: 0, mr: 0 },
};


// ── Summary strip ──────────────────────────────────────────────────────────────

function SummaryStrip({ onFilterSelect }) {
  const { data } = useQuery({
    queryKey: ['anomaly-summary'],
    queryFn: () => adminAPI.getSummary().then(r => r.data),
    refetchInterval: 30000,
  });

  const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
  (data || []).forEach(r => { counts[r.severity] = (counts[r.severity] || 0) + r.count; });

  return (
    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
      {Object.entries(counts).map(([sev, count]) => (
        <Box
          key={sev}
          onClick={() => onFilterSelect({ severity: sev })}
          sx={{
            cursor: 'pointer',
            px: 1.5, py: 0.25,
            border: `1px solid ${SEVERITY_CHIP_COLOR[sev]}`,
            bgcolor: count > 0 ? `${SEVERITY_CHIP_COLOR[sev]}22` : 'transparent',
            display: 'flex', alignItems: 'center', gap: 0.75,
            '&:hover': { bgcolor: `${SEVERITY_CHIP_COLOR[sev]}33` },
          }}
        >
          <Typography variant="h6" sx={{ color: SEVERITY_CHIP_COLOR[sev], fontFamily: 'monospace', fontWeight: 700, lineHeight: 1, fontSize: '1rem' }}>
            {count}
          </Typography>
          <Typography variant="caption" sx={{ color: '#90a4ae', fontFamily: 'monospace', fontSize: '0.6rem' }}>
            {sev}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}


// ── Flag row ───────────────────────────────────────────────────────────────────

function FlagRow({ flag, onResolve, resolving }) {
  const [open, setOpen] = useState(false);
  const color = SEVERITY_CHIP_COLOR[flag.severity] || '#90a4ae';

  return (
    <>
      <TableRow hover sx={{ '& td': { borderColor: 'rgba(255,255,255,0.06)', py: 0.5 } }}>
        <TableCell sx={{ width: 8, p: '0 4px' }}>
          <Box sx={{ width: 3, height: 16, bgcolor: color }} />
        </TableCell>
        <TableCell>
          <Typography variant="caption" sx={{ color, fontFamily: 'monospace', fontSize: '0.65rem' }}>{flag.severity}</Typography>
        </TableCell>
        <TableCell>
          <Typography variant="caption" sx={{ color: '#e0e0e0', fontFamily: 'monospace', fontSize: '0.7rem' }}>
            {FLAG_TYPE_LABEL[flag.flag_type] || flag.flag_type}
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="caption" sx={{ color: '#90a4ae', fontFamily: 'monospace', fontSize: '0.7rem' }}>
            {flag.device_name || '—'}
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="caption" sx={{ color: '#546e7a', fontFamily: 'monospace', fontSize: '0.65rem' }}>
            {new Date(flag.raised_at).toLocaleTimeString()}
          </Typography>
        </TableCell>
        <TableCell>
          <Stack direction="row" spacing={0.25}>
            <Tooltip title="Detail">
              <IconButton size="small" onClick={() => setOpen(o => !o)} sx={{ color: '#546e7a', p: 0.25 }}>
                {open ? <ExpandLess sx={{ fontSize: 14 }} /> : <ExpandMore sx={{ fontSize: 14 }} />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Resolve">
              <IconButton size="small" onClick={() => onResolve(flag.id)} disabled={resolving} sx={{ color: '#00ff41', p: 0.25 }}>
                <CheckCircle sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
          </Stack>
        </TableCell>
      </TableRow>
      <TableRow sx={{ '& td': { py: 0, borderColor: 'rgba(255,255,255,0.06)' } }}>
        <TableCell colSpan={6} sx={{ py: 0 }}>
          <Collapse in={open}>
            <Box sx={{ p: 1, bgcolor: 'rgba(0,0,0,0.3)' }}>
              <Typography variant="caption" sx={{ color: '#90a4ae', fontFamily: 'monospace', fontSize: '0.65rem', display: 'block' }}>
                {flag.explanation}
              </Typography>
              {Object.keys(flag.detail || {}).length > 0 && (
                <Typography variant="caption" component="pre" sx={{ color: '#546e7a', fontFamily: 'monospace', fontSize: '0.6rem', whiteSpace: 'pre-wrap', mt: 0.5 }}>
                  {JSON.stringify(flag.detail, null, 2)}
                </Typography>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}


// ── Anomaly flag list ──────────────────────────────────────────────────────────

function AnomalyFlagList({ deviceFilter, initialFilter, onClearDevice }) {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState(initialFilter || {});
  const [showResolved, setShowResolved] = useState(false);

  const queryFilters = {
    ...filters,
    resolved: showResolved ? 'true' : 'false',
    ...(deviceFilter ? { device: deviceFilter.id } : {}),
  };

  const { data, isLoading } = useQuery({
    queryKey: ['anomaly-flags', queryFilters],
    queryFn: () => adminAPI.getFlags(queryFilters).then(r => r.data),
    refetchInterval: 30000,
  });

  const resolveMutation = useMutation({
    mutationFn: (id) => adminAPI.resolveFlag(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anomaly-flags'] });
      queryClient.invalidateQueries({ queryKey: ['anomaly-summary'] });
    },
  });

  const flags = data?.results || data || [];

  return (
    <Card sx={scadaCard}>
      <CardHeader
        sx={scadaHeader}
        title={deviceFilter ? `FLAGS — ${deviceFilter.name}` : 'ANOMALY FLAGS'}
        action={
          <Stack direction="row" spacing={0.5} alignItems="center">
            {deviceFilter && (
              <Button size="small" onClick={onClearDevice}
                sx={{ color: '#f44336', fontSize: '0.6rem', fontFamily: 'monospace', minWidth: 0, p: '1px 4px' }}>
                ✕
              </Button>
            )}
            <FormControl size="small">
              <Select
                value={filters.flag_type || ''}
                onChange={e => setFilters(f => ({ ...f, flag_type: e.target.value || undefined }))}
                displayEmpty
                sx={{ color: '#90a4ae', fontSize: '0.65rem', fontFamily: 'monospace', height: 22,
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.15)' },
                  '& .MuiSvgIcon-root': { color: '#546e7a', fontSize: 14 } }}
              >
                <MenuItem value="" sx={{ fontSize: '0.7rem', fontFamily: 'monospace' }}>All types</MenuItem>
                {Object.entries(FLAG_TYPE_LABEL).map(([k, v]) => (
                  <MenuItem key={k} value={k} sx={{ fontSize: '0.7rem', fontFamily: 'monospace' }}>{v}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button size="small" onClick={() => setShowResolved(v => !v)}
              sx={{ color: showResolved ? '#00ff41' : '#546e7a', fontSize: '0.6rem', fontFamily: 'monospace', minWidth: 0, p: '1px 6px',
                border: '1px solid', borderColor: showResolved ? '#00ff41' : 'rgba(255,255,255,0.12)' }}>
              {showResolved ? 'RESOLVED' : 'ACTIVE'}
            </Button>
          </Stack>
        }
      />
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />
      <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
            <CircularProgress size={20} sx={{ color: '#00ff41' }} />
          </Box>
        ) : flags.length === 0 ? (
          <Box sx={{ p: 2 }}>
            <Typography variant="caption" sx={{ color: '#546e7a', fontFamily: 'monospace' }}>
              {showResolved ? 'No resolved flags.' : 'No active flags. Network nominal.'}
            </Typography>
          </Box>
        ) : (
          <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {['', 'SEV', 'TYPE', 'DEVICE', 'TIME', ''].map((h, i) => (
                    <TableCell key={i} sx={{ bgcolor: '#0d1226', color: '#546e7a', fontFamily: 'monospace', fontSize: '0.6rem', letterSpacing: 1, borderColor: 'rgba(255,255,255,0.08)', py: 0.5, px: h === '' ? 0.5 : 1 }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {flags.map(flag => (
                  <FlagRow
                    key={flag.id}
                    flag={flag}
                    onResolve={(id) => resolveMutation.mutate(id)}
                    resolving={resolveMutation.isPending}
                  />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Card>
  );
}


// ── Incident list ──────────────────────────────────────────────────────────────

function IncidentList() {
  const { data, isLoading } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => adminAPI.getIncidents().then(r => r.data),
    refetchInterval: 60000,
  });

  const incidents = data?.results || data || [];

  return (
    <Card sx={scadaCard}>
      <CardHeader
        sx={scadaHeader}
        title="INCIDENTS"
        action={
          <Button size="small" component={RouterLink} to="/c3ds-admin/incidents/new"
            sx={{ color: '#00ff41', fontSize: '0.6rem', fontFamily: 'monospace', border: '1px solid #00ff41', p: '1px 8px', borderRadius: 0 }}>
            + NEW
          </Button>
        }
      />
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />
      <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
            <CircularProgress size={20} sx={{ color: '#00ff41' }} />
          </Box>
        ) : incidents.length === 0 ? (
          <Box sx={{ p: 2 }}>
            <Typography variant="caption" sx={{ color: '#546e7a', fontFamily: 'monospace' }}>No incidents recorded.</Typography>
          </Box>
        ) : (
          <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {['TITLE', 'STATUS', 'SEV', ''].map(h => (
                    <TableCell key={h} sx={{ bgcolor: '#0d1226', color: '#546e7a', fontFamily: 'monospace', fontSize: '0.6rem', letterSpacing: 1, borderColor: 'rgba(255,255,255,0.08)', py: 0.5 }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {incidents.map(inc => (
                  <TableRow key={inc.id} hover sx={{ '& td': { borderColor: 'rgba(255,255,255,0.06)', py: 0.5 } }}>
                    <TableCell>
                      <Typography variant="caption" sx={{ color: '#e0e0e0', fontFamily: 'monospace', fontSize: '0.7rem' }}>
                        {inc.title}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ color: INCIDENT_STATUS_COLOR[inc.incident_status] || '#90a4ae', fontFamily: 'monospace', fontSize: '0.65rem' }}>
                        {inc.incident_status}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ color: SEVERITY_CHIP_COLOR[inc.severity] || '#90a4ae', fontFamily: 'monospace', fontSize: '0.65rem' }}>
                        {inc.severity}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Button size="small" component={RouterLink} to={`/c3ds-admin/incidents/${inc.id}`}
                        sx={{ color: '#546e7a', fontSize: '0.6rem', fontFamily: 'monospace', p: '1px 4px', minWidth: 0, '&:hover': { color: '#00ff41' } }}>
                        VIEW
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Card>
  );
}


// ── Main SCADA Admin Dashboard ─────────────────────────────────────────────────

export default function AdminDashboard() {
  const [deviceFilter, setDeviceFilter] = useState(null);
  const [flagFilter, setFlagFilter] = useState(null);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', bgcolor: '#0a0e27' }}>
      <Navigation />

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'row', overflow: 'hidden', minHeight: 0 }}>

        {/* Left: Device Sidebar */}
        <AdminDeviceSidebar onFilterFlags={(id, name) => setDeviceFilter({ id, name })} />

        {/* Right: Main Panel */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', p: 1, gap: 1, minWidth: 0 }}>

          {/* Top bar */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0, flexWrap: 'wrap' }}>
            <Stack direction="row" alignItems="center" spacing={1}>
            </Stack>
            <Box sx={{display: 'flex', gap: 1 }}>
              {[
                { label: 'REPLAY', to: '/c3ds-admin/replay' },
                { label: 'HEATMAP', to: '/c3ds-admin/heatmap' },
                { label: 'COMPARE', to: '/c3ds-admin/compare' },
              ].map(({ label, to }) => (
                <Button key={label} size="small" component={RouterLink} to={to}
                  sx={{
                    color: '#e0e0e0', // Light gray text for better contrast on dark backgrounds
                    fontSize: '0.7rem',
                    fontFamily: 'monospace',
                    border: '1px solid rgba(255, 255, 255, 0.3)', // Brighter border for visibility
                    p: '4px 10px',
                    borderRadius: 0,
                    backgroundColor: 'rgba(255, 255, 255, 0.05)', // Background for better visibility
                    '&:hover': {
                      color: '#00ff41', // Bright green text on hover
                      borderColor: '#00ff41', // Bright green border on hover
                      backgroundColor: 'rgba(0, 255, 65, 0.1)', // Subtle green background on hover
                    },
                  }}>
                  {label}
                </Button>
              ))}
            </Box>
            <SummaryStrip onFilterSelect={setFlagFilter} />
          </Box>

          {/* Middle row: graph + server load */}
          <Box sx={{ display: 'flex', gap: 1, flexShrink: 0, height: '35%', minHeight: 0 }}>
            <Box sx={{ flex: 1, ...scadaCard, p: 1.5, minWidth: 0 }}>
              <MessageRateGraph />
            </Box>
            <Box sx={{ width: 190, flexShrink: 0, ...scadaCard, p: 1.5 }}>
              <ServerLoadPanel />
            </Box>
          </Box>

          {/* Bottom row: flags + incidents */}
          <Box sx={{ flex: 1, display: 'flex', gap: 1, minHeight: 0, overflow: 'hidden' }}>
            <Box sx={{ flex: 7, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              <AnomalyFlagList
                deviceFilter={deviceFilter}
                initialFilter={flagFilter}
                onClearDevice={() => setDeviceFilter(null)}
              />
            </Box>
            <Box sx={{ flex: 5, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              <IncidentList />
            </Box>
          </Box>

        </Box>
      </Box>
    </Box>
  );
}
