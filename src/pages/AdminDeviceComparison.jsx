import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Typography, Button, TextField, Stack, Paper,
  Select, MenuItem, FormControl, InputLabel, Chip,
  CircularProgress, Alert, Autocomplete,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { BaseLayout } from '../components/BaseLayout';
import { adminAPI } from '../api/client';
import { devicesAPI } from '../api/client';

const COLOURS = ['#1976d2', '#d32f2f', '#388e3c', '#f57c00', '#7b1fa2'];

const DEFAULT_START = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
const DEFAULT_END = new Date().toISOString().slice(0, 16);

export default function AdminDeviceComparison() {
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [metric, setMetric] = useState('detection_rate');
  const [startInput, setStartInput] = useState(DEFAULT_START);
  const [endInput, setEndInput] = useState(DEFAULT_END);
  const [queryParams, setQueryParams] = useState(null);

  // Load all devices for the selector
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

  // Merge all series into a unified time-indexed dataset for Recharts
  const allTimes = [...new Set(
    Object.values(series).flatMap(s => s.data.map(d => d.time))
  )].sort();

  const chartData = allTimes.map(time => {
    const row = { time: new Date(time).toLocaleString() };
    Object.entries(series).forEach(([deviceId, s]) => {
      const point = s.data.find(d => d.time === time);
      row[s.device_name] = point ? point.value : null;
    });
    return row;
  });

  const deviceNames = Object.values(series).map(s => s.device_name);
  const unit = Object.values(series)[0]?.unit || '';

  return (
    <BaseLayout>
      <Box p={3}>
        <Button startIcon={<ArrowBack />} component={RouterLink} to="/c3ds-admin" sx={{ mb: 2 }}>
          Back to Admin
        </Button>
        <Typography variant="h5" fontWeight={700} mb={3}>Device Comparison</Typography>

        <Paper sx={{ p: 2, mb: 3 }}>
          <Stack spacing={2}>
            <Autocomplete
              multiple
              options={allDevices}
              getOptionLabel={d => d.name}
              value={allDevices.filter(d => selectedDevices.includes(d.id))}
              onChange={(_, v) => setSelectedDevices(v.map(d => d.id).slice(0, 5))}
              renderTags={(value, getTagProps) =>
                value.map((d, i) => <Chip label={d.name} {...getTagProps({ index: i })} key={d.id} />)
              }
              renderInput={(params) => (
                <TextField {...params} label="Select devices (max 5)" size="small" />
              )}
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-end">
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>Metric</InputLabel>
                <Select value={metric} label="Metric" onChange={e => setMetric(e.target.value)}>
                  <MenuItem value="detection_rate">Detection Rate (msg/hour)</MenuItem>
                  <MenuItem value="check_in_interval">Check-in Interval (seconds)</MenuItem>
                </Select>
              </FormControl>
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
                disabled={selectedDevices.length < 2}
                onClick={() => setQueryParams({
                  device_ids: selectedDevices.join(','),
                  metric,
                  start: new Date(startInput).toISOString(),
                  end: new Date(endInput).toISOString(),
                })}
              >
                Compare
              </Button>
            </Stack>
            {selectedDevices.length < 2 && (
              <Alert severity="info" sx={{ py: 0 }}>Select at least 2 devices to compare.</Alert>
            )}
          </Stack>
        </Paper>

        {isLoading && <CircularProgress />}
        {isError && <Alert severity="error">Failed to load comparison data.</Alert>}

        {chartData.length > 0 && (
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              {metric === 'detection_rate' ? 'Detection Rate' : 'Check-in Interval'} — {unit}
            </Typography>
            <ResponsiveContainer width="100%" height={380}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                <YAxis unit={unit.split('/')[0] === unit ? '' : `/${unit.split('/')[1]}`} />
                <Tooltip />
                <Legend />
                {deviceNames.map((name, i) => (
                  <Line
                    key={name}
                    type="monotone"
                    dataKey={name}
                    stroke={COLOURS[i % COLOURS.length]}
                    dot={false}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        )}
      </Box>
    </BaseLayout>
  );
}
