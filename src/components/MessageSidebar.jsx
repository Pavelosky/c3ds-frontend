import { useState } from 'react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import { useMessages } from '../hooks/useMessages';
import MessageCard from './MessageCard';
import MessageFilters from './MessageFilters';

/**
 * MessageSidebar Component
 *
 * Left sidebar displaying device messages with filtering capabilities.
 * Updates every 10 seconds via polling for near-real-time message display.
 *
 * Features:
 * - Filter messages by type (alert/heartbeat) and time window
 * - Automatic refresh every 10 seconds
 * - Scrollable message list
 * - Loading and error states
 * - Message count badge
 * - Empty state handling
 *
 * Layout:
 * - Fixed width (320px)
 * - Full height sidebar on left side of dashboard
 * - Sticky header with filters
 * - Scrollable message list
 */
function MessageSidebar() {
  // Filter state
  const [filters, setFilters] = useState({
    message_type: '', // Empty string = all types
    time_window: 'all', // Default to all messages
    limit: 50,
  });

  // Fetch messages with current filters
  const { data: messages, isLoading, error } = useMessages(filters);

  return (
    <Box
      sx={{
        width: '480px',
        height: '100%',
        bgcolor: '#ffffff',
        borderRight: 2,
        borderColor: '#003f87',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: 2,
          borderColor: '#003f87',
          bgcolor: '#003f87',
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <Typography
            variant="h6"
            sx={{
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '1rem',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            MESSAGES
          </Typography>

          {/* Message Count Badge */}
          {!isLoading && messages && (
            <Box
              sx={{
                bgcolor: '#ffffff',
                color: '#003f87',
                px: 1,
                py: 0.2,
                borderRadius: 1,
                fontSize: '0.7rem',
                fontWeight: 700,
              }}
            >
              {messages.length}
            </Box>
          )}
        </Box>

        {/* Filters */}
        <MessageFilters filters={filters} onFilterChange={setFilters} />
      </Box>

      {/* Message List */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 2,
          bgcolor: '#f5f5f5',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            bgcolor: '#e0e0e0',
          },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: '#003f87',
            borderRadius: 0,
            '&:hover': {
              bgcolor: '#1565c0',
            },
          },
        }}
      >
        {/* Loading State */}
        {isLoading && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 4,
            }}
          >
            <CircularProgress size={32} sx={{ color: '#003f87', mb: 2 }} />
            <Typography
              variant="caption"
              sx={{
                color: '#546e7a',
                fontSize: '0.75rem',
              }}
            >
              Loading messages...
            </Typography>
          </Box>
        )}

        {/* Error State */}
        {error && (
          <Alert
            severity="error"
            sx={{
              bgcolor: 'rgba(211, 47, 47, 0.1)',
              color: '#ef5350',
              border: 1,
              borderColor: '#d32f2f',
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              borderRadius: 0,
              '& .MuiAlert-icon': {
                color: '#ef5350',
              },
            }}
          >
            ERROR: {error.message}
          </Alert>
        )}

        {/* Empty State */}
        {!isLoading && !error && messages && messages.length === 0 && (
          <Box
            sx={{
              textAlign: 'center',
              py: 4,
              px: 2,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: '#546e7a',
                fontSize: '0.8rem',
                mb: 1,
              }}
            >
              No messages found
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: '#78909c',
                fontSize: '0.7rem',
              }}
            >
              {filters.message_type
                ? 'Try adjusting filters'
                : 'Awaiting device transmissions...'}
            </Typography>
          </Box>
        )}

        {/* Message Cards */}
        {!isLoading &&
          !error &&
          messages &&
          messages.map((message) => (
            <MessageCard key={message.id} message={message} />
          ))}
      </Box>
    </Box>
  );
}

export default MessageSidebar;