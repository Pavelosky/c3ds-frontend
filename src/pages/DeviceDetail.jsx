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
import DeviceMap from '../components/DeviceMap';
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
        {/* Header with Back Button and Device Name */}
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <IconButton onClick={() => navigate('/dashboard')}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4">{device.name}</Typography>
          <Chip label={device.status} color={getStatusColor(device.status)} />
        </Box>

        {/* Actions - Vertical Stack Below Device Name */}
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" spacing={2} flexWrap="wrap">
            {/* Generate Certificate - always available unless revoked */}
            {device.status !== 'REVOKED' && (
              <Button
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

            {/* Revoke Device */}
            <Tooltip title={!canRevoke ? 'Device already revoked' : ''}>
              <span>
                <Button
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
        </Box>

        {/* Main Content: Device Info (1/3) + Map (2/3) */}
        <Grid container spacing={3}>
          {/* Device Information Card - 1/3 width */}
          <Grid item sx={{ height: '100%', width: '30%' }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Device Information
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Stack spacing={2.5}>
                  {/* Description */}
                  {device.description && (
                    <Box>
                       <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                       <Memory fontSize="small" color="action" />
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Description
                      </Typography>
                      </Box>
                      <Typography variant="body2" display="flex" alignItems="center" gap={1} mb={0.5}>{device.description}</Typography>
                    </Box>
                  )}

                  {/* Device Type */}
                  <Box>
                    <Box display="flex" alignItems="center">
                      <Memory fontSize="small" color="action" />
                      <Typography variant="subtitle2" color="text.secondary">
                        Device Type
                      </Typography>
                    </Box>
                    <Typography variant="body2" display="flex" alignItems="center">
                      {device.device_type?.name || 'Not specified'}
                    </Typography>
                  </Box>

                  {/* Encryption Algorithm */}
                  <Box>
                    <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                      <Security fontSize="small" color="action" />
                      <Typography variant="subtitle2" color="text.secondary">
                        Encryption Algorithm
                      </Typography>
                    </Box>
                    <Typography variant="body2" display="flex" alignItems="center">
                      {device.certificate_algorithm?.replace(/_/g, '-') || 'N/A'}
                    </Typography>
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
                      <Typography variant="body2" display="flex" alignItems="center">
                        Lat: {device.latitude || 'N/A'}
                      </Typography>
                      <Typography variant="body2" display="flex" alignItems="center">
                        Long: {device.longitude || 'N/A'}
                      </Typography>
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
                    <Typography variant="body2" display="flex" alignItems="center">
                      {device.created_at
                        ? format(new Date(device.created_at), 'PPpp')
                        : 'N/A'}
                    </Typography>
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
                      <Typography variant="body2" display="flex" alignItems="center">
                        {format(new Date(device.certificate_expiry), 'PPpp')}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Device Location Map - 2/3 width */}
          <Grid item sx={{ height: '100%', width: '60%' }}>
            {(device?.latitude && device?.longitude) ? (
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Device Location
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  <Box sx={{ height: '500px', borderRadius: 1, overflow: 'hidden' }}>
                    <DeviceMap devices={[device]} height="100%" disableGeolocation={true} />
                  </Box>

                  {/* Coordinates under map for easy copy/paste */}
                  <Box sx={{ mt: 2, display: 'flex', gap: 3, justifyContent: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Latitude: {device.latitude}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Longitude: {device.longitude}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            ) : (
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Device Location
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  <Alert severity="info">
                    No location data available for this device.
                    Location can be set during device registration or updated later.
                  </Alert>
                </CardContent>
              </Card>
            )}
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
