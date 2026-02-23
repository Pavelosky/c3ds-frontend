import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Typography, Button, TextField, Stack, Paper, Slider,
  CircularProgress, Alert, FormControlLabel, Switch,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { BaseLayout } from '../components/BaseLayout';
import { adminAPI } from '../api/client';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const DEFAULT_START = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
const DEFAULT_END = new Date().toISOString().slice(0, 16);


// Inner component: renders the heatmap layer using the Leaflet map instance
function HeatLayer({ points, intensity }) {
  const map = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    if (!points.length) return;

    if (layerRef.current) {
      map.removeLayer(layerRef.current);
    }

    const heatData = points.map(p => [p.lat, p.lng, p.weight * intensity]);
    layerRef.current = L.heatLayer(heatData, { radius: 30, blur: 20 }).addTo(map);

    return () => {
      if (layerRef.current) map.removeLayer(layerRef.current);
    };
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
    <BaseLayout>
      <Box p={3}>
        <Button startIcon={<ArrowBack />} component={RouterLink} to="/c3ds-admin" sx={{ mb: 2 }}>
          Back to Admin
        </Button>
        <Typography variant="h5" fontWeight={700} mb={3}>Detection Heatmap</Typography>

        {/* Controls */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-end">
            <TextField
              label="Start"
              type="datetime-local"
              value={startInput}
              onChange={e => setStartInput(e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="End"
              type="datetime-local"
              value={endInput}
              onChange={e => setEndInput(e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
            />
            <Button
              variant="contained"
              onClick={() => setQueryParams({
                start: new Date(startInput).toISOString(),
                end: new Date(endInput).toISOString(),
              })}
            >
              Update
            </Button>
            <FormControlLabel
              control={<Switch checked={showPins} onChange={e => setShowPins(e.target.checked)} />}
              label="Show Pins"
            />
          </Stack>

          <Stack direction="row" spacing={2} alignItems="center" mt={2} maxWidth={400}>
            <Typography variant="body2" noWrap>Intensity:</Typography>
            <Slider
              value={intensity}
              min={0.1}
              max={3}
              step={0.1}
              onChange={(_, v) => setIntensity(v)}
              valueLabelDisplay="auto"
            />
          </Stack>
        </Paper>

        {isLoading && <CircularProgress />}
        {isError && <Alert severity="error">Failed to load heatmap data.</Alert>}
        {!isLoading && points.length === 0 && (
          <Alert severity="info">No detection events found in this time window.</Alert>
        )}

        {/* Map */}
        <Box sx={{ height: 520, borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
          <MapContainer center={mapCenter} zoom={10} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
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
    </BaseLayout>
  );
}
