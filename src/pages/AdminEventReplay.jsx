import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Typography, Button, TextField, Stack, Slider, Card,
  CardContent, Chip, CircularProgress, Alert, Paper, IconButton,
} from '@mui/material';
import {
  PlayArrow, Pause, SkipNext, SkipPrevious, ArrowBack,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { BaseLayout } from '../components/BaseLayout';
import { adminAPI } from '../api/client';

// Fix Leaflet default icon path issue with Vite
import 'leaflet/dist/leaflet.css';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const DEFAULT_START = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
const DEFAULT_END = new Date().toISOString().slice(0, 16);

export default function AdminEventReplay() {
  const [startInput, setStartInput] = useState(DEFAULT_START);
  const [endInput, setEndInput] = useState(DEFAULT_END);
  const [queryParams, setQueryParams] = useState(null);

  const [playhead, setPlayhead] = useState(0);   // index into events array
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);         // playback multiplier
  const intervalRef = useRef(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-timeline', queryParams],
    queryFn: () => adminAPI.getTimeline({
      start: queryParams.start,
      end: queryParams.end,
    }).then(r => r.data),
    enabled: !!queryParams,
  });

  const events = data?.events || [];

  // Playback ticker
  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setPlayhead(p => {
          if (p >= events.length - 1) {
            setPlaying(false);
            return p;
          }
          return p + 1;
        });
      }, 1000 / speed);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [playing, speed, events.length]);

  const currentEvent = events[playhead] || null;

  // Collect unique device positions
  const devicePositions = {};
  events.forEach(e => {
    if (e.latitude && e.longitude) {
      devicePositions[e.device_id] = { lat: e.latitude, lng: e.longitude, name: e.device_name };
    }
  });

  // Events up to current playhead (for map circles)
  const visibleEvents = events.slice(0, playhead + 1);
  const latestByDevice = {};
  visibleEvents.forEach(e => { latestByDevice[e.device_id] = e; });

  const mapCenter = Object.values(devicePositions)[0]
    ? [Object.values(devicePositions)[0].lat, Object.values(devicePositions)[0].lng]
    : [54.0, 24.0];

  return (
    <BaseLayout>
      <Box p={3}>
        <Button startIcon={<ArrowBack />} component={RouterLink} to="/c3ds-admin" sx={{ mb: 2 }}>
          Back to Admin
        </Button>
        <Typography variant="h5" fontWeight={700} mb={3}>Event Replay</Typography>

        {/* Time window selector */}
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
              onClick={() => {
                setPlayhead(0);
                setPlaying(false);
                setQueryParams({ start: new Date(startInput).toISOString(), end: new Date(endInput).toISOString() });
              }}
            >
              Load Events
            </Button>
          </Stack>
        </Paper>

        {isLoading && <CircularProgress />}
        {isError && <Alert severity="error">Failed to load events.</Alert>}

        {queryParams && !isLoading && events.length === 0 && (
          <Alert severity="info">No events found in this time window.</Alert>
        )}

        {events.length > 0 && (
          <Stack spacing={2}>
            {/* Map */}
            <Box sx={{ height: 420, borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
              <MapContainer center={mapCenter} zoom={10} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                {/* Static device markers */}
                {Object.entries(devicePositions).map(([id, pos]) => (
                  <Marker key={id} position={[pos.lat, pos.lng]}>
                    <Popup>{pos.name}</Popup>
                  </Marker>
                ))}

                {/* Active detection circles */}
                {Object.values(latestByDevice).map(e => e.latitude && e.longitude && (
                  <Circle
                    key={e.device_id}
                    center={[e.latitude, e.longitude]}
                    radius={300}
                    pathOptions={{ color: '#f44336', fillColor: '#f44336', fillOpacity: 0.3 }}
                  />
                ))}
              </MapContainer>
            </Box>

            {/* Playback controls */}
            <Paper sx={{ p: 2 }}>
              <Stack spacing={1}>
                <Slider
                  value={playhead}
                  min={0}
                  max={events.length - 1}
                  onChange={(_, v) => { setPlayhead(v); setPlaying(false); }}
                  valueLabelDisplay="auto"
                  valueLabelFormat={i => events[i] ? new Date(events[i].timestamp).toLocaleTimeString() : ''}
                />
                <Stack direction="row" spacing={1} alignItems="center">
                  <IconButton onClick={() => setPlayhead(p => Math.max(0, p - 1))} size="small">
                    <SkipPrevious />
                  </IconButton>
                  <IconButton onClick={() => setPlaying(v => !v)}>
                    {playing ? <Pause /> : <PlayArrow />}
                  </IconButton>
                  <IconButton onClick={() => setPlayhead(p => Math.min(events.length - 1, p + 1))} size="small">
                    <SkipNext />
                  </IconButton>
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                    Speed:
                  </Typography>
                  {[1, 2, 5, 10].map(s => (
                    <Button
                      key={s}
                      size="small"
                      variant={speed === s ? 'contained' : 'outlined'}
                      onClick={() => setSpeed(s)}
                      sx={{ minWidth: 36 }}
                    >
                      {s}×
                    </Button>
                  ))}
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
                    {playhead + 1} / {events.length}
                  </Typography>
                </Stack>
              </Stack>
            </Paper>

            {/* Current event detail */}
            {currentEvent && (
              <Card>
                <CardContent>
                  <Stack direction="row" spacing={1} mb={1}>
                    <Chip label={currentEvent.message_type} size="small" />
                    <Typography variant="body2" color="text.secondary">
                      {new Date(currentEvent.timestamp).toLocaleString()}
                    </Typography>
                  </Stack>
                  <Typography variant="subtitle2">{currentEvent.device_name}</Typography>
                  <Typography variant="caption" component="pre" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                    {JSON.stringify(currentEvent.data, null, 2)}
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Stack>
        )}
      </Box>
    </BaseLayout>
  );
}
