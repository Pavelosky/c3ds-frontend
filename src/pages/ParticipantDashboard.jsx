import { useState } from 'react';
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
  IconButton,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  Add,
  Download,
  Delete,
  Key,
  Verified as CertificateIcon,
  Refresh,
} from '@mui/icons-material';
import { BaseLayout } from '../components/BaseLayout';
import { AddDeviceModal } from '../components/AddDeviceModal';
import {
  useMyDevices,
  useRevokeDevice,
  useGenerateCertificate,
  downloadCertificate,
  downloadPrivateKey,
} from '../hooks/useParticipantDevices';
import { format } from 'date-fns';

const ParticipantDashboard = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { data: devices, isLoading, isError, error } = useMyDevices();
  const revokeDevice = useRevokeDevice();
  const generateCert = useGenerateCertificate();

  const handleRevoke = async (deviceId, deviceName) => {
    if (
      confirm(
        `Are you sure you want to revoke "${deviceName}"? This action cannot be undone.`
      )
    ) {
      try {
        await revokeDevice.mutateAsync(deviceId);
      } catch (error) {
        console.error('Revoke failed:', error);
        alert('Failed to revoke device: ' + (error?.response?.data?.detail || error.message));
      }
    }
  };

  const handleGenerateCertificate = async (deviceId, deviceName) => {
    if (
      confirm(
        `Generate a new certificate for "${deviceName}"? Previous certificate will be revoked.`
      )
    ) {
      try {
        await generateCert.mutateAsync(deviceId);
        alert('Certificate generated successfully! You can now download it.');
      } catch (error) {
        console.error('Generate certificate failed:', error);
        alert('Failed to generate certificate: ' + (error?.response?.data?.detail || error.message));
      }
    }
  };

  const handleDownloadCertificate = async (deviceId, deviceName) => {
    try {
      await downloadCertificate(deviceId, deviceName);
    } catch (error) {
      console.error('Download certificate failed:', error);
      alert('Failed to download certificate: ' + (error?.response?.data?.detail || error.message));
    }
  };

  const handleDownloadPrivateKey = async (deviceId, deviceName) => {
    try {
      await downloadPrivateKey(deviceId, deviceName);
    } catch (error) {
      console.error('Download private key failed:', error);
      alert('Failed to download private key: ' + (error?.response?.data?.detail || error.message));
    }
  };

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
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {devices?.map((device) => (
                  <TableRow
                    key={device.id}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell component="th" scope="row">
                      <Typography variant="body2" fontWeight={500}>
                        {device.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {device.device_type || 'N/A'}
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
                    <TableCell align="right">
                      <Box display="flex" justifyContent="flex-end" gap={0.5}>
                        {device.status !== 'REVOKED' && (
                          <>
                            {!device.certificate_pem ? (
                              <Tooltip title="Generate Certificate">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => handleGenerateCertificate(device.id, device.name)}
                                  disabled={generateCert.isPending}
                                >
                                  <Refresh fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            ) : (
                              <>
                                <Tooltip title="Download Certificate">
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={() => handleDownloadCertificate(device.id, device.name)}
                                  >
                                    <CertificateIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Download Private Key">
                                  <IconButton
                                    size="small"
                                    color="secondary"
                                    onClick={() => handleDownloadPrivateKey(device.id, device.name)}
                                  >
                                    <Key fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                            <Tooltip title="Revoke Device">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleRevoke(device.id, device.name)}
                                disabled={revokeDevice.isPending}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                        {device.status === 'REVOKED' && (
                          <Typography variant="caption" color="text.secondary">
                            Revoked
                          </Typography>
                        )}
                      </Box>
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
