import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Typography, Stack, CircularProgress, IconButton,
} from '@mui/material';
import {
  PlayArrow, Pause, SkipNext, SkipPrevious, ArrowBack,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { MapContainer, TileLayer, Popup, Circle } from 'react-leaflet';
import AdminPageLayout from '../components/AdminPageLayout';
import { adminAPI } from '../api/client';
import DotMarker from '../components/DotMarker';

import 'leaflet/dist/leaflet.css';

const DEFAULT_START = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
const DEFAULT_END = new Date().toISOString().slice(0, 16);

const darkInputStyle = {
  background: 'rgba(255,255,255,0.06)', color: '#e0e0e0',
  border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4,
  padding: '4px 8px', fontSize: '0.8rem', fontFamily: 'monospace',
  colorScheme: 'dark', width: '100%',
};

const MSG_TYPE_COLOR = {
  alert: '#f44336',
  heartbeat: '#00ff41',
  status: '#2196f3',
};

export default function AdminEventReplay() {
  const [startInput, setStartInput] = useState(DEFAULT_START);
  const [endInput, setEndInput] = useState(DEFAULT_END);
  const [queryParams, setQueryParams] = useState(null);
  const [playhead, setPlayhead] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const intervalRef = useRef(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-timeline', queryParams],
    queryFn: () => adminAPI.getTimeline({ start: queryParams.start, end: queryParams.end }).then(r => r.data),
    enabled: !!queryParams,
  });

  const events = data?.events || [];

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setPlayhead(p => {
          if (p >= events.length - 1) { setPlaying(false); return p; }
          return p + 1;
        });
      }, 1000 / speed);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [playing, speed, events.length]);

  const currentEvent = events[playhead] || null;

  const devicePositions = {};
  events.forEach(e => {
    if (e.latitude && e.longitude) {
      devicePositions[e.device_id] = { lat: e.latitude, lng: e.longitude, name: e.device_name };
    }
  });

  const visibleEvents = events.slice(0, playhead + 1);
  const latestByDevice = {};
  visibleEvents.forEach(e => { latestByDevice[e.device_id] = e; });

  const mapCenter = Object.values(devicePositions)[0]
    ? [Object.values(devicePositions)[0].lat, Object.values(devicePositions)[0].lng]
    : [54.0, 24.0];

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
          EVENT REPLAY
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

          {/* Time window */}
          <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)' }}>
            <Typography sx={{ color: '#00ff41', fontFamily: 'monospace', fontSize: '0.65rem', letterSpacing: 2, mb: 1.5 }}>
              TIME WINDOW
            </Typography>
            <Stack spacing={1}>
              <Box component="input" type="datetime-local" value={startInput} onChange={e => setStartInput(e.target.value)} style={darkInputStyle} />
              <Box component="input" type="datetime-local" value={endInput} onChange={e => setEndInput(e.target.value)} style={darkInputStyle} />
              <Box
                component="button"
                onClick={() => {
                  setPlayhead(0);
                  setPlaying(false);
                  setQueryParams({ start: new Date(startInput).toISOString(), end: new Date(endInput).toISOString() });
                }}
                sx={{
                  px: 2, py: 0.75, bgcolor: 'transparent', cursor: 'pointer',
                  border: '1px solid #00ff41', color: '#00ff41',
                  fontFamily: 'monospace', fontSize: '0.75rem', letterSpacing: 1,
                  '&:hover': { bgcolor: 'rgba(0,255,65,0.1)' },
                }}
              >
                LOAD EVENTS
              </Box>
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
              Failed to load events.
            </Typography>
          )}
          {queryParams && !isLoading && events.length === 0 && (
            <Typography sx={{ color: '#546e7a', fontFamily: 'monospace', fontSize: '0.8rem' }}>
              No events found in this time window.
            </Typography>
          )}

          {/* Playback controls */}
          {events.length > 0 && (
            <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)' }}>
              <Typography sx={{ color: '#00ff41', fontFamily: 'monospace', fontSize: '0.65rem', letterSpacing: 2, mb: 1.5 }}>
                PLAYBACK
              </Typography>

              <Box sx={{ mb: 1.5 }}>
                <Box
                  component="input"
                  type="range"
                  min={0}
                  max={events.length - 1}
                  value={playhead}
                  onChange={e => { setPlayhead(Number(e.target.value)); setPlaying(false); }}
                  style={{ width: '100%', accentColor: '#00ff41', cursor: 'pointer' }}
                />
              </Box>

              <Stack direction="row" spacing={1} alignItems="center">
                <IconButton
                  onClick={() => setPlayhead(p => Math.max(0, p - 1))}
                  size="small"
                  sx={{ color: '#78909c', '&:hover': { color: '#00ff41' } }}
                >
                  <SkipPrevious />
                </IconButton>
                <IconButton
                  onClick={() => setPlaying(v => !v)}
                  sx={{ color: '#00ff41', bgcolor: 'rgba(0,255,65,0.1)', '&:hover': { bgcolor: 'rgba(0,255,65,0.2)' } }}
                >
                  {playing ? <Pause /> : <PlayArrow />}
                </IconButton>
                <IconButton
                  onClick={() => setPlayhead(p => Math.min(events.length - 1, p + 1))}
                  size="small"
                  sx={{ color: '#78909c', '&:hover': { color: '#00ff41' } }}
                >
                  <SkipNext />
                </IconButton>

                <Typography sx={{ color: '#546e7a', fontFamily: 'monospace', fontSize: '0.7rem', ml: 1 }}>SPEED:</Typography>
                {[1, 2, 5, 10].map(s => (
                  <Box
                    key={s}
                    component="button"
                    onClick={() => setSpeed(s)}
                    sx={{
                      px: 1, py: 0.25, cursor: 'pointer', fontFamily: 'monospace', fontSize: '0.7rem',
                      border: '1px solid',
                      borderColor: speed === s ? '#00ff41' : 'rgba(255,255,255,0.15)',
                      bgcolor: speed === s ? '#00ff41' : 'transparent',
                      color: speed === s ? '#0a0e27' : '#90a4ae',
                      '&:hover': { borderColor: '#00ff41', color: speed === s ? '#0a0e27' : '#00ff41' },
                    }}
                  >
                    {s}×
                  </Box>
                ))}
              </Stack>

              <Typography sx={{ color: '#546e7a', fontFamily: 'monospace', fontSize: '0.7rem', mt: 0.75, textAlign: 'right' }}>
                {playhead + 1} / {events.length}
              </Typography>
            </Box>
          )}

          {/* Current event detail */}
          {currentEvent && (
            <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)' }}>
              <Typography sx={{ color: '#00ff41', fontFamily: 'monospace', fontSize: '0.65rem', letterSpacing: 2, mb: 1 }}>
                CURRENT EVENT
              </Typography>
              <Stack direction="row" spacing={1.5} alignItems="center" mb={0.75}>
                {(() => {
                  const color = MSG_TYPE_COLOR[currentEvent.message_type] || '#90a4ae';
                  return (
                    <Box sx={{ px: 0.75, py: 0.25, bgcolor: `${color}22`, border: `1px solid ${color}` }}>
                      <Typography sx={{ color, fontFamily: 'monospace', fontSize: '0.65rem', letterSpacing: 1 }}>
                        {currentEvent.message_type?.toUpperCase()}
                      </Typography>
                    </Box>
                  );
                })()}
                <Typography sx={{ color: '#78909c', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                  {new Date(currentEvent.timestamp).toLocaleString()}
                </Typography>
              </Stack>
              <Typography sx={{ color: '#e0e0e0', fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 600, mb: 0.5 }}>
                {currentEvent.device_name}
              </Typography>
              <Typography
                component="pre"
                sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', color: '#90a4ae', fontSize: '0.75rem' }}
              >
                {JSON.stringify(currentEvent.data, null, 2)}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Right panel: map */}
        <Box sx={{ flex: 1, border: '1px solid rgba(255,255,255,0.12)', overflow: 'hidden', position: 'relative', minHeight: 0 }}>
          <MapContainer center={mapCenter} zoom={10} style={{ height: '100%', width: '100%' }}>
          <TileLayer
          attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
          url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
        /> 
            {Object.entries(devicePositions).map(([id, pos]) => (
              <DotMarker key={id} center={[pos.lat, pos.lng]}>
                <Popup>{pos.name}</Popup>
              </DotMarker>
            ))}
            {Object.values(latestByDevice).map(e => e.latitude && e.longitude && (
              <Circle
                key={e.device_id}
                center={[e.latitude, e.longitude]}
                radius={300}
                pathOptions={{ color: '#f44336', fillColor: '#f44336', fillOpacity: 0.3 }}
              />
            ))}
          </MapContainer>
          {!queryParams && (
            <Box sx={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              bgcolor: 'rgba(10,14,39,0.6)', pointerEvents: 'none',
            }}>
              <Typography sx={{ color: '#546e7a', fontFamily: 'monospace', fontSize: '0.8rem', letterSpacing: 1 }}>
                LOAD A TIME WINDOW TO BEGIN
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </AdminPageLayout>
  );
}
