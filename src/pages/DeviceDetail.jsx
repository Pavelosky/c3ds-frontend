import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Chip,
  Divider,
  Grid,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  ArrowBack,
  Download,
  Delete,
  Key,
  Code,
  LocationOn,
  CalendarToday,
  Memory,
  Security,
  Refresh,
} from '@mui/icons-material';
import { BaseLayout } from '../components/BaseLayout';
import { WiFiConfigModal } from '../components/WiFiConfigModal';
import {
  useMyDevice,
  useRevokeDevice,
  useGenerateCertificate,
  downloadCertificate,
  downloadPrivateKey,
  downloadCodeBundle,
} from '../hooks/useParticipantDevices';
import { format } from 'date-fns';

const DeviceDetail = () => {
  const { deviceId } = useParams();
  const navigate = useNavigate();
  const { data: device, isLoading, isError, error } = useMyDevice(deviceId);
  const revokeDevice = useRevokeDevice();
  const generateCert = useGenerateCertificate();
  const [wifiModalOpen, setWifiModalOpen] = useState(false);

  const handleGenerateCertificate = async () => {
    if (
      confirm(
        `Generate a new certificate for "${device.name}"? Previous certificate will be revoked.`
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

  const handleRevoke = async () => {
    if (
      confirm(
        `Are you sure you want to revoke "${device.name}"? This action cannot be undone.`
      )
    ) {
      try {
        await revokeDevice.mutateAsync(deviceId);
        alert('Device revoked successfully');
        navigate('/dashboard');
      } catch (error) {
        console.error('Revoke failed:', error);
        alert('Failed to revoke device: ' + (error?.response?.data?.detail || error.message));
      }
    }
  };

  const handleDownloadCertificate = async () => {
    try {
      await downloadCertificate(deviceId, device.name);
    } catch (error) {
      console.error('Download certificate failed:', error);
      alert('Failed to download certificate: ' + (error?.response?.data?.detail || error.message));
    }
  };

  const handleDownloadPrivateKey = async () => {
    try {
      await downloadPrivateKey(deviceId, device.name);
    } catch (error) {
      console.error('Download private key failed:', error);
      alert('Failed to download private key: ' + (error?.response?.data?.detail || error.message));
    }
  };

  const handleDownloadCodeBundle = () => {
    setWifiModalOpen(true);
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

  if (isLoading) {
    return (
      <BaseLayout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </BaseLayout>
    );
  }

  if (isError) {
    return (
      <BaseLayout>
        <Alert severity="error" sx={{ mt: 2 }}>
          Error loading device: {error?.response?.data?.detail || error.message}
        </Alert>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/dashboard')} sx={{ mt: 2 }}>
          Back to Dashboard
        </Button>
      </BaseLayout>
    );
  }

  const canDownload = ['ACTIVE', 'PENDING', 'INACTIVE'].includes(device.status);
  const canRevoke = device.status !== 'REVOKED';

  return (
    <BaseLayout>
      <Box sx={{ py: 3 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center" gap={2}>
            <IconButton onClick={() => navigate('/dashboard')}>
              <ArrowBack />
            </IconButton>
            <Typography variant="h4">{device.name}</Typography>
            <Chip label={device.status} color={getStatusColor(device.status)} />
          </Box>
        </Box>

        <Grid container spacing={3}>
          {/* Main Information Card */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Device Information
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Stack spacing={3}>
                  {/* Description */}
                  {device.description && (
                    <Box>
                      <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ pl: 3.5 }} gutterBottom>
                        Description
                      </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                      <Typography variant="body1" sx={{ pl: 3.5 }}>{device.description}</Typography>
                      </Box>
                    </Box>
                  )}

                  {/* Device Type */}
                  <Box>
                    <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                      <Memory fontSize="small" color="action" />
                      <Typography variant="subtitle2" color="text.secondary">
                        Device Type
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                    <Typography variant="body1" sx={{ pl: 3.5 }}>
                      {device.device_type?.name || 'Not specified'}
                    </Typography>
                    </Box>
                  </Box>

                  {/* Encryption Algorithm */}
                  <Box>
                    <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                      <Security fontSize="small" color="action" />
                      <Typography variant="subtitle2" color="text.secondary">
                        Encryption Algorithm
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                    <Typography variant="body1" sx={{ pl: 3.5 }}>
                      {device.certificate_algorithm?.replace(/_/g, '-') || 'N/A'}
                    </Typography>
                    </Box>
                  </Box>

                  {/* Location */}
                  {(device.latitude || device.longitude) && (
                    <Box>
                      <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                        <LocationOn fontSize="small" color="action" />
                        <Typography variant="subtitle2" color="text.secondary">
                          Location
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                      <Typography variant="body1" sx={{ pl: 3.5 }}>
                        Lat: {device.latitude || 'N/A'}
                      </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                      <Typography variant="body1" sx={{ pl: 3.5 }}>
                          Long: {device.longitude || 'N/A'}
                      </Typography>
                      </Box>
                    </Box>
                  )}

                  {/* Created Date */}
                  <Box>
                    <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                      <CalendarToday fontSize="small" color="action" />
                      <Typography variant="subtitle2" color="text.secondary">
                        Created
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                    <Typography variant="body1" sx={{ pl: 3.5 }}>
                      {device.created_at
                        ? format(new Date(device.created_at), 'PPpp')
                        : 'N/A'}
                    </Typography>
                    </Box>
                  </Box>

                  {/* Certificate Expiry */}
                  {device.certificate_expiry && (
                    <Box>
                      <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                        <Security fontSize="small" color="action" />
                        <Typography variant="subtitle2" color="text.secondary">
                          Certificate Expires
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                      <Typography variant="body1" sx={{ pl: 3.5 }}>
                        {format(new Date(device.certificate_expiry), 'PPpp')}
                      </Typography>
                      </Box>
                    </Box>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Actions Card */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Actions
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Stack spacing={2}>
                  {/* Generate Certificate - always available unless revoked */}
                  {device.status !== 'REVOKED' && (
                    <Button
                      fullWidth
                      variant="contained"
                      color="primary"
                      startIcon={<Refresh />}
                      onClick={handleGenerateCertificate}
                      disabled={generateCert.isPending}
                    >
                      {generateCert.isPending ? 'Generating...' : (device.certificate_pem ? 'Regenerate Certificate' : 'Generate Certificate')}
                    </Button>
                  )}

                  {/* Download Certificate - show only when certificate exists */}
                  {device.certificate_pem && (
                    <Tooltip title={!canDownload ? 'Cannot download for revoked devices' : ''}>
                      <span>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<Download />}
                          onClick={handleDownloadCertificate}
                          disabled={!canDownload}
                        >
                          Download Certificate
                        </Button>
                      </span>
                    </Tooltip>
                  )}

                  {/* Download Private Key - show only when certificate exists */}
                  {device.certificate_pem && (
                    <Tooltip title={!canDownload ? 'Cannot download for revoked devices' : ''}>
                      <span>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<Key />}
                          onClick={handleDownloadPrivateKey}
                          disabled={!canDownload}
                        >
                          Download Private Key
                        </Button>
                      </span>
                    </Tooltip>
                  )}

                  {/* Download Code Bundle - show only when certificate exists */}
                  {device.certificate_pem && (
                    <Tooltip title={!canDownload ? 'Cannot download for revoked devices' : ''}>
                      <span>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<Code />}
                          onClick={handleDownloadCodeBundle}
                          disabled={!canDownload}
                        >
                          Download Code Bundle
                        </Button>
                      </span>
                    </Tooltip>
                  )}

                  <Divider />

                  {/* Revoke Device */}
                  <Tooltip title={!canRevoke ? 'Device already revoked' : ''}>
                    <span>
                      <Button
                        fullWidth
                        variant="contained"
                        color="error"
                        startIcon={<Delete />}
                        onClick={handleRevoke}
                        disabled={!canRevoke}
                      >
                        Revoke Device
                      </Button>
                    </span>
                  </Tooltip>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* WiFi Configuration Modal */}
      <WiFiConfigModal
        open={wifiModalOpen}
        onClose={() => setWifiModalOpen(false)}
        deviceId={deviceId}
        deviceName={device?.name || 'device'}
        onDownloadSuccess={() => {
          setWifiModalOpen(false);
        }}
      />
    </BaseLayout>
  );
};

export default DeviceDetail;
