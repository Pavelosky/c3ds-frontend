import { Card, CardContent, CardActions, Typography, Button, Box, Stack, Divider } from '@mui/material';
import { Download, Delete, Info } from '@mui/icons-material';
import { StatusChip } from './StatusChip';
import { formatDistance } from 'date-fns';

export const DeviceCard = ({ device, onDownload, onRevoke, onDetails }) => {
  const canDownload = ['ACTIVE', 'PENDING', 'INACTIVE'].includes(device.status);
  const canRevoke = device.status !== 'REVOKED';

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return formatDistance(new Date(dateString), new Date(), { addSuffix: true });
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">{device.name}</Typography>
          <StatusChip status={device.status} />
        </Box>
        <Divider sx={{ mb: 2 }} />
        <Stack spacing={1}>
          <Box>
            <Typography variant="caption" color="text.secondary">Device Type</Typography>
            <Typography variant="body2">{device.device_type || 'Unknown'}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Algorithm</Typography>
            <Typography variant="body2">{device.certificate_algorithm?.replace('_', '-') || 'N/A'}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Created</Typography>
            <Typography variant="body2">{formatDate(device.created_at)}</Typography>
          </Box>
        </Stack>
      </CardContent>
      <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
        {canDownload && (
          <Button size="small" startIcon={<Download />} onClick={() => onDownload(device.id)}>
            Download
          </Button>
        )}
        {canRevoke && (
          <Button size="small" color="error" startIcon={<Delete />} onClick={() => onRevoke(device.id)}>
            Revoke
          </Button>
        )}
        <Button size="small" startIcon={<Info />} onClick={() => onDetails(device.id)}>
          Details
        </Button>
      </CardActions>
    </Card>
  );
};