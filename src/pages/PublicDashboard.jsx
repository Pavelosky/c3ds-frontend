import { Box, Typography, Alert, CircularProgress } from '@mui/material';
import { Navigation } from '../components/Navigation';
import { useDevices } from '../hooks/useDevices';
import DeviceMap from '../components/DeviceMap';

/**
 * PublicDashboard Component
 *
 * Main public-facing dashboard showing all registered devices.
 * Displays devices on an interactive map (if they have location data)
 * and in a table (if they don't have location data).
 *
 * Features:
 * - Interactive Leaflet map with OpenStreetMap tiles
 * - Status-based marker colors
 * - Device popups with detailed information
 * - Separate table for devices without location
 * - Responsive Material-UI layout
 *
 * Future enhancements for real-time alerts:
 * - WebSocket connection to receive live device status updates
 * - Alert notifications overlay on map
 * - Sound/visual alerts for critical messages
 * - Alert history timeline
 * - Filter controls to show/hide different device types/statuses
 */
function PublicDashboard() {
  const { data: devices, isLoading, error } = useDevices();

  if (isLoading) {
    return (
      <>
        <Navigation />
        <Box
          sx={{
            bgcolor: '#0a0e27',
            height: 'calc(100vh - 64px)', // Subtract navigation height
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            m: 0,
            p: 0,
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress sx={{ color: '#00ff41' }} />
            <Typography
              variant="body1"
              sx={{ mt: 2, color: '#e0e0e0', fontFamily: 'monospace' }}
            >
              LOADING TACTICAL OVERVIEW...
            </Typography>
          </Box>
        </Box>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navigation />
        <Box
          sx={{
            bgcolor: '#0a0e27',
            height: 'calc(100vh - 64px)', // Subtract navigation height
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            m: 0,
            p: 0,
          }}
        >
          <Alert
            severity="error"
            sx={{
              bgcolor: 'rgba(211, 47, 47, 0.1)',
              color: '#ef5350',
              border: 1,
              borderColor: '#d32f2f',
              fontFamily: 'monospace',
              '& .MuiAlert-icon': {
                color: '#ef5350',
              },
            }}
          >
            SYSTEM ERROR: {error.message}
          </Alert>
        </Box>
      </>
    );
  }

  // Filter to only show ACTIVE devices with location data
  const activeDevices = devices?.filter((d) => d.status === 'ACTIVE') || [];
  const devicesWithLocation = activeDevices.filter(
    (d) => d.latitude && d.longitude
  );

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
        m: 0,
        p: 0,
      }}
    >
      <Navigation />

        {activeDevices.length > 0 ? (
            <Box sx={{ flex: 1, minHeight: 0, position: 'relative' }}>
              <DeviceMap devices={activeDevices} height="100%" />
            </Box>
        ) : (
          <Alert
            severity="info"
            sx={{
              bgcolor: 'rgba(33, 150, 243, 0.1)',
              color: '#90caf9',
              border: 1,
              borderColor: '#1976d2',
              fontFamily: 'monospace',
              '& .MuiAlert-icon': {
                color: '#90caf9',
              },
            }}
          >
            NO ACTIVE SENSORS DETECTED. AWAITING PARTICIPANT REGISTRATION...
          </Alert>
        )}
      </Box>
  );
}

export default PublicDashboard;