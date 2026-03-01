import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Typography, Chip, IconButton, CircularProgress,
  Tooltip, Menu, MenuItem, Divider,
} from '@mui/material';
import {
  FilterList, History, Circle, Terminal,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { adminAPI } from '../api/client';
import { formatDistanceToNow } from 'date-fns';

const STATUS_COLOR = {
  ACTIVE: '#00ff41',
  INACTIVE: '#90a4ae',
  PENDING: '#2294f2',
  REVOKED: '#f44336',
  EXPIRED: '#ff9800',
};

const STATUS_BG = {
  ACTIVE: 'rgba(0,255,65,0.12)',
  INACTIVE: 'rgba(144,164,174,0.12)',
  PENDING: 'rgba(34, 148, 242,0.12)',
  REVOKED: 'rgba(244,67,54,0.12)',
  EXPIRED: 'rgba(244,67,54,0.12)',
};

const ALLOWED_STATUSES = ['ACTIVE', 'INACTIVE', , 'PENDING', 'REVOKED', 'EXPIRED'];

function DeviceTile({ device, onFilterFlags }) {
  const queryClient = useQueryClient();
  const [menuAnchor, setMenuAnchor] = useState(null);

  const setStatus = useMutation({
    mutationFn: (newStatus) => adminAPI.setDeviceStatus(device.id, newStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-devices'] });
      setMenuAnchor(null);
    },
  });

  const color = STATUS_COLOR[device.status] || '#90a4ae';
  const lastSeen = device.last_message
    ? formatDistanceToNow(new Date(device.last_message), { addSuffix: true })
    : 'Never';

  return (
    <Box
      sx={{
        p: 1,
        mb: 0.5,
        bgcolor: STATUS_BG[device.status] || 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderLeft: `3px solid ${color}`,
        '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
      }}
    >
      {/* Row 1: status dot + device name + status chip */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.25 }}>
        <Circle sx={{ fontSize: 8, color }} />
        <Typography
          variant="body2"
          sx={{ color: '#e0e0e0', fontFamily: 'monospace', fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          title={device.name}
        >
          {device.name}
        </Typography>
        <Chip
          label={device.status}
          size="small"
          sx={{
            height: 16,
            fontSize: '0.6rem',
            fontFamily: 'monospace',
            color,
            border: `1px solid ${color}`,
            bgcolor: 'transparent',
            flexShrink: 0,
            '& .MuiChip-label': { px: 0.75 },
          }}
        />
      </Box>

      {/* Row 2: last seen + action buttons */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="caption" sx={{ color: '#78909c', fontSize: '0.65rem', fontFamily: 'monospace' }}>
          {lastSeen}
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
        {/* Change status */}
        <Tooltip title="Change status">
          <IconButton
            size="small"
            sx={{ color: '#78909c', p: 0.25, '&:hover': { color: '#00ff41' } }}
            onClick={(e) => setMenuAnchor(e.currentTarget)}
          >
            <Circle sx={{ fontSize: 14 }} />
          </IconButton>
        </Tooltip>
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={() => setMenuAnchor(null)}
          PaperProps={{ sx: { bgcolor: '#1a1f3e', border: '1px solid rgba(255,255,255,0.12)' } }}
        >
          {ALLOWED_STATUSES.filter(s => s !== device.status).map(s => (
            <MenuItem
              key={s}
              onClick={() => setStatus.mutate(s)}
              disabled={setStatus.isPending}
              sx={{ color: STATUS_COLOR[s], fontFamily: 'monospace', fontSize: '0.8rem' }}
            >
              Set {s}
            </MenuItem>
          ))}
        </Menu>

        {/* Filter flags */}
        <Tooltip title="Filter flags to this device">
          <IconButton
            size="small"
            sx={{ color: '#78909c', p: 0.25, '&:hover': { color: '#00ff41' } }}
            onClick={() => onFilterFlags(device.id, device.name)}
          >
            <FilterList sx={{ fontSize: 14 }} />
          </IconButton>
        </Tooltip>

        {/* Audit trail */}
        <Tooltip title="View audit trail">
          <IconButton
            size="small"
            component={RouterLink}
            to={`/c3ds-admin/devices/${device.id}/audit`}
            sx={{ color: '#78909c', p: 0.25, '&:hover': { color: '#00ff41' } }}
          >
            <History sx={{ fontSize: 14 }} />
          </IconButton>
        </Tooltip>

        {/* Dispatch command */}
        <Tooltip title="Dispatch command">
          <IconButton
            size="small"
            component={RouterLink}
            to={`/c3ds-admin/commands?device_id=${device.id}`}
            sx={{ color: '#78909c', p: 0.25, '&:hover': { color: '#00ff41' } }}
          >
            <Terminal sx={{ fontSize: 14 }} />
          </IconButton>
        </Tooltip>
        </Box>
      </Box>
    </Box>
  );
}

export default function AdminDeviceSidebar({ onFilterFlags }) {
  const [statusFilter, setStatusFilter] = useState(new Set());

  const { data: devices = [], isLoading } = useQuery({
    queryKey: ['admin-devices'],
    queryFn: () => adminAPI.getAllDevices().then(r => r.data),
    refetchInterval: 30000,
  });

  const toggleStatus = (s) => {
    setStatusFilter(prev => {
      const next = new Set(prev);
      next.has(s) ? next.delete(s) : next.add(s);
      return next;
    });
  };

  const sorted = [...devices].sort((a, b) => {
    const aTime = Math.max(
      a.last_message ? new Date(a.last_message).getTime() : 0,
      a.updated_at   ? new Date(a.updated_at).getTime()   : 0,
    );
    const bTime = Math.max(
      b.last_message ? new Date(b.last_message).getTime() : 0,
      b.updated_at   ? new Date(b.updated_at).getTime()   : 0,
    );
    return bTime - aTime;
  });

  const visible = statusFilter.size === 0 ? sorted : sorted.filter(d => statusFilter.has(d.status));

  return (
    <Box
      sx={{
        width: 340,
        flexShrink: 0,
        height: '100%',
        bgcolor: '#0d1226',
        borderRight: '1px solid rgba(255,255,255,0.12)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box sx={{ p: 1.5, borderBottom: '1px solid rgba(255,255,255,0.12)', bgcolor: '#0a0e27' }}>
        <Typography variant="h6" sx={{ color: '#e0e0e0', fontFamily: 'monospace', fontWeight: 700, lineHeight: 1.2 }}>
          {devices.length} Devices
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
          {['ACTIVE', 'INACTIVE', 'PENDING', 'REVOKED', 'EXPIRED'].map(s => {
            const count = devices.filter(d => d.status === s).length;
            const active = statusFilter.has(s);
            return (
              <Typography
                key={s}
                variant="caption"
                onClick={() => toggleStatus(s)}
                sx={{
                  color: STATUS_COLOR[s],
                  fontFamily: 'monospace',
                  fontSize: '0.65rem',
                  cursor: 'pointer',
                  opacity: statusFilter.size === 0 || active ? 1 : 0.35,
                  borderBottom: active ? `1px solid ${STATUS_COLOR[s]}` : '1px solid transparent',
                  '&:hover': { opacity: 1 },
                }}
              >
                {count} {s}
              </Typography>
            );
          })}
        </Box>
      </Box>

      {/* Device list */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 1,
        '&::-webkit-scrollbar': { width: 4 },
        '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 2 },
      }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', pt: 3 }}>
            <CircularProgress size={20} sx={{ color: '#00ff41' }} />
          </Box>
        ) : visible.length === 0 ? (
          <Typography variant="caption" sx={{ color: '#546e7a', fontFamily: 'monospace', display: 'block', textAlign: 'center', pt: 3 }}>
            No devices registered
          </Typography>
        ) : (
          visible.map(device => (
            <DeviceTile key={device.id} device={device} onFilterFlags={onFilterFlags} />
          ))
        )}
      </Box>
    </Box>
  );
}
