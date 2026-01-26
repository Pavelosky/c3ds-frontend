import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Button,
  Stack,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from '@mui/material';
import {
  Add,
} from '@mui/icons-material';
import { BaseLayout } from '../components/BaseLayout';
import { AddDeviceModal } from '../components/AddDeviceModal';
import {
  useMyDevices,
} from '../hooks/useParticipantDevices';
import { format } from 'date-fns';

const ParticipantDashboard = () => {
  const navigate = useNavigate();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { data: devices, isLoading, isError, error } = useMyDevices();

  const getStatusColor = (status) => {
    const statusColors = {
      PENDING: 'warning',
      ACTIVE: 'success',
      INACTIVE: 'info',
      REVOKED: 'error',
      EXPIRED: 'default',
    };
    return statusColors[status] || 'default';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return 'Invalid date';
    }
  };

  if (isLoading) {
    return (
      <BaseLayout>
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress size={60} />
        </Box>
      </BaseLayout>
    );
  }

  if (isError) {
    return (
      <BaseLayout>
        <Alert severity="error">
          Failed to load devices: {error?.message || 'Unknown error'}
        </Alert>
      </BaseLayout>
    );
  }

  return (
    <BaseLayout>
      <Stack spacing={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h3" component="h1" gutterBottom>
              My Devices
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your registered sensor devices ({devices?.length || 0} total)
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setIsAddModalOpen(true)}
            aria-label='Add Device'
          >
            Add Device
          </Button>
        </Box>

        {devices?.length === 0 ? (
          <Alert severity="info">
            You haven't registered any devices yet. Click "Add Device" to get
            started.
          </Alert>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Device Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Algorithm</TableCell>
                  <TableCell>Certificate Expiry</TableCell>
                  <TableCell>Created</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {devices?.map((device) => (
                  <TableRow
                    key={device.id}
                    hover
                    sx={{
                      '&:last-child td, &:last-child th': { border: 0 },
                      cursor: 'pointer',
                    }}
                    onClick={() => navigate(`/device/${device.id}`)}
                  >
                    <TableCell component="th" scope="row">
                      <Typography variant="body2" fontWeight={500}>
                        {device.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {device.device_type?.name || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={device.status}
                        color={getStatusColor(device.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                        {device.certificate_algorithm?.replace('_', '-') || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {device.certificate_expiry ? formatDate(device.certificate_expiry) : 'No certificate'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(device.created_at)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Stack>

      <AddDeviceModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </BaseLayout>
  );
};

export default ParticipantDashboard;
