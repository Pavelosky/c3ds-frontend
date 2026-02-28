import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Typography, Stack, Select, MenuItem, FormControl,
  Chip, CircularProgress, Autocomplete, TextField,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import AdminPageLayout from '../components/AdminPageLayout';
import { adminAPI, devicesAPI } from '../api/client';

const COLOURS = ['#00ff41', '#f44336', '#2196f3', '#ff9800', '#9c27b0'];

const DEFAULT_START = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
const DEFAULT_END = new Date().toISOString().slice(0, 16);

const darkInputStyle = {
  background: 'rgba(255,255,255,0.06)', color: '#e0e0e0',
  border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4,
  padding: '4px 8px', fontSize: '0.8rem', fontFamily: 'monospace',
  colorScheme: 'dark',
};

const darkSelectSx = {
  color: '#e0e0e0', fontFamily: 'monospace', fontSize: '0.8rem',
  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.15)' },
  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
  '& .MuiSvgIcon-root': { color: '#90a4ae' },
};

export default function AdminDeviceComparison() {
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [metric, setMetric] = useState('detection_rate');
  const [startInput, setStartInput] = useState(DEFAULT_START);
  const [endInput, setEndInput] = useState(DEFAULT_END);
  const [queryParams, setQueryParams] = useState(null);

  const { data: devicesData } = useQuery({
    queryKey: ['public-devices'],
    queryFn: () => devicesAPI.getDevices().then(r => r.data),
  });
  const allDevices = devicesData?.results || devicesData || [];

  const { data, isLoading, isError } = useQuery({
    queryKey: ['device-compare', queryParams],
    queryFn: () => adminAPI.compareDevices({
      device_ids: queryParams.device_ids,
      metric: queryParams.metric,
      start: queryParams.start,
      end: queryParams.end,
    }).then(r => r.data),
    enabled: !!queryParams,
  });

  const series = data?.series || {};
  const allTimes = [...new Set(
    Object.values(series).flatMap(s => s.data.map(d => d.time))
  )].sort();
  const chartData = allTimes.map(time => {
    const row = { time: new Date(time).toLocaleString() };
    Object.values(series).forEach(s => {
      const point = s.data.find(d => d.time === time);
      row[s.device_name] = point ? point.value : null;
    });
    return row;
  });
  const deviceNames = Object.values(series).map(s => s.device_name);
  const unit = Object.values(series)[0]?.unit || '';

  return (
    <AdminPageLayout>
      <Box
        component={RouterLink}
        to="/c3ds-admin"
        sx={{
          display: 'inline-flex', alignItems: 'center', gap: 0.5, mb: 2,
          color: '#90a4ae', fontFamily: 'monospace', fontSize: '0.75rem',
          textDecoration: 'none', letterSpacing: 1,
          '&:hover': { color: '#00ff41' },
        }}
      >
        <ArrowBack sx={{ fontSize: 16 }} /> BACK TO ADMIN
      </Box>

      <Typography sx={{ color: '#e0e0e0', fontFamily: 'monospace', fontWeight: 700, fontSize: '1.1rem', letterSpacing: 1, mb: 3 }}>
        DEVICE COMPARISON
      </Typography>

      {/* Controls */}
      <Box sx={{ p: 2, mb: 3, bgcolor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)' }}>
        <Typography sx={{ color: '#00ff41', fontFamily: 'monospace', fontSize: '0.65rem', letterSpacing: 2, mb: 1.5 }}>
          PARAMETERS
        </Typography>
        <Stack spacing={2}>
          <Autocomplete
            multiple
            options={allDevices}
            getOptionLabel={d => d.name}
            value={allDevices.filter(d => selectedDevices.includes(d.id))}
            onChange={(_, v) => setSelectedDevices(v.map(d => d.id).slice(0, 5))}
            renderTags={(value, getTagProps) =>
              value.map((d, i) => (
                <Chip
                  label={d.name}
                  {...getTagProps({ index: i })}
                  key={d.id}
                  sx={{
                    bgcolor: 'rgba(0,255,65,0.12)', color: '#00ff41',
                    border: '1px solid #00ff41', fontFamily: 'monospace', fontSize: '0.7rem',
                    height: 22,
                  }}
                />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Select devices (max 5)"
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#e0e0e0', fontFamily: 'monospace', fontSize: '0.8rem',
                    bgcolor: 'rgba(255,255,255,0.04)',
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' },
                    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                  },
                  '& .MuiInputBase-input::placeholder': { color: '#546e7a' },
                }}
              />
            )}
            PaperComponent={({ children, ...props }) => (
              <Box {...props} sx={{ bgcolor: '#1a1f3e', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 1 }}>
                {children}
              </Box>
            )}
            sx={{ '& .MuiAutocomplete-option': { fontFamily: 'monospace', fontSize: '0.8rem' } }}
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 220 }}>
              <Select value={metric} onChange={e => setMetric(e.target.value)} sx={darkSelectSx}>
                <MenuItem value="detection_rate" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>Detection Rate (msg/hour)</MenuItem>
                <MenuItem value="check_in_interval" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>Check-in Interval (seconds)</MenuItem>
              </Select>
            </FormControl>

            <Box component="input" type="datetime-local" value={startInput} onChange={e => setStartInput(e.target.value)} style={darkInputStyle} />
            <Typography sx={{ color: '#546e7a' }}>→</Typography>
            <Box component="input" type="datetime-local" value={endInput} onChange={e => setEndInput(e.target.value)} style={darkInputStyle} />

            <Box
              component="button"
              disabled={selectedDevices.length < 2}
              onClick={() => setQueryParams({
                device_ids: selectedDevices.join(','),
                metric,
                start: new Date(startInput).toISOString(),
                end: new Date(endInput).toISOString(),
              })}
              sx={{
                px: 2, py: 0.75, bgcolor: 'transparent', cursor: 'pointer',
                border: '1px solid #00ff41', color: '#00ff41',
                fontFamily: 'monospace', fontSize: '0.75rem', letterSpacing: 1,
                '&:hover': { bgcolor: 'rgba(0,255,65,0.1)' },
                '&:disabled': { borderColor: '#546e7a', color: '#546e7a', cursor: 'not-allowed' },
              }}
            >
              COMPARE
            </Box>
          </Stack>

          {selectedDevices.length < 2 && (
            <Typography sx={{ color: '#546e7a', fontFamily: 'monospace', fontSize: '0.75rem' }}>
              Select at least 2 devices to compare.
            </Typography>
          )}
        </Stack>
      </Box>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4 }}>
          <CircularProgress size={24} sx={{ color: '#00ff41' }} />
        </Box>
      )}
      {isError && (
        <Typography sx={{ color: '#f44336', fontFamily: 'monospace', fontSize: '0.8rem' }}>
          Failed to load comparison data.
        </Typography>
      )}

      {chartData.length > 0 && (
        <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)' }}>
          <Typography sx={{ color: '#00ff41', fontFamily: 'monospace', fontSize: '0.65rem', letterSpacing: 2, mb: 1.5 }}>
            {metric === 'detection_rate' ? 'DETECTION RATE' : 'CHECK-IN INTERVAL'} — {unit.toUpperCase()}
          </Typography>
          <ResponsiveContainer width="100%" height={380}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="time" tick={{ fill: '#78909c', fontSize: 10, fontFamily: 'monospace' }} axisLine={{ stroke: 'rgba(255,255,255,0.12)' }} tickLine={false} />
              <YAxis tick={{ fill: '#78909c', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#1a1f3e', border: '1px solid rgba(255,255,255,0.15)', fontSize: '0.75rem', fontFamily: 'monospace' }}
                labelStyle={{ color: '#90a4ae' }}
              />
              <Legend wrapperStyle={{ fontSize: '0.7rem', fontFamily: 'monospace', color: '#90a4ae' }} />
              {deviceNames.map((name, i) => (
                <Line key={name} type="monotone" dataKey={name} stroke={COLOURS[i % COLOURS.length]} dot={false} connectNulls strokeWidth={1.5} isAnimationActive={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </Box>
      )}
    </AdminPageLayout>
  );
}
