import { useState, useMemo } from 'react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import { useMessages } from '../hooks/useMessages';
import DeviceMessageGroup from './DeviceMessageGroup';
import MessageFilters from './MessageFilters';
import SidebarStats from './SidebarStats';

/**
 * MessageSidebar Component
 *
 * Left sidebar displaying device messages grouped by device with filtering capabilities.
 * Updates every 10 seconds via polling for near-real-time message display.
 *
 * Features:
 * - Statistics section showing alerts (2h) and active devices count
 * - Messages grouped by device (expandable/collapsible)
 * - Filter messages by type (alert/heartbeat) and time window
 * - Automatic refresh every 10 seconds
 * - Scrollable message list
 * - Loading and error states
 * - Message count badge
 * - Empty state handling
 *
 * Layout:
 * - Fixed width (480px)
 * - Full height sidebar on left side of dashboard
 * - Sticky header with stats and filters
 * - Scrollable message list
 */
function MessageSidebar() {
  // Filter state
  const [filters, setFilters] = useState({
    message_type: '', // Empty string = all types
    time_window: 'all', // Default to all messages
    limit: 200, // Maximum allowed by backend to show more devices
  });

  // Selected message for detail view
  const [selectedMessage, setSelectedMessage] = useState(null);

  // Fetch messages with current filters
  const { data: messages, isLoading, error } = useMessages(filters);

  // Group messages by device (device with latest message first)
  const groupedMessages = useMemo(() => {
    if (!messages) return [];

    // Group messages by device_id
    const groups = messages.reduce((acc, message) => {
      const deviceId = message.device;
      if (!acc[deviceId]) {
        acc[deviceId] = {
          deviceId,
          deviceName: message.device_name,
          messages: [],
        };
      }
      acc[deviceId].messages.push(message);
      return acc;
    }, {});

    // Convert to array and sort by latest message timestamp
    return Object.values(groups).sort((a, b) => {
      const aLatest = new Date(a.messages[0].timestamp);
      const bLatest = new Date(b.messages[0].timestamp);
      return bLatest - aLatest; // Newest first
    });
  }, [messages]);

  // Handle message click
  const handleMessageClick = (message) => {
    setSelectedMessage(message);
    // TODO: Show message detail in modal or detail panel
    console.log('Message clicked:', message);
  };

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
        {/* Statistics */}
        <SidebarStats />

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
        {!isLoading && !error && groupedMessages && groupedMessages.length === 0 && (
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

        {/* Device Message Groups */}
        {!isLoading &&
          !error &&
          groupedMessages &&
          groupedMessages.map((group) => (
            <DeviceMessageGroup
              key={group.deviceId}
              deviceId={group.deviceId}
              deviceName={group.deviceName}
              messages={group.messages}
              onMessageClick={handleMessageClick}
            />
          ))}
      </Box>
    </Box>
  );
}

export default MessageSidebar;