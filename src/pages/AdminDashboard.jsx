import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Typography, Grid, Card, CardContent, CardHeader,
  Chip, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Select, MenuItem, FormControl,
  InputLabel, Alert, CircularProgress, Divider, Tooltip,
  IconButton, Collapse, Stack,
} from '@mui/material';
import {
  ExpandMore, ExpandLess, CheckCircle, Warning,
  Error as ErrorIcon, Info, Shield,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { BaseLayout } from '../components/BaseLayout';
import { adminAPI } from '../api/client';


// ── Severity colours ──────────────────────────────────────────────────────────

const SEVERITY_COLOR = {
  CRITICAL: 'error',
  HIGH: 'error',
  MEDIUM: 'warning',
  LOW: 'info',
};

const SEVERITY_ICON = {
  CRITICAL: <ErrorIcon fontSize="small" />,
  HIGH: <ErrorIcon fontSize="small" />,
  MEDIUM: <Warning fontSize="small" />,
  LOW: <Info fontSize="small" />,
};

const FLAG_TYPE_LABEL = {
  DETECTION_RATE_SPIKE: 'Detection Rate Spike',
  SILENT_DEVICE: 'Silent Device',
  AUTH_UNKNOWN_IP: 'Unknown IP Auth',
  AUTH_MALFORMED_MESSAGE: 'Malformed Message',
};

const INCIDENT_STATUS_COLOR = {
  OPEN: 'error',
  INVESTIGATING: 'warning',
  RESOLVED: 'success',
  ESCALATED: 'secondary',
};


// ── Anomaly Summary Cards (US-09) ─────────────────────────────────────────────

function AnomalySummaryCards({ onFilterSelect }) {
  const { data, isLoading } = useQuery({
    queryKey: ['anomaly-summary'],
    queryFn: () => adminAPI.getSummary().then(r => r.data),
    refetchInterval: 30000,
  });

  if (isLoading) return <CircularProgress size={24} />;
  if (!data?.length) {
    return (
      <Alert icon={<CheckCircle />} severity="success">
        No unresolved anomaly flags. Network is healthy.
      </Alert>
    );
  }

  return (
    <Grid container spacing={2}>
      {data.map((row) => (
        <Grid item xs={12} sm={6} md={3} key={`${row.flag_type}-${row.severity}`}>
          <Card
            sx={{ cursor: 'pointer', border: '1px solid', borderColor: `${SEVERITY_COLOR[row.severity]}.main` }}
            onClick={() => onFilterSelect({ flag_type: row.flag_type, severity: row.severity })}
          >
            <CardContent sx={{ pb: '12px !important' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h4" fontWeight={700} color={`${SEVERITY_COLOR[row.severity]}.main`}>
                  {row.count}
                </Typography>
                <Chip
                  label={row.severity}
                  color={SEVERITY_COLOR[row.severity]}
                  size="small"
                  icon={SEVERITY_ICON[row.severity]}
                />
              </Stack>
              <Typography variant="body2" color="text.secondary" mt={0.5}>
                {FLAG_TYPE_LABEL[row.flag_type] || row.flag_type}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}


// ── Flag Row (expandable) ─────────────────────────────────────────────────────

function FlagRow({ flag, onResolve, resolving }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TableRow hover>
        <TableCell>
          <Chip
            label={flag.severity}
            color={SEVERITY_COLOR[flag.severity] || 'default'}
            size="small"
          />
        </TableCell>
        <TableCell>{FLAG_TYPE_LABEL[flag.flag_type] || flag.flag_type}</TableCell>
        <TableCell>{flag.device_name || '—'}</TableCell>
        <TableCell>{new Date(flag.raised_at).toLocaleString()}</TableCell>
        <TableCell>
          <Stack direction="row" spacing={1}>
            <Tooltip title="Show detail">
              <IconButton size="small" onClick={() => setOpen(o => !o)}>
                {open ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Tooltip>
            <Button
              size="small"
              variant="outlined"
              color="success"
              startIcon={<CheckCircle />}
              onClick={() => onResolve(flag.id)}
              disabled={resolving}
            >
              Resolve
            </Button>
          </Stack>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={5} sx={{ py: 0 }}>
          <Collapse in={open}>
            <Box sx={{ p: 2, bgcolor: 'action.hover' }}>
              <Typography variant="body2" mb={1}>{flag.explanation}</Typography>
              {Object.keys(flag.detail || {}).length > 0 && (
                <Typography variant="caption" component="pre" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
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


// ── Anomaly Flag List (US-08) ─────────────────────────────────────────────────

function AnomalyFlagList({ initialFilter }) {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState(initialFilter || {});
  const [showResolved, setShowResolved] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['anomaly-flags', filters, showResolved],
    queryFn: () => adminAPI.getFlags({
      ...filters,
      resolved: showResolved ? 'true' : 'false',
    }).then(r => r.data),
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
    <Card>
      <CardHeader
        title="Anomaly Flags"
        subheader={showResolved ? 'Showing resolved flags' : 'Showing unresolved flags'}
        action={
          <Stack direction="row" spacing={1} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Type</InputLabel>
              <Select
                value={filters.flag_type || ''}
                label="Type"
                onChange={(e) => setFilters(f => ({ ...f, flag_type: e.target.value || undefined }))}
              >
                <MenuItem value="">All</MenuItem>
                {Object.entries(FLAG_TYPE_LABEL).map(([k, v]) => (
                  <MenuItem key={k} value={k}>{v}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Severity</InputLabel>
              <Select
                value={filters.severity || ''}
                label="Severity"
                onChange={(e) => setFilters(f => ({ ...f, severity: e.target.value || undefined }))}
              >
                <MenuItem value="">All</MenuItem>
                {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(s => (
                  <MenuItem key={s} value={s}>{s}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              size="small"
              variant={showResolved ? 'contained' : 'outlined'}
              onClick={() => setShowResolved(v => !v)}
            >
              {showResolved ? 'Hide Resolved' : 'Show Resolved'}
            </Button>
          </Stack>
        }
      />
      <Divider />
      {isLoading ? (
        <Box p={3} textAlign="center"><CircularProgress /></Box>
      ) : flags.length === 0 ? (
        <Box p={3}>
          <Alert severity="info">No flags match the current filters.</Alert>
        </Box>
      ) : (
        <TableContainer sx={{ maxHeight: 480 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Severity</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Device</TableCell>
                <TableCell>Raised</TableCell>
                <TableCell>Actions</TableCell>
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
    </Card>
  );
}


// ── Incident List (US-12 preview) ─────────────────────────────────────────────

function IncidentList() {
  const { data, isLoading } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => adminAPI.getIncidents().then(r => r.data),
  });

  const incidents = data?.results || data || [];

  return (
    <Card>
      <CardHeader
        title="Incidents"
        action={
          <Button
            size="small"
            variant="contained"
            component={RouterLink}
            to="/c3ds-admin/incidents/new"
          >
            New Incident
          </Button>
        }
      />
      <Divider />
      {isLoading ? (
        <Box p={3} textAlign="center"><CircularProgress /></Box>
      ) : incidents.length === 0 ? (
        <Box p={3}><Alert severity="info">No incidents recorded.</Alert></Box>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Severity</TableCell>
                <TableCell>Flags</TableCell>
                <TableCell>Created</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {incidents.map(inc => (
                <TableRow key={inc.id} hover>
                  <TableCell>{inc.title}</TableCell>
                  <TableCell>
                    <Chip
                      label={inc.incident_status}
                      color={INCIDENT_STATUS_COLOR[inc.incident_status] || 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip label={inc.severity} color={SEVERITY_COLOR[inc.severity] || 'default'} size="small" />
                  </TableCell>
                  <TableCell>{inc.flag_count}</TableCell>
                  <TableCell>{new Date(inc.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button size="small" component={RouterLink} to={`/c3ds-admin/incidents/${inc.id}`}>
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Card>
  );
}


// ── Main Admin Dashboard ──────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [flagFilter, setFlagFilter] = useState(null);

  return (
    <BaseLayout>
      <Box p={3}>
        <Stack direction="row" alignItems="center" spacing={1} mb={3}>
          <Shield color="primary" />
          <Typography variant="h5" fontWeight={700}>Admin Dashboard</Typography>
        </Stack>

        {/* Quick navigation to investigation tools */}
        <Stack direction="row" spacing={1} mb={3} flexWrap="wrap" useFlexGap>
          <Button variant="outlined" size="small" component={RouterLink} to="/c3ds-admin/replay">
            Event Replay
          </Button>
          <Button variant="outlined" size="small" component={RouterLink} to="/c3ds-admin/heatmap">
            Detection Heatmap
          </Button>
          <Button variant="outlined" size="small" component={RouterLink} to="/c3ds-admin/compare">
            Device Comparison
          </Button>
        </Stack>

        {/* US-09: Summary cards */}
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          UNRESOLVED ANOMALIES
        </Typography>
        <Box mb={3}>
          <AnomalySummaryCards onFilterSelect={setFlagFilter} />
        </Box>

        <Grid container spacing={3}>
          {/* US-08: Flag list */}
          <Grid item xs={12} lg={7}>
            <AnomalyFlagList initialFilter={flagFilter} />
          </Grid>

          {/* US-12: Incidents */}
          <Grid item xs={12} lg={5}>
            <IncidentList />
          </Grid>
        </Grid>
      </Box>
    </BaseLayout>
  );
}
