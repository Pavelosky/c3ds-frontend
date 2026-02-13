import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Chip, Typography, Stack, Divider } from '@mui/material';
import { format } from 'date-fns';

// Fix Leaflet default icon issue with webpack/vite
// This is a known issue where Leaflet cannot find its default icons when bundled
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

/**
 * Status color configuration
 * Centralized color mapping for consistency across markers and chips
 */
const STATUS_CONFIG = {
  ACTIVE: { markerColor: 'green', chipColor: 'success' },
  PENDING: { markerColor: 'orange', chipColor: 'warning' },
  INACTIVE: { markerColor: 'blue', chipColor: 'info' },
  REVOKED: { markerColor: 'red', chipColor: 'error' },
  EXPIRED: { markerColor: 'grey', chipColor: 'default' },
};

/**
 * DeviceMarker Component
 *
 * Displays a device on the map with color-coded marker based on status.
 * Shows device information in a popup when clicked.
 *
 * Currently used on PublicDashboard (ACTIVE devices only), but designed
 * to be reusable for participant dashboards showing all device statuses.
 *
 * @param {Object} device - Device object from API
 */
function DeviceMarker({ device }) {
  const statusConfig = STATUS_CONFIG[device.status] || STATUS_CONFIG.INACTIVE;

  /**
   * Create custom marker icon based on device status
   * Uses leaflet-color-markers CDN for pre-colored icons
   */
  const markerIcon = new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${statusConfig.markerColor}.png`,
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  return (
    <Marker
      position={[parseFloat(device.latitude), parseFloat(device.longitude)]}
      icon={markerIcon}
    >
      <Popup maxWidth={320} className="tactical-popup">
        <Stack spacing={1.5} sx={{ p: 0.5 }}>
          {/* Device Name - Tactical Header */}
          <Typography
            variant="h6"
            sx={{
              mb: 0,
              fontFamily: 'monospace',
              fontWeight: 700,
              fontSize: '0.95rem',
              textTransform: 'uppercase',
              color: '#0a0e27',
              bgcolor: '#00ff41',
              px: 1.5,
              py: 0.5,
              letterSpacing: 1,
              borderLeft: 4,
              borderColor: '#006622'
            }}
          >
            {device.name}
          </Typography>

          <Divider sx={{ borderColor: '#1e3a5f', my: 0.5 }} />

          {/* Status */}
          <Stack direction="row" spacing={1} alignItems="center" sx={{ px: 0.5 }}>
            <Typography
              variant="body2"
              sx={{
                color: '#616161',
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase'
              }}
            >
              STATUS:
            </Typography>
            <Chip
              label={device.status_display || device.status}
              size="small"
              color={statusConfig.chipColor}
              sx={{ fontFamily: 'monospace', fontWeight: 600 }}
            />
          </Stack>

          {/* Device Type */}
          {device.device_type && (
            <Typography
              variant="body2"
              sx={{
                px: 0.5,
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                color: '#424242'
              }}
            >
              <strong style={{ color: '#616161' }}>TYPE:</strong> {device.device_type.name || device.device_type}
            </Typography>
          )}

          {/* Location Coordinates */}
          <Typography
            variant="body2"
            sx={{
              px: 0.5,
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              color: '#616161',
              bgcolor: '#f5f5f5',
              py: 0.5,
              borderRadius: 0.5
            }}
          >
            <strong>COORDS:</strong> {Number(device.latitude).toFixed(6)}, {Number(device.longitude).toFixed(6)}
          </Typography>

          {/* Message Count */}
          {device.message_count !== undefined && (
            <Typography
              variant="body2"
              sx={{
                px: 0.5,
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                color: '#424242'
              }}
            >
              <strong style={{ color: '#616161' }}>MSGS:</strong> {device.message_count}
            </Typography>
          )}

          <Divider sx={{ borderColor: '#e0e0e0', my: 0.5 }} />

          {/* Created Date */}
          <Typography
            variant="caption"
            sx={{
              px: 0.5,
              color: '#757575',
              fontFamily: 'monospace',
              fontSize: '0.7rem'
            }}
          >
            DEPLOYED: {format(new Date(device.created_at), 'yyyy-MM-dd HH:mm')}
          </Typography>
        </Stack>
      </Popup>
    </Marker>
  );
}

export default DeviceMarker;