import { Box, Select, MenuItem, FormControl, Typography } from '@mui/material';

/**
 * MessageFilters Component
 *
 * Filter controls for message list.
 * Allows filtering by message type and time window.
 *
 * Features:
 * - Message Type filter: All, Alert, Heartbeat
 * - Time Window filter: Last Hour, Last 24h, Last 7 days, All Time
 * - Military/tactical styling consistent with dashboard theme
 *
 * @param {Object} filters - Current filter values
 * @param {string} filters.message_type - Current message type filter
 * @param {string} filters.time_window - Current time window filter
 * @param {Function} onFilterChange - Callback when filters change
 */
function MessageFilters({ filters, onFilterChange }) {
  const handleMessageTypeChange = (event) => {
    onFilterChange({ ...filters, message_type: event.target.value });
  };

  const handleTimeWindowChange = (event) => {
    onFilterChange({ ...filters, time_window: event.target.value });
  };

  return (
    <Box
      sx={{
        pb: 1.5,
      }}
    >
      {/* Message Type Filter */}
      <FormControl fullWidth size="small" sx={{ mb: 1 }}>
        <Typography
          variant="caption"
          sx={{
            color: '#ffffff',
            fontSize: '0.7rem',
            fontWeight: 600,
            mb: 0.5,
            display: 'block',
          }}
        >
          Message Type
        </Typography>
        <Select
          value={filters.message_type || ''}
          onChange={handleMessageTypeChange}
          displayEmpty
          sx={{
            bgcolor: '#ffffff',
            fontSize: '0.85rem',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: '#003f87',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#1565c0',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#003f87',
              borderWidth: 2,
            },
          }}
        >
          <MenuItem value="" sx={{ fontSize: '0.85rem' }}>
            All Types
          </MenuItem>
          <MenuItem value="alert" sx={{ fontSize: '0.85rem', color: '#d32f2f' }}>
            Alert
          </MenuItem>
          <MenuItem value="heartbeat" sx={{ fontSize: '0.85rem', color: '#0288d1' }}>
            Heartbeat
          </MenuItem>
        </Select>
      </FormControl>

      {/* Time Window Filter */}
      <FormControl fullWidth size="small">
        <Typography
          variant="caption"
          sx={{
            color: '#ffffff',
            fontSize: '0.7rem',
            fontWeight: 600,
            mb: 0.5,
            display: 'block',
          }}
        >
          Time Window
        </Typography>
        <Select
          value={filters.time_window || 'all'}
          onChange={handleTimeWindowChange}
          sx={{
            bgcolor: '#ffffff',
            fontSize: '0.85rem',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: '#003f87',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#1565c0',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#003f87',
              borderWidth: 2,
            },
          }}
        >
          <MenuItem value="1h" sx={{ fontSize: '0.85rem' }}>
            Last Hour
          </MenuItem>
          <MenuItem value="24h" sx={{ fontSize: '0.85rem' }}>
            Last 24 Hours
          </MenuItem>
          <MenuItem value="7d" sx={{ fontSize: '0.85rem' }}>
            Last 7 Days
          </MenuItem>
          <MenuItem value="all" sx={{ fontSize: '0.85rem' }}>
            All Time
          </MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
}

export default MessageFilters;