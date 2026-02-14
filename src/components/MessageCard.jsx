import { useState } from 'react';
import { Box, Typography, Chip, Collapse, IconButton } from '@mui/material';
import { formatDistanceToNow, format } from 'date-fns';
import { Warning, FavoriteBorder, ExpandMore, ExpandLess } from '@mui/icons-material';

/**
 * MessageCard Component
 *
 * Displays a single device message with type-specific styling.
 * ALERT messages have distinct red styling, HEARTBEAT messages have cyan styling.
 *
 * Features:
 * - Color-coded background and borders based on message type
 * - Device name and location coordinates
 * - Relative timestamp ("2 minutes ago")
 * - Data preview (first 100 characters)
 * - Confidence percentage if present in data
 *
 * @param {Object} message - Message object from API
 * @param {string} message.id - Message ID
 * @param {string} message.device_name - Name of the device
 * @param {string} message.device_latitude - Device latitude
 * @param {string} message.device_longitude - Device longitude
 * @param {string} message.message_type - Type of message ("alert", "heartbeat", etc.)
 * @param {string} message.timestamp - ISO timestamp when message was sent
 * @param {string} message.data_preview - Preview of message data (JSON string)
 * @param {number|null} message.confidence - Confidence value (0-1) if present
 */
function MessageCard({ message }) {
  // Expand/collapse state
  const [isExpanded, setIsExpanded] = useState(false);

  // Determine styling based on message type
  const isAlert = message.message_type?.toLowerCase() === 'alert';

  // Toggle expand/collapse
  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const styles = isAlert
    ? {
        // ALERT styling (red theme - NATO error color)
        bgColor: '#fff5f5',
        borderColor: '#d32f2f',
        badgeBgColor: '#d32f2f',
        badgeColor: '#ffffff',
        icon: <Warning sx={{ fontSize: '0.9rem' }} />,
      }
    : {
        // HEARTBEAT styling (blue theme - NATO info color)
        bgColor: '#f0f7ff',
        borderColor: '#0288d1',
        badgeBgColor: '#0288d1',
        badgeColor: '#ffffff',
        icon: <FavoriteBorder sx={{ fontSize: '0.9rem' }} />,
      };

  // Format timestamp to relative time (e.g., "2 minutes ago")
  const relativeTime = formatDistanceToNow(new Date(message.timestamp), {
    addSuffix: true,
  });

  return (
    <Box
      onClick={handleToggle}
      sx={{
        bgcolor: styles.bgColor,
        border: 1,
        borderLeft: 4,
        borderColor: styles.borderColor,
        borderRadius: 1,
        p: 0.75,
        mb: 0.75,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': {
          boxShadow: `0 2px 8px ${styles.borderColor}40`,
        },
      }}
    >
      {/* Always Visible: Badge + Device Name + Confidence (alerts) + Timestamp + Chevron */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flex: 1, minWidth: 0 }}>
          <Chip
            icon={styles.icon}
            label={message.message_type?.toUpperCase() || 'UNKNOWN'}
            size="small"
            sx={{
              bgcolor: styles.badgeBgColor,
              color: styles.badgeColor,
              fontWeight: 600,
              fontSize: '0.6rem',
              height: '20px',
              flexShrink: 0,
              '& .MuiChip-icon': {
                color: styles.badgeColor,
                fontSize: '0.85rem',
              },
              '& .MuiChip-label': {
                px: 0.75,
              },
            }}
          />

          <Typography
            variant="body2"
            sx={{
              color: '#2c3e50',
              fontWeight: 700,
              fontSize: '0.75rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {message.device_name}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {/* Confidence badge - only for alerts */}
          {isAlert && message.confidence !== null && message.confidence !== undefined && (
            <Chip
              label={`${Math.round(message.confidence * 100)}%`}
              size="small"
              sx={{
                bgcolor: '#388e3c',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.6rem',
                height: '20px',
                '& .MuiChip-label': {
                  px: 0.75,
                },
              }}
            />
          )}

          <Typography
            variant="caption"
            sx={{
              color: '#78909c',
              fontSize: '0.65rem',
              flexShrink: 0,
            }}
          >
            {relativeTime}
          </Typography>

          <IconButton
            size="small"
            sx={{
              p: 0,
              color: styles.borderColor,
            }}
          >
            {isExpanded ? <ExpandLess sx={{ fontSize: '1rem' }} /> : <ExpandMore sx={{ fontSize: '1rem' }} />}
          </IconButton>
        </Box>
      </Box>

      {/* Expandable Content */}
      <Collapse in={isExpanded}>
        <Box sx={{ pt: 1, borderTop: 1, borderColor: styles.borderColor, mt: 0.75 }}>
          {/* Device Location */}
          {message.device_latitude && message.device_longitude && (
            <Typography
              variant="caption"
              sx={{
                color: '#546e7a',
                fontSize: '0.7rem',
                display: 'block',
                mb: 0.5,
              }}
            >
              <strong>Location:</strong> {message.device_latitude}, {message.device_longitude}
            </Typography>
          )}

          {/* Full Timestamps */}
          <Typography
            variant="caption"
            sx={{
              color: '#546e7a',
              fontSize: '0.7rem',
              display: 'block',
              mb: 0.25,
            }}
          >
            <strong>Sent:</strong> {format(new Date(message.timestamp), 'PPpp')}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: '#546e7a',
              fontSize: '0.7rem',
              display: 'block',
              mb: 0.75,
            }}
          >
            <strong>Received:</strong> {format(new Date(message.recieved_at), 'PPpp')}
          </Typography>

          {/* Full Message Data */}
          <Box
            sx={{
              bgcolor: '#f5f5f5',
              p: 1,
              borderRadius: 1,
              border: 1,
              borderColor: '#e0e0e0',
            }}
          >
            <Typography
              variant="caption"
              component="pre"
              sx={{
                color: '#2c3e50',
                fontSize: '0.7rem',
                fontFamily: 'monospace',
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {message.data_preview}
            </Typography>
          </Box>

          {/* Message ID (for debugging) */}
          <Typography
            variant="caption"
            sx={{
              color: '#78909c',
              fontSize: '0.65rem',
              display: 'block',
              mt: 0.5,
              fontStyle: 'italic',
            }}
          >
            ID: {message.id}
          </Typography>
        </Box>
      </Collapse>
    </Box>
  );
}

export default MessageCard;