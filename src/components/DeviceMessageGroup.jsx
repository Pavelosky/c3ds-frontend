import { useState } from 'react';
import { Box, Typography, Collapse, IconButton } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import RouterIcon from '@mui/icons-material/Router';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import MessageCard from './MessageCard';

/**
 * DeviceMessageGroup Component
 *
 * Groups messages by device with expandable/collapsible functionality.
 * Shows the most recent message timestamp and count.
 * When expanded, displays all messages for that device in chronological order.
 *
 * Props:
 * - deviceId: UUID of the device
 * - deviceName: Name of the device
 * - messages: Array of messages for this device (sorted newest first)
 * - onMessageClick: Callback when a message is clicked
 */
function DeviceMessageGroup({ deviceId, deviceName, messages, onMessageClick }) {
  const [expanded, setExpanded] = useState(false);

  // Get the latest message for preview
  const latestMessage = messages[0];
  const messageCount = messages.length;

  // Count alert messages
  const alertCount = messages.filter((msg) => msg.message_type === 'alert').length;

  // Determine badge color based on alert count (same logic as SidebarStats)
  const getBadgeColor = () => {
    if (alertCount === 0) return '#4caf50'; // Green - no alerts
    if (alertCount < 15) return '#ff9800'; // Orange - less than 15 alerts
    return '#d32f2f'; // Red - high alerts (15+)
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <Box
      sx={{
        mb: 1.5,
        bgcolor: '#ffffff',
        border: 2,
        borderColor: expanded ? '#003f87' : '#e0e0e0',
        borderRadius: 0,
        overflow: 'hidden',
        transition: 'border-color 0.2s',
      }}
    >
      {/* Device Header (Clickable) */}
      <Box
        onClick={() => setExpanded(!expanded)}
        sx={{
          p: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          cursor: 'pointer',
          bgcolor: expanded ? '#f5f5f5' : '#ffffff',
          transition: 'background-color 0.2s',
          '&:hover': {
            bgcolor: '#f5f5f5',
          },
        }}
      >
        {/* Device Icon */}
        <TrackChangesIcon
          sx={{
            color: '#003f87',
            fontSize: '1.5rem',
          }}
        />

        {/* Device Info */}
        <Box sx={{ flex: 1 }}>
          <Typography
            sx={{
              fontSize: '0.85rem',
              fontWeight: 700,
              color: '#003f87',
              mb: 0.2,
            }}
          >
            {deviceName}
          </Typography>
          <Typography
            sx={{
              fontSize: '0.65rem',
              color: '#78909c',
            }}
          >
            {messageCount} {messageCount === 1 ? 'message' : 'messages'} • Last:{' '}
            {formatTime(latestMessage.timestamp)}
          </Typography>
        </Box>

        {/* Message Count Badge */}
        <Box
          sx={{
            bgcolor: getBadgeColor(),
            color: '#ffffff',
            px: 1,
            py: 0.3,
            borderRadius: 1,
            fontSize: '0.7rem',
            fontWeight: 700,
            minWidth: '24px',
            textAlign: 'center',
          }}
        >
          {messageCount}
        </Box>

        {/* Expand/Collapse Icon */}
        <IconButton
          size="small"
          sx={{
            color: '#003f87',
            p: 0.5,
          }}
        >
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      {/* Messages List (Expandable) */}
      <Collapse in={expanded}>
        <Box
          sx={{
            bgcolor: '#f5f5f5',
            borderTop: 2,
            borderColor: '#e0e0e0',
            p: 1,
            maxHeight: '400px',
            overflowY: 'auto',
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-track': {
              bgcolor: '#e0e0e0',
            },
            '&::-webkit-scrollbar-thumb': {
              bgcolor: '#003f87',
              borderRadius: 0,
            },
          }}
        >
          {/* Messages sorted newest first */}
          {messages.map((message) => (
            <Box
              key={message.id}
              onClick={() => onMessageClick?.(message)}
              sx={{
                mb: 1,
                cursor: 'pointer',
                '&:last-child': {
                  mb: 0,
                },
              }}
            >
              <MessageCard message={message} compact />
            </Box>
          ))}
        </Box>
      </Collapse>
    </Box>
  );
}

export default DeviceMessageGroup;
