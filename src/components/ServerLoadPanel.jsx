import { useQuery } from '@tanstack/react-query';
import { Box, Typography, LinearProgress, CircularProgress } from '@mui/material';
import { adminAPI } from '../api/client';

function getColor(pct) {
  if (pct >= 90) return '#f44336';
  if (pct >= 70) return '#ff9800';
  return '#00ff41';
}

function Gauge({ label, value, unit, max, pct }) {
  const color = getColor(pct);
  return (
    <Box sx={{ mb: 1.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
        <Typography variant="caption" sx={{ color: '#90a4ae', fontFamily: 'monospace', fontSize: '0.65rem', letterSpacing: 1 }}>
          {label}
        </Typography>
        <Typography variant="caption" sx={{ color, fontFamily: 'monospace', fontSize: '0.65rem', fontWeight: 700 }}>
          {value !== undefined ? `${value}${unit}` : '—'}
          {max ? ` / ${max}${unit}` : ''}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={Math.min(pct ?? 0, 100)}
        sx={{
          height: 4,
          borderRadius: 0,
          bgcolor: 'rgba(255,255,255,0.08)',
          '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 0 },
        }}
      />
    </Box>
  );
}

export default function ServerLoadPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ['system-health'],
    queryFn: () => adminAPI.getSystemHealth().then(r => r.data),
    refetchInterval: 10000,
  });

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="caption" sx={{ color: '#00ff41', fontFamily: 'monospace', letterSpacing: 2, fontSize: '0.65rem', mb: 1.5, display: 'block' }}>
        SERVER LOAD
      </Typography>

      {isLoading ? (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
          <CircularProgress size={20} sx={{ color: '#00ff41' }} />
        </Box>
      ) : !data ? (
        <Typography variant="caption" sx={{ color: '#546e7a', fontFamily: 'monospace' }}>
          Unavailable
        </Typography>
      ) : (
        <>
          <Gauge label="CPU" value={data.cpu_percent} unit="%" pct={data.cpu_percent} />
          <Gauge
            label="RAM"
            value={data.ram_used_gb}
            unit=" GB"
            max={data.ram_total_gb}
            pct={data.ram_percent}
          />
          <Gauge
            label="DISK"
            value={data.disk_used_gb}
            unit=" GB"
            max={data.disk_total_gb}
            pct={data.disk_percent}
          />
          <Box sx={{ mt: 'auto' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" sx={{ color: '#90a4ae', fontFamily: 'monospace', fontSize: '0.65rem', letterSpacing: 1 }}>
                DB CONNS
              </Typography>
              <Typography variant="caption" sx={{ color: '#00ff41', fontFamily: 'monospace', fontSize: '0.65rem', fontWeight: 700 }}>
                {data.db_connections}
              </Typography>
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
}
