import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Typography, Stack, CircularProgress,
  MenuItem, Select, FormControl, InputLabel, Collapse,
} from '@mui/material';
import { ArrowBack, Add, ExpandMore, ExpandLess, Delete, PowerSettingsNew } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import AdminPageLayout from '../components/AdminPageLayout';
import { adminAPI } from '../api/client';

// ─── constants ───────────────────────────────────────────────────────────────

const CONDITION_TYPES = [
  { value: 'MESSAGE_RATE_HIGH',  label: 'Message rate HIGH',       hasWindow: true  },
  { value: 'MESSAGE_RATE_LOW',   label: 'Message rate LOW',        hasWindow: true  },
  { value: 'CERT_EXPIRY_SOON',   label: 'Certificate expiry soon', hasWindow: false },
  { value: 'NO_MESSAGES_EVER',   label: 'No messages ever',        hasWindow: false },
  { value: 'MESSAGE_TYPE_RATIO', label: 'Detection-type ratio %',  hasWindow: true  },
];

const CONDITION_THRESHOLD_LABEL = {
  MESSAGE_RATE_HIGH:  'Max messages in window',
  MESSAGE_RATE_LOW:   'Min messages in window',
  CERT_EXPIRY_SOON:   'Days before expiry',
  NO_MESSAGES_EVER:   'Days since registration',
  MESSAGE_TYPE_RATIO: 'Detection % threshold (0–100)',
};

const ACTION_TYPES = [
  { value: 'FLAG_ANOMALY',    label: 'Raise anomaly flag'    },
  { value: 'QUEUE_COMMAND',   label: 'Queue device command'  },
  { value: 'CHANGE_STATUS',   label: 'Change device status'  },
  { value: 'CREATE_INCIDENT', label: 'Open incident'         },
];

const SEVERITIES   = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const COMMANDS     = ['SET_INTERVAL', 'SET_THRESHOLD', 'REBOOT'];
const STATUSES     = ['ACTIVE', 'INACTIVE', 'REVOKED'];

const COMMAND_PARAMS = {
  SET_INTERVAL:  [{ key: 'seconds',  label: 'Seconds',       type: 'number', min: 1 }],
  SET_THRESHOLD: [{ key: 'cm',       label: 'Distance (cm)', type: 'number', min: 1 }],
  REBOOT:        [],
};

const STATUS_COLORS = {
  true:  '#00e676',
  false: '#546e7a',
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

// ─── CreatePolicyPanel ───────────────────────────────────────────────────────

function CreatePolicyPanel({ devices, deviceTypes, onCreated }) {
  const [name, setName]                   = useState('');
  const [description, setDescription]    = useState('');
  const [scopeMode, setScopeMode]         = useState('all');      // all | type | device
  const [scopeTypeId, setScopeTypeId]     = useState('');
  const [scopeDeviceId, setScopeDeviceId] = useState('');
  const [conditionType, setConditionType] = useState('MESSAGE_RATE_HIGH');
  const [threshold, setThreshold]         = useState('');
  const [windowMin, setWindowMin]         = useState(60);
  const [actionType, setActionType]       = useState('FLAG_ANOMALY');
  const [severity, setSeverity]           = useState('MEDIUM');
  const [actionCmd, setActionCmd]         = useState('SET_INTERVAL');
  const [cmdParams, setCmdParams]         = useState({});
  const [deviceStatus, setDeviceStatus]   = useState('INACTIVE');
  const [error, setError]                 = useState('');

  const condMeta = CONDITION_TYPES.find(c => c.value === conditionType);

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        name,
        description,
        condition_type: conditionType,
        threshold_value: parseFloat(threshold),
        window_minutes: condMeta.hasWindow ? parseInt(windowMin, 10) : 60,
        action_type: actionType,
        action_severity: severity,
        ...(actionType === 'QUEUE_COMMAND' && {
          action_command: actionCmd,
          action_command_params: cmdParams,
        }),
        ...(actionType === 'CHANGE_STATUS' && { action_device_status: deviceStatus }),
        ...(scopeMode === 'type'   && { applies_to_type:   scopeTypeId   }),
        ...(scopeMode === 'device' && { applies_to_device: scopeDeviceId }),
      };
      return adminAPI.createPolicy(payload);
    },
    onSuccess: () => {
      setError('');
      setName(''); setDescription(''); setThreshold('');
      onCreated();
    },
    onError: (err) => {
      const data = err.response?.data;
      setError(data ? JSON.stringify(data) : 'Create failed.');
    },
  });

  function handleSubmit() {
    if (!name.trim())          { setError('Name is required.');           return; }
    if (threshold === '')      { setError('Threshold value is required.'); return; }
    if (scopeMode === 'type'   && !scopeTypeId)   { setError('Select a device type.'); return; }
    if (scopeMode === 'device' && !scopeDeviceId) { setError('Select a device.');      return; }
    setError('');
    mutation.mutate();
  }

  function handleActionChange(a) {
    setActionType(a);
    setCmdParams({});
  }

  function handleCmdParamChange(key, val) {
    setCmdParams(p => ({ ...p, [key]: val === '' ? '' : Number(val) }));
  }

  const cmdParamFields = COMMAND_PARAMS[actionCmd] || [];

  return (
    <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)' }}>
      <Typography sx={{ ...mono, color: '#00ff41', fontSize: '0.65rem', letterSpacing: 2, mb: 1.5 }}>
        CREATE POLICY
      </Typography>

      <Stack spacing={1.5}>
        {/* Name */}
        <Box>
          <Typography sx={{ ...mono, color: '#90a4ae', fontSize: '0.7rem', mb: 0.5 }}>NAME</Typography>
          <Box component="input" value={name} onChange={e => setName(e.target.value)}
            placeholder="e.g. High-rate alert" style={inputStyle} />
        </Box>

        {/* Description */}
        <Box>
          <Typography sx={{ ...mono, color: '#90a4ae', fontSize: '0.7rem', mb: 0.5 }}>DESCRIPTION (OPTIONAL)</Typography>
          <Box component="textarea" value={description} onChange={e => setDescription(e.target.value)}
            placeholder="What does this policy do?" rows={2}
            style={{ ...inputStyle, resize: 'vertical' }} />
        </Box>

        {/* Scope */}
        <FormControl size="small" fullWidth>
          <InputLabel sx={labelSx}>Applies to</InputLabel>
          <Select value={scopeMode} onChange={e => setScopeMode(e.target.value)} label="Applies to" sx={selectSx}>
            <MenuItem value="all"    sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>All devices</MenuItem>
            <MenuItem value="type"   sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>Specific device type</MenuItem>
            <MenuItem value="device" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>Specific device</MenuItem>
          </Select>
        </FormControl>
        {scopeMode === 'type' && (
          <FormControl size="small" fullWidth>
            <InputLabel sx={labelSx}>Device type</InputLabel>
            <Select value={scopeTypeId} onChange={e => setScopeTypeId(e.target.value)} label="Device type" sx={selectSx}>
              {deviceTypes.map(t => (
                <MenuItem key={t.id} value={t.id} sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{t.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
        {scopeMode === 'device' && (
          <FormControl size="small" fullWidth>
            <InputLabel sx={labelSx}>Device</InputLabel>
            <Select value={scopeDeviceId} onChange={e => setScopeDeviceId(e.target.value)} label="Device" sx={selectSx}>
              {devices.map(d => (
                <MenuItem key={d.id} value={d.id} sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{d.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {/* Condition */}
        <FormControl size="small" fullWidth>
          <InputLabel sx={labelSx}>Condition</InputLabel>
          <Select value={conditionType} onChange={e => setConditionType(e.target.value)} label="Condition" sx={selectSx}>
            {CONDITION_TYPES.map(c => (
              <MenuItem key={c.value} value={c.value} sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{c.label}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box>
          <Typography sx={{ ...mono, color: '#90a4ae', fontSize: '0.7rem', mb: 0.5 }}>
            {(CONDITION_THRESHOLD_LABEL[conditionType] || 'THRESHOLD').toUpperCase()}
          </Typography>
          <Box component="input" type="number" min={0} value={threshold}
            onChange={e => setThreshold(e.target.value)} placeholder="0" style={inputStyle} />
        </Box>

        {condMeta?.hasWindow && (
          <Box>
            <Typography sx={{ ...mono, color: '#90a4ae', fontSize: '0.7rem', mb: 0.5 }}>WINDOW (MINUTES)</Typography>
            <Box component="input" type="number" min={1} value={windowMin}
              onChange={e => setWindowMin(e.target.value)} style={inputStyle} />
          </Box>
        )}

        {/* Action */}
        <FormControl size="small" fullWidth>
          <InputLabel sx={labelSx}>Action</InputLabel>
          <Select value={actionType} onChange={e => handleActionChange(e.target.value)} label="Action" sx={selectSx}>
            {ACTION_TYPES.map(a => (
              <MenuItem key={a.value} value={a.value} sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{a.label}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {(actionType === 'FLAG_ANOMALY' || actionType === 'CREATE_INCIDENT') && (
          <FormControl size="small" fullWidth>
            <InputLabel sx={labelSx}>Severity</InputLabel>
            <Select value={severity} onChange={e => setSeverity(e.target.value)} label="Severity" sx={selectSx}>
              {SEVERITIES.map(s => (
                <MenuItem key={s} value={s} sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{s}</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {actionType === 'QUEUE_COMMAND' && (
          <>
            <FormControl size="small" fullWidth>
              <InputLabel sx={labelSx}>Command</InputLabel>
              <Select value={actionCmd} onChange={e => { setActionCmd(e.target.value); setCmdParams({}); }} label="Command" sx={selectSx}>
                {COMMANDS.map(c => (
                  <MenuItem key={c} value={c} sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{c}</MenuItem>
                ))}
              </Select>
            </FormControl>
            {cmdParamFields.map(f => (
              <Box key={f.key}>
                <Typography sx={{ ...mono, color: '#90a4ae', fontSize: '0.7rem', mb: 0.5 }}>{f.label.toUpperCase()}</Typography>
                <Box component="input" type={f.type} min={f.min}
                  value={cmdParams[f.key] ?? ''}
                  onChange={e => handleCmdParamChange(f.key, e.target.value)}
                  placeholder={f.label} style={inputStyle} />
              </Box>
            ))}
          </>
        )}

        {actionType === 'CHANGE_STATUS' && (
          <FormControl size="small" fullWidth>
            <InputLabel sx={labelSx}>Target status</InputLabel>
            <Select value={deviceStatus} onChange={e => setDeviceStatus(e.target.value)} label="Target status" sx={selectSx}>
              {STATUSES.map(s => (
                <MenuItem key={s} value={s} sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{s}</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {error && (
          <Typography sx={{ ...mono, color: '#f44336', fontSize: '0.75rem' }}>{error}</Typography>
        )}

        <Box component="button" onClick={handleSubmit} disabled={mutation.isPending}
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
            : <><Add sx={{ fontSize: 14 }} /> CREATE</>
          }
        </Box>

        {mutation.isSuccess && (
          <Typography sx={{ ...mono, color: '#00e676', fontSize: '0.75rem' }}>Policy created.</Typography>
        )}
      </Stack>
    </Box>
  );
}

// ─── PolicyRow ────────────────────────────────────────────────────────────────

function PolicyRow({ policy, onToggle, onDelete }) {
  const [expanded, setExpanded] = useState(false);

  const { data: triggers, isLoading: triggersLoading } = useQuery({
    queryKey: ['policy-triggers', policy.id],
    queryFn: () => adminAPI.getPolicyTriggers(policy.id).then(r => r.data),
    enabled: expanded,
  });

  const toggleMutation = useMutation({
    mutationFn: () => adminAPI.updatePolicy(policy.id, { is_active: !policy.is_active }),
    onSuccess: onToggle,
  });

  const deleteMutation = useMutation({
    mutationFn: () => adminAPI.deletePolicy(policy.id),
    onSuccess: onDelete,
    onError: (err) => {
      if (err.response?.status === 409) {
        const msg = err.response.data?.error || 'Policy fired recently.';
        if (window.confirm(`${msg}\n\nDelete anyway?`)) {
          adminAPI.deletePolicyForce(policy.id).then(onDelete);
        }
      }
    },
  });

  const cellSx = { ...mono, color: '#e0e0e0', fontSize: '0.72rem', py: 0.75, pr: 2, verticalAlign: 'middle' };
  const dimSx  = { ...mono, color: '#546e7a', fontSize: '0.7rem',  py: 0.75, pr: 2, verticalAlign: 'middle' };

  return (
    <>
      <Box component="tr"
        sx={{ cursor: 'pointer', '&:hover td': { bgcolor: 'rgba(255,255,255,0.02)' } }}
        onClick={() => setExpanded(e => !e)}
      >
        <Box component="td" sx={cellSx}>{policy.name}</Box>
        <Box component="td" sx={{ ...mono, color: '#90caf9', fontSize: '0.72rem', py: 0.75, pr: 2, verticalAlign: 'middle' }}>
          {policy.condition_type}
        </Box>
        <Box component="td" sx={cellSx}>{policy.threshold_value}</Box>
        <Box component="td" sx={dimSx}>{policy.window_minutes}m</Box>
        <Box component="td" sx={{ ...mono, color: '#ce93d8', fontSize: '0.72rem', py: 0.75, pr: 2, verticalAlign: 'middle' }}>
          {policy.action_type}
        </Box>
        <Box component="td" sx={dimSx}>
          {policy.applies_to_device_name || policy.applies_to_type_name || 'ALL'}
        </Box>
        <Box component="td" sx={{ py: 0.75, pr: 2, verticalAlign: 'middle' }}>
          <Box sx={{
            display: 'inline-block', px: 0.75, py: 0.25,
            border: `1px solid ${policy.is_active ? STATUS_COLORS.true : STATUS_COLORS.false}`,
            color: policy.is_active ? STATUS_COLORS.true : STATUS_COLORS.false,
            fontFamily: 'monospace', fontSize: '0.65rem', letterSpacing: 1,
          }}>
            {policy.is_active ? 'ACTIVE' : 'INACTIVE'}
          </Box>
        </Box>
        <Box component="td" sx={dimSx}>{policy.trigger_count}</Box>
        <Box component="td" sx={{ py: 0.75, verticalAlign: 'middle' }}>
          <Box sx={{ display: 'flex', gap: 0.5 }} onClick={e => e.stopPropagation()}>
            <Box component="button"
              onClick={() => toggleMutation.mutate()}
              disabled={toggleMutation.isPending}
              title={policy.is_active ? 'Disable' : 'Enable'}
              sx={{
                p: 0.5, bgcolor: 'transparent', border: '1px solid rgba(255,255,255,0.15)',
                color: '#90a4ae', cursor: 'pointer', display: 'flex', alignItems: 'center',
                '&:hover': { borderColor: '#00ff41', color: '#00ff41' },
                '&:disabled': { opacity: 0.4 },
              }}
            >
              <PowerSettingsNew sx={{ fontSize: 14 }} />
            </Box>
            <Box component="button"
              onClick={() => { if (window.confirm(`Delete policy "${policy.name}"?`)) deleteMutation.mutate(); }}
              disabled={deleteMutation.isPending}
              title="Delete"
              sx={{
                p: 0.5, bgcolor: 'transparent', border: '1px solid rgba(255,255,255,0.15)',
                color: '#90a4ae', cursor: 'pointer', display: 'flex', alignItems: 'center',
                '&:hover': { borderColor: '#f44336', color: '#f44336' },
                '&:disabled': { opacity: 0.4 },
              }}
            >
              <Delete sx={{ fontSize: 14 }} />
            </Box>
            {expanded ? <ExpandLess sx={{ fontSize: 16, color: '#546e7a', mt: 0.25 }} /> : <ExpandMore sx={{ fontSize: 16, color: '#546e7a', mt: 0.25 }} />}
          </Box>
        </Box>
      </Box>

      {/* Expanded trigger log */}
      {expanded && (
        <Box component="tr">
          <Box component="td" colSpan={9} sx={{ pb: 1, pt: 0 }}>
            <Box sx={{ bgcolor: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)', p: 1.5 }}>
              <Typography sx={{ ...mono, color: '#546e7a', fontSize: '0.6rem', letterSpacing: 1, mb: 1 }}>
                RECENT TRIGGERS (last 10)
              </Typography>
              {triggersLoading && <CircularProgress size={12} sx={{ color: '#00ff41' }} />}
              {!triggersLoading && (!triggers || triggers.length === 0) && (
                <Typography sx={{ ...mono, color: '#546e7a', fontSize: '0.75rem' }}>No triggers yet.</Typography>
              )}
              {triggers && triggers.slice(0, 10).map(t => (
                <Box key={t.id} sx={{ display: 'flex', gap: 2, mb: 0.5 }}>
                  <Typography sx={{ ...mono, color: '#546e7a', fontSize: '0.7rem', flexShrink: 0 }}>
                    {new Date(t.triggered_at).toLocaleString()}
                  </Typography>
                  <Typography sx={{ ...mono, color: '#90a4ae', fontSize: '0.7rem' }}>
                    {t.device_name}
                  </Typography>
                  <Typography sx={{ ...mono, color: '#546e7a', fontSize: '0.65rem' }}>
                    {JSON.stringify(t.detail)}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      )}
    </>
  );
}

// ─── PolicyTable ──────────────────────────────────────────────────────────────

function PolicyTable({ policies, onToggle, onDelete }) {
  if (!policies.length) {
    return (
      <Typography sx={{ ...mono, color: '#546e7a', fontSize: '0.8rem' }}>
        No policies defined yet.
      </Typography>
    );
  }

  const cols = ['NAME', 'CONDITION', 'THRESHOLD', 'WINDOW', 'ACTION', 'SCOPE', 'STATUS', 'TRIGGERS', 'ACTIONS'];

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
          {policies.map(p => (
            <PolicyRow key={p.id} policy={p} onToggle={onToggle} onDelete={onDelete} />
          ))}
        </Box>
      </Box>
    </Box>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminPolicies() {
  const queryClient = useQueryClient();

  const { data: policies, isLoading, isError } = useQuery({
    queryKey: ['policies'],
    queryFn: () => adminAPI.getPolicies().then(r => r.data),
    refetchInterval: 15000,
  });

  const { data: devicesData } = useQuery({
    queryKey: ['admin-devices'],
    queryFn: () => adminAPI.getAllDevices().then(r => r.data),
  });

  // Device types derived from the devices list (no dedicated endpoint needed)
  const devices = devicesData || [];
  const deviceTypesMap = {};
  devices.forEach(d => {
    if (d.device_type && !deviceTypesMap[d.device_type]) {
      deviceTypesMap[d.device_type] = { id: d.device_type, name: d.device_type_name || d.device_type };
    }
  });
  const deviceTypes = Object.values(deviceTypesMap);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['policies'] });
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
          DETECTION POLICIES
        </Typography>
      </Box>

      {/* Two-column layout */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>

        {/* Left: create panel */}
        <Box sx={{ width: 300, flexShrink: 0 }}>
          <CreatePolicyPanel
            devices={devices}
            deviceTypes={deviceTypes}
            onCreated={invalidate}
          />
        </Box>

        {/* Right: policy table */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
            <Typography sx={{ ...mono, color: '#00ff41', fontSize: '0.65rem', letterSpacing: 2 }}>
              ALL POLICIES
            </Typography>
            {isLoading && <CircularProgress size={14} sx={{ color: '#00ff41' }} />}
          </Box>

          <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)' }}>
            {isError && (
              <Typography sx={{ ...mono, color: '#f44336', fontSize: '0.8rem' }}>
                Failed to load policies.
              </Typography>
            )}
            {!isLoading && !isError && (
              <PolicyTable
                policies={policies || []}
                onToggle={invalidate}
                onDelete={invalidate}
              />
            )}
          </Box>
        </Box>
      </Box>
    </AdminPageLayout>
  );
}
