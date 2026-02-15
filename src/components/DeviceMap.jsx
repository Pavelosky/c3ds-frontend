import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { Box } from '@mui/material';
import DeviceMarker from './DeviceMarker';
import 'leaflet/dist/leaflet.css';

/**
 * MapUpdater Component
 *
 * Internal component that updates the map view when center changes.
 * This is necessary because MapContainer's center prop only works on initial render.
 */
function MapUpdater({ center }) {
  const map = useMap();

  useEffect(() => {
    if (center) {
      console.log('MapUpdater: Flying to center:', center);
      map.setView(center, map.getZoom());
    }
  }, [center, map]);

  return null;
}

/**
 * DeviceMap Component
 *
 * Displays an interactive map with device markers.
 * Automatically centers on user's location on load, with fallbacks to device locations or Vilnius.
 *
 * @param {Array} devices - Array of device objects from API
 * @param {string} height - CSS height value (default: '500px')
 * @param {boolean} disableGeolocation - If true, centers on device location instead of user location (default: false)
 *
 * Future enhancements for real-time alerts:
 * - WebSocket integration for live device status updates
 * - Alert markers with different icons/animations
 * - Notification system for alert messages
 * - Sound/visual alerts for critical events
 */
function DeviceMap({ devices, height = '500px', disableGeolocation = false }) {
  // Access the API key from environment variables
  const thunderforestApiKey = import.meta.env.VITE_THUNDERFOREST_API_KEY;

  const [mapCenter, setMapCenter] = useState([54.6872, 25.2797]); // Default to Vilnius

  const devicesWithLocation = devices.filter(
    device => device.latitude && device.longitude &&
              device.latitude !== null && device.longitude !== null
  );


  /**
   * Set the center of the map to the users location and default to the center of Europe
   *
   * @returns {Array} [latitude, longitude]
   */
  const getMapCenter = () => {
    if (devicesWithLocation.length === 0) {
      return [54.6872, 25.2797];
    }
    const avgLat = devicesWithLocation.reduce(
      (sum, d) => sum + parseFloat(d.latitude), 0
    ) / devicesWithLocation.length;
    const avgLng = devicesWithLocation.reduce(
      (sum, d) => sum + parseFloat(d.longitude), 0
    ) / devicesWithLocation.length;
    return [avgLat, avgLng];
  };
  /**
   * Get user's location on component mount
   * Falls back to device locations or default center if geolocation is unavailable
   * Skip geolocation if disableGeolocation is true (e.g., for device detail pages)
   */
  useEffect(() => {
    // If geolocation is disabled, center directly on device location
    if (disableGeolocation) {
      console.log('DeviceMap: Geolocation disabled, centering on device location');
      setMapCenter(getMapCenter());
      return;
    }

    console.log('DeviceMap: Attempting to get user location...');

    if (!navigator.geolocation) {
      console.log('DeviceMap: Geolocation not supported');
      setMapCenter(getMapCenter());
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Success - use user's location
        const userLocation = [
          parseFloat(position.coords.latitude.toFixed(4)),
          parseFloat(position.coords.longitude.toFixed(4))
        ];
        console.log('DeviceMap: Got user location:', userLocation);
        setMapCenter(userLocation);
      },
      (error) => {
        // Error or denied - fall back to device center
        console.log('DeviceMap: Geolocation error:', error.message);
        setMapCenter(getMapCenter());
      }
    );
  }, [disableGeolocation]); // Re-run if disableGeolocation changes

  /**
   * Calculate appropriate zoom level based on device count
   * Strategy:
   * - No devices: Country view (zoom 7)
   * - 1 device: City view (zoom 12)
   * - Multiple devices: Region view (zoom 8)
   *
   * @returns {number} Zoom level (1-18, where 1 is world view and 18 is street view)
   */
  const getZoomLevel = () => {
    if (devicesWithLocation.length === 0) return 7;
    if (devicesWithLocation.length === 1) return 12;
    return 8;
  };

  return (
    <Box
      sx={{
        height,
        width: '100%',
        borderRadius: 0,
        overflow: 'hidden',
        border: 2,
        borderColor: '#1e3a5f',
        boxShadow: '0 0 20px rgba(0, 255, 65, 0.15)',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          zIndex: 1000,
          opacity: 0.6
        }
      }}
      // Accessibility additions
      role="region"
      aria-label={`Interactive map showing ${devicesWithLocation.length} device${devicesWithLocation.length !== 1 ? 's' : ''}`}
      tabIndex={0}
    >
      <MapContainer
        center={mapCenter}
        zoom={getZoomLevel()}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        // Keyboard navigation
        keyboard={true}
        // Better focus management
        attributionControl={true}
      >
        <MapUpdater center={mapCenter} />

        {/* <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        /> */}

        {/* Alternative map styles */}
        // Light clean
        <TileLayer
          attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
          url="https://tiles.stadiamaps.com/tiles/outdoors/{z}/{x}/{y}{r}.png"
        />

        // Datk clean
        {/* <TileLayer
          attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
          url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
        /> */}

        // Thunderforest https://thunderforest.com
        {/* <TileLayer
          attribution='&copy; <a href="http://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={`https://tile.thunderforest.com/landscape/{z}/{x}/{y}.png?apikey=${thunderforestApiKey}`}
        /> */}



        {devicesWithLocation.map((device) => (
          <DeviceMarker key={device.id} device={device} />
        ))}
      </MapContainer>
      
      {/* Screen reader text - device count */}
      <div style={{ position: 'absolute', left: '-10000px' }}>
        {devicesWithLocation.length === 0 
          ? 'No devices with location data available'
          : `Showing ${devicesWithLocation.length} device${devicesWithLocation.length !== 1 ? 's' : ''} on map`
        }
      </div>
    </Box>
  );
}

export default DeviceMap;