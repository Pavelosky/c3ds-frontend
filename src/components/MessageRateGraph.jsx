import { useState, useMemo, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Typography, CircularProgress, Select, MenuItem,
  FormControl, Button,
} from '@mui/material';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts';
import { format, subDays } from 'date-fns';
import { adminAPI } from '../api/client';

const TYPE_COLORS = {
  alert: '#f44336',
  heartbeat: '#00ff41',
  status: '#2196f3',
};
const FALLBACK_COLORS = ['#ff9800', '#e91e63', '#9c27b0', '#00bcd4'];

function getLineColor(type, index) {
  return TYPE_COLORS[type] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

const BUCKET_OPTIONS = [
  { value: 'minute', label: 'Per Minute' },
  { value: 'hour', label: 'Per Hour' },
  { value: 'day', label: 'Per Day' },
];

function toLocalDatetimeInput(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatBucket(isoStr, bucket) {
  const d = new Date(isoStr);
  if (bucket === 'day') return format(d, 'MMM d');
  return format(d, 'MMM d HH:mm');
}

// Zoom factor per scroll tick (10% zoom in/out)
const ZOOM_FACTOR = 0.1;
// Minimum number of buckets to keep visible
const MIN_VISIBLE = 3;

export default function MessageRateGraph() {
  const now = new Date();
  const [start, setStart] = useState(toLocalDatetimeInput(subDays(now, 30)));
  const [end, setEnd] = useState(toLocalDatetimeInput(now));
  const [bucket, setBucket] = useState('day');

  // viewWindow: [startIndex, endIndex] into chartData; null = show all
  const [viewWindow, setViewWindow] = useState(null);
  const chartBoxRef = useRef(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['message-rate', start, end, bucket],
    queryFn: () => adminAPI.getMessageRate({
      start: new Date(start).toISOString(),
      end: new Date(end).toISOString(),
      bucket,
    }).then(r => r.data),
    refetchInterval: 60000,
    // Reset zoom when data changes
    onSuccess: () => setViewWindow(null),
  });

  const { chartData, types } = useMemo(() => {
    if (!data) return { chartData: [], types: [] };
    return { chartData: data.data || [], types: data.message_types || [] };
  }, [data]);

  // Reset zoom when inputs change
  const handleStartChange = (v) => { setStart(v); setViewWindow(null); };
  const handleEndChange = (v) => { setEnd(v); setViewWindow(null); };
  const handleBucketChange = (v) => { setBucket(v); setViewWindow(null); };

  const visibleData = useMemo(() => {
    if (!viewWindow || chartData.length === 0) return chartData;
    return chartData.slice(viewWindow[0], viewWindow[1] + 1);
  }, [chartData, viewWindow]);

  const handleWheel = useCallback((e) => {
    if (chartData.length === 0) return;
    e.preventDefault();

    const total = chartData.length;
    const [lo, hi] = viewWindow ?? [0, total - 1];
    const visible = hi - lo + 1;

    // Determine where the mouse is horizontally as a fraction (0 = left, 1 = right)
    const rect = chartBoxRef.current?.getBoundingClientRect();
    const fraction = rect
      ? Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
      : 0.5;

    // How many buckets to remove from each side
    const delta = Math.max(1, Math.round(visible * ZOOM_FACTOR));
    const zoomIn = e.deltaY < 0;

    let newLo, newHi;
    if (zoomIn) {
      // Shrink window around mouse position
      newLo = Math.min(lo + Math.round(delta * fraction), lo + Math.round(delta));
      newHi = Math.max(hi - Math.round(delta * (1 - fraction)), hi - Math.round(delta));
      // Enforce minimum window size
      if (newHi - newLo + 1 < MIN_VISIBLE) return;
    } else {
      // Expand window
      newLo = Math.max(0, lo - Math.round(delta * fraction));
      newHi = Math.min(total - 1, hi + Math.round(delta * (1 - fraction)));
    }

    if (newLo === lo && newHi === hi) return;
    // If fully zoomed out, reset to null (show all)
    if (newLo <= 0 && newHi >= total - 1) {
      setViewWindow(null);
    } else {
      setViewWindow([newLo, newHi]);
    }
  }, [chartData, viewWindow]);

  // Pan state (right-click drag)
  const dragRef = useRef({ active: false, startX: 0, startLo: 0, startHi: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0 || chartData.length === 0) return;
    const [lo, hi] = viewWindow ?? [0, chartData.length - 1];
    dragRef.current = { active: true, startX: e.clientX, startLo: lo, startHi: hi };
    setIsDragging(true);
    e.preventDefault();
  }, [chartData, viewWindow]);

  const handleMouseMove = useCallback((e) => {
    if (!dragRef.current.active) return;
    const rect = chartBoxRef.current?.getBoundingClientRect();
    if (!rect) return;
    const { startX, startLo, startHi } = dragRef.current;
    const visible = startHi - startLo + 1;
    const pixelDelta = e.clientX - startX;
    const bucketDelta = Math.round((pixelDelta / rect.width) * visible);
    if (bucketDelta === 0) return;
    const total = chartData.length;
    // Dragging right = panning left (earlier in time)
    let newLo = startLo - bucketDelta;
    let newHi = startHi - bucketDelta;
    // Clamp
    if (newLo < 0) { newHi -= newLo; newLo = 0; }
    if (newHi > total - 1) { newLo -= (newHi - (total - 1)); newHi = total - 1; }
    newLo = Math.max(0, newLo);
    if (newLo === (viewWindow?.[0] ?? 0) && newHi === (viewWindow?.[1] ?? total - 1)) return;
    if (newLo <= 0 && newHi >= total - 1) {
      setViewWindow(null);
    } else {
      setViewWindow([newLo, newHi]);
    }
  }, [chartData, viewWindow]);

  const handleMouseUp = useCallback(() => {
    dragRef.current.active = false;
    setIsDragging(false);
  }, []);

  const isZoomed = viewWindow !== null;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
        <Typography variant="caption" sx={{ color: '#00ff41', fontFamily: 'monospace', letterSpacing: 1, fontSize: '0.65rem' }}>
          MESSAGE RATE
        </Typography>
        <Box component="input"
          type="datetime-local"
          value={start}
          onChange={e => handleStartChange(e.target.value)}
          style={{
            background: 'rgba(255,255,255,0.06)', color: '#e0e0e0',
            border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4,
            padding: '2px 6px', fontSize: '0.7rem', fontFamily: 'monospace',
          }}
        />
        <Typography variant="caption" sx={{ color: '#546e7a' }}>→</Typography>
        <Box component="input"
          type="datetime-local"
          value={end}
          onChange={e => handleEndChange(e.target.value)}
          style={{
            background: 'rgba(255,255,255,0.06)', color: '#e0e0e0',
            border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4,
            padding: '2px 6px', fontSize: '0.7rem', fontFamily: 'monospace',
          }}
        />
        <FormControl size="small">
          <Select
            value={bucket}
            onChange={e => handleBucketChange(e.target.value)}
            sx={{
              color: '#e0e0e0', fontSize: '0.7rem', fontFamily: 'monospace',
              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.15)' },
              '& .MuiSvgIcon-root': { color: '#90a4ae' },
              height: 26,
            }}
          >
            {BUCKET_OPTIONS.map(o => (
              <MenuItem key={o.value} value={o.value} sx={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>
                {o.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {isZoomed && (
          <Button
            size="small"
            onClick={() => setViewWindow(null)}
            sx={{ color: '#546e7a', fontSize: '0.6rem', fontFamily: 'monospace', border: '1px solid rgba(255,255,255,0.12)', p: '1px 6px', borderRadius: 0, minWidth: 0, '&:hover': { color: '#00ff41', borderColor: '#00ff41' } }}
          >
            RESET ZOOM
          </Button>
        )}
        {isZoomed && (
          <Typography variant="caption" sx={{ color: '#546e7a', fontFamily: 'monospace', fontSize: '0.6rem' }}>
            {visibleData.length} / {chartData.length} buckets
          </Typography>
        )}
      </Box>

      {/* Chart */}
      <Box
        ref={chartBoxRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        sx={{ flex: 1, minHeight: 0, cursor: isDragging ? 'grabbing' : 'crosshair' }}
      >
        {isLoading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <CircularProgress size={20} sx={{ color: '#00ff41' }} />
          </Box>
        ) : error ? (
          <Typography variant="caption" sx={{ color: '#f44336', fontFamily: 'monospace' }}>{error.message}</Typography>
        ) : chartData.length === 0 ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Typography variant="caption" sx={{ color: '#546e7a', fontFamily: 'monospace' }}>
              NO DATA IN SELECTED RANGE
            </Typography>
          </Box>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={visibleData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis
                dataKey="bucket"
                tickFormatter={(v) => formatBucket(v, bucket)}
                tick={{ fill: '#78909c', fontSize: 10, fontFamily: 'monospace' }}
                axisLine={{ stroke: 'rgba(255,255,255,0.12)' }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: '#78909c', fontSize: 10, fontFamily: 'monospace' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{ background: '#1a1f3e', border: '1px solid rgba(255,255,255,0.15)', fontSize: '0.75rem', fontFamily: 'monospace' }}
                labelStyle={{ color: '#90a4ae' }}
                labelFormatter={(v) => formatBucket(v, bucket)}
              />
              <Legend wrapperStyle={{ fontSize: '0.7rem', fontFamily: 'monospace', color: '#90a4ae' }} />
              {types.map((type, i) => (
                <Line
                  key={type}
                  type="monotone"
                  dataKey={type}
                  stroke={getLineColor(type, i)}
                  dot={false}
                  strokeWidth={1.5}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </Box>
    </Box>
  );
}
