import { Box, Typography, CircularProgress } from '@mui/material';
import RunningWithErrorsIcon from '@mui/icons-material/RunningWithErrors';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import WarningIcon from '@mui/icons-material/Warning';
import { useStats } from '../hooks/useStats';

/**
 * SidebarStats Component
 *
 * Displays key statistics at the top of the MessageSidebar:
 * - Number of alerts in the last 2 hours
 * - Number of active devices in the system
 *
 * Updates every 30 seconds via polling.
 */
function SidebarStats() {
  const { data: stats, isLoading, error } = useStats();

  // Debug: Log stats data
  if (stats) {
    console.log('SidebarStats - stats:', stats);
  }
  if (error) {
    console.error('SidebarStats - error:', error);
  }

  // Determine alert icon color based on count
  const getAlertColor = (count) => {
    if (count === 0) return '#4caf50'; // Green - no alerts
    if (count < 15) return '#ff9800'; // Orange - moderate alerts
    return '#d32f2f'; // Red - high alerts (15+)
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          py: 1,
        }}
      >
        <CircularProgress size={16} sx={{ color: '#ffffff' }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 2,
        mb: 1.5,
      }}
    >
      {/* Alerts Last 2 Hours */}
      <Box
        sx={{
          flex: 1,
          bgcolor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: 1,
          p: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
        }}
      >
        <RunningWithErrorsIcon
          sx={{
            color: getAlertColor(stats?.alerts_last_2h || 0),
            fontSize: '1.5rem',
            
          }}
        />
        <Box>
          <Typography
            sx={{
              color: '#ffffff',
              fontSize: '1.2rem',
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            {stats?.alerts_last_2h || 0}
          </Typography>
          <Typography
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '0.6rem',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              lineHeight: 1.2,
            }}
          >
            Alerts in last 2h
          </Typography>
        </Box>
      </Box>

      {/* Active Devices */}
      <Box
        sx={{
          flex: 1,
          bgcolor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: 1,
          p: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
        }}
      >
        <TrackChangesIcon
          sx={{
            color: '#4caf50',
            fontSize: '1.5rem',
          }}
        />
        <Box>
          <Typography
            sx={{
              color: '#ffffff',
              fontSize: '1.2rem',
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            {stats?.active_devices || 0}
          </Typography>
          <Typography
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '0.6rem',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              lineHeight: 1.2,
            }}
          >
            Active Devices
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

export default SidebarStats;
