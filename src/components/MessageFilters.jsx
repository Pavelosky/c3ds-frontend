import { Box, Typography, ToggleButtonGroup, ToggleButton } from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ViewListIcon from '@mui/icons-material/ViewList';

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
  const handleMessageTypeChange = (_event, newType) => {
    // If user clicks the same button, allow deselection (newType will be null)
    onFilterChange({ ...filters, message_type: newType || '' });
  };

  const handleTimeWindowChange = (_event, newValue) => {
    // If user clicks the same button, don't allow deselection for time window
    if (newValue !== null) {
      onFilterChange({ ...filters, time_window: newValue });
    }
  };

  return (
    <Box
      sx={{
        pb: 1.5,
      }}
    >
      {/* Message Type Filter - Toggle Buttons */}
      <Box sx={{ mb: 1 }}>
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
        <ToggleButtonGroup
          value={filters.message_type || ''}
          exclusive
          onChange={handleMessageTypeChange}
          fullWidth
          size="small"
          sx={{
            '& .MuiToggleButtonGroup-grouped': {
              border: 2,
              borderColor: '#003f87',
              '&:not(:first-of-type)': {
                borderLeft: 2,
                borderColor: '#003f87',
                marginLeft: 0,
              },
              '&:first-of-type': {
                borderRadius: 0,
              },
              '&:last-of-type': {
                borderRadius: 0,
              },
            },
          }}
        >
          <ToggleButton
            value=""
            sx={{
              bgcolor: filters.message_type === '' ? '#ffffff' : 'rgba(255, 255, 255, 0.1)',
              color: filters.message_type === '' ? '#003f87' : '#ffffff',
              fontSize: '0.7rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              py: 0.5,
              '&:hover': {
                bgcolor: filters.message_type === '' ? '#ffffff' : 'rgba(255, 255, 255, 0.2)',
              },
              '&.Mui-selected': {
                bgcolor: '#ffffff',
                color: '#003f87',
                '&:hover': {
                  bgcolor: '#ffffff',
                },
              },
            }}
          >
            <ViewListIcon sx={{ fontSize: '1rem', mr: 0.5 }} />
            All
          </ToggleButton>
          <ToggleButton
            value="alert"
            sx={{
              bgcolor: filters.message_type === 'alert' ? '#d32f2f' : 'rgba(255, 255, 255, 0.1)',
              color: '#ffffff',
              fontSize: '0.7rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              py: 0.5,
              '&:hover': {
                bgcolor: filters.message_type === 'alert' ? '#c62828' : 'rgba(211, 47, 47, 0.3)',
              },
              '&.Mui-selected': {
                bgcolor: '#d32f2f',
                color: '#ffffff',
                '&:hover': {
                  bgcolor: '#c62828',
                },
              },
            }}
          >
            <WarningIcon sx={{ fontSize: '1rem', mr: 0.5 }} />
            Alert
          </ToggleButton>
          <ToggleButton
            value="heartbeat"
            sx={{
              bgcolor: filters.message_type === 'heartbeat' ? '#0288d1' : 'rgba(255, 255, 255, 0.1)',
              color: '#ffffff',
              fontSize: '0.7rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              py: 0.5,
              '&:hover': {
                bgcolor: filters.message_type === 'heartbeat' ? '#0277bd' : 'rgba(2, 136, 209, 0.3)',
              },
              '&.Mui-selected': {
                bgcolor: '#0288d1',
                color: '#ffffff',
                '&:hover': {
                  bgcolor: '#0277bd',
                },
              },
            }}
          >
            <FavoriteIcon sx={{ fontSize: '1rem', mr: 0.5 }} />
            Heartbeat
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Time Window Filter - Toggle Buttons */}
      <Box>
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
        <ToggleButtonGroup
          value={filters.time_window || 'all'}
          exclusive
          onChange={handleTimeWindowChange}
          fullWidth
          size="small"
          sx={{
            '& .MuiToggleButtonGroup-grouped': {
              border: 2,
              borderColor: '#003f87',
              '&:not(:first-of-type)': {
                borderLeft: 2,
                borderColor: '#003f87',
                marginLeft: 0,
              },
              '&:first-of-type': {
                borderRadius: 0,
              },
              '&:last-of-type': {
                borderRadius: 0,
              },
            },
          }}
        >
          <ToggleButton
            value="1h"
            sx={{
              bgcolor: filters.time_window === '1h' ? '#ffffff' : 'rgba(255, 255, 255, 0.1)',
              color: filters.time_window === '1h' ? '#003f87' : '#ffffff',
              fontSize: '0.65rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              py: 0.5,
              '&:hover': {
                bgcolor: filters.time_window === '1h' ? '#ffffff' : 'rgba(255, 255, 255, 0.2)',
              },
              '&.Mui-selected': {
                bgcolor: '#ffffff',
                color: '#003f87',
                '&:hover': {
                  bgcolor: '#ffffff',
                },
              },
            }}
          >
            1h
          </ToggleButton>
          <ToggleButton
            value="6h"
            sx={{
              bgcolor: filters.time_window === '6h' ? '#ffffff' : 'rgba(255, 255, 255, 0.1)',
              color: filters.time_window === '6h' ? '#003f87' : '#ffffff',
              fontSize: '0.65rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              py: 0.5,
              '&:hover': {
                bgcolor: filters.time_window === '6h' ? '#ffffff' : 'rgba(255, 255, 255, 0.2)',
              },
              '&.Mui-selected': {
                bgcolor: '#ffffff',
                color: '#003f87',
                '&:hover': {
                  bgcolor: '#ffffff',
                },
              },
            }}
          >
            6h
          </ToggleButton>
          <ToggleButton
            value="24h"
            sx={{
              bgcolor: filters.time_window === '24h' ? '#ffffff' : 'rgba(255, 255, 255, 0.1)',
              color: filters.time_window === '24h' ? '#003f87' : '#ffffff',
              fontSize: '0.65rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              py: 0.5,
              '&:hover': {
                bgcolor: filters.time_window === '24h' ? '#ffffff' : 'rgba(255, 255, 255, 0.2)',
              },
              '&.Mui-selected': {
                bgcolor: '#ffffff',
                color: '#003f87',
                '&:hover': {
                  bgcolor: '#ffffff',
                },
              },
            }}
          >
            24h
          </ToggleButton>
          <ToggleButton
            value="7d"
            sx={{
              bgcolor: filters.time_window === '7d' ? '#ffffff' : 'rgba(255, 255, 255, 0.1)',
              color: filters.time_window === '7d' ? '#003f87' : '#ffffff',
              fontSize: '0.65rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              py: 0.5,
              '&:hover': {
                bgcolor: filters.time_window === '7d' ? '#ffffff' : 'rgba(255, 255, 255, 0.2)',
              },
              '&.Mui-selected': {
                bgcolor: '#ffffff',
                color: '#003f87',
                '&:hover': {
                  bgcolor: '#ffffff',
                },
              },
            }}
          >
            7d
          </ToggleButton>
          <ToggleButton
            value="all"
            sx={{
              bgcolor: filters.time_window === 'all' ? '#ffffff' : 'rgba(255, 255, 255, 0.1)',
              color: filters.time_window === 'all' ? '#003f87' : '#ffffff',
              fontSize: '0.65rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              py: 0.5,
              '&:hover': {
                bgcolor: filters.time_window === 'all' ? '#ffffff' : 'rgba(255, 255, 255, 0.2)',
              },
              '&.Mui-selected': {
                bgcolor: '#ffffff',
                color: '#003f87',
                '&:hover': {
                  bgcolor: '#ffffff',
                },
              },
            }}
          >
            All
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
    </Box>
  );
}

export default MessageFilters;