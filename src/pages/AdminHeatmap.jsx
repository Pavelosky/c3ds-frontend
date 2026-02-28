import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Typography, Stack, CircularProgress, Switch,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import AdminPageLayout from '../components/AdminPageLayout';
import { adminAPI } from '../api/client';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const DEFAULT_START = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
const DEFAULT_END = new Date().toISOString().slice(0, 16);

const darkInputStyle = {
  background: 'rgba(255,255,255,0.06)', color: '#e0e0e0',
  border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4,
  padding: '4px 8px', fontSize: '0.8rem', fontFamily: 'monospace',
  colorScheme: 'dark', width: '100%',
};

function HeatLayer({ points, intensity }) {
  const map = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    if (!points.length) return;
    if (layerRef.current) map.removeLayer(layerRef.current);
    const heatData = points.map(p => [p.lat, p.lng, p.weight]);
    layerRef.current = L.heatLayer(heatData, { radius: 80, blur: 15, max: 3 / intensity }).addTo(map);
    return () => { if (layerRef.current) map.removeLayer(layerRef.current); };
  }, [points, intensity, map]);

  return null;
}

export default function AdminHeatmap() {
  const [startInput, setStartInput] = useState(DEFAULT_START);
  const [endInput, setEndInput] = useState(DEFAULT_END);
  const [queryParams, setQueryParams] = useState({
    start: new Date(DEFAULT_START).toISOString(),
    end: new Date(DEFAULT_END).toISOString(),
  });
  const [intensity, setIntensity] = useState(1);
  const [showPins, setShowPins] = useState(true);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-heatmap', queryParams],
    queryFn: () => adminAPI.getHeatmap(queryParams).then(r => r.data),
  });

  const points = data?.points || [];
  const mapCenter = points[0] ? [points[0].lat, points[0].lng] : [54.0, 24.0];

  return (
    <AdminPageLayout>
      {/* Top bar: back + title */}
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
          DETECTION HEATMAP
        </Typography>
      </Box>

      {/* Two-column layout */}
      <Box sx={{ display: 'flex', gap: 2, height: 'calc(100vh - 140px)', minHeight: 0 }}>

        {/* Left panel */}
        <Box sx={{
          width: 360,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          overflowY: 'auto',
          '&::-webkit-scrollbar': { width: 4 },
          '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 2 },
        }}>

          {/* Parameters */}
          <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)' }}>
            <Typography sx={{ color: '#00ff41', fontFamily: 'monospace', fontSize: '0.65rem', letterSpacing: 2, mb: 1.5 }}>
              PARAMETERS
            </Typography>
            <Stack spacing={1.5}>
              <Box component="input" type="datetime-local" value={startInput} onChange={e => setStartInput(e.target.value)} style={darkInputStyle} />
              <Box component="input" type="datetime-local" value={endInput} onChange={e => setEndInput(e.target.value)} style={darkInputStyle} />
              <Box
                component="button"
                onClick={() => setQueryParams({ start: new Date(startInput).toISOString(), end: new Date(endInput).toISOString() })}
                sx={{
                  px: 2, py: 0.75, bgcolor: 'transparent', cursor: 'pointer',
                  border: '1px solid #00ff41', color: '#00ff41',
                  fontFamily: 'monospace', fontSize: '0.75rem', letterSpacing: 1,
                  '&:hover': { bgcolor: 'rgba(0,255,65,0.1)' },
                }}
              >
                UPDATE
              </Box>
            </Stack>
          </Box>

          {/* Display options */}
          <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)' }}>
            <Typography sx={{ color: '#00ff41', fontFamily: 'monospace', fontSize: '0.65rem', letterSpacing: 2, mb: 1.5 }}>
              DISPLAY
            </Typography>
            <Stack spacing={1.5}>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Switch
                  checked={showPins}
                  onChange={e => setShowPins(e.target.checked)}
                  size="small"
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': { color: '#00ff41' },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#00ff41' },
                  }}
                />
                <Typography sx={{ color: '#90a4ae', fontFamily: 'monospace', fontSize: '0.75rem' }}>SHOW PINS</Typography>
              </Stack>

              <Stack direction="row" spacing={1.5} alignItems="center">
                <Typography sx={{ color: '#90a4ae', fontFamily: 'monospace', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                  INTENSITY:
                </Typography>
                <Box
                  component="input"
                  type="range"
                  min={0.1}
                  max={3}
                  step={0.1}
                  value={intensity}
                  onChange={e => setIntensity(Number(e.target.value))}
                  style={{ flex: 1, accentColor: '#00ff41', cursor: 'pointer' }}
                />
                <Typography sx={{ color: '#00ff41', fontFamily: 'monospace', fontSize: '0.75rem', minWidth: 30 }}>
                  {intensity.toFixed(1)}
                </Typography>
              </Stack>
            </Stack>
          </Box>

          {/* Loading / error / empty states */}
          {isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', pt: 2 }}>
              <CircularProgress size={24} sx={{ color: '#00ff41' }} />
            </Box>
          )}
          {isError && (
            <Typography sx={{ color: '#f44336', fontFamily: 'monospace', fontSize: '0.8rem' }}>
              Failed to load heatmap data.
            </Typography>
          )}
          {!isLoading && points.length === 0 && (
            <Typography sx={{ color: '#546e7a', fontFamily: 'monospace', fontSize: '0.8rem' }}>
              No detection events found in this time window.
            </Typography>
          )}
        </Box>

        {/* Right panel: map */}
        <Box sx={{ flex: 1, border: '1px solid rgba(255,255,255,0.12)', overflow: 'hidden', position: 'relative', minHeight: 0 }}>
          <MapContainer center={mapCenter} zoom={10} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
              url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
            />
            {points.length > 0 && <HeatLayer points={points} intensity={intensity} />}
            {showPins && points.map(p => (
              <Marker key={p.device_id} position={[p.lat, p.lng]}>
                <Popup>
                  <strong>{p.device_name}</strong><br />
                  {p.weight} events in window
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </Box>
      </Box>
    </AdminPageLayout>
  );
}
