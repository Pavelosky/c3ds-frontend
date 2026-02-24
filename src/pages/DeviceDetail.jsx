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
  Tabs,
  Tab,
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
  Edit,
} from '@mui/icons-material';
import { BaseLayout } from '../components/BaseLayout';
import { WiFiConfigModal } from '../components/WiFiConfigModal';
import { EditDeviceModal } from '../components/EditDeviceModal';
import DeviceMap from '../components/DeviceMap';
import IntegrationGuide from '../components/IntegrationGuide';
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
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

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
        <Box display="flex" justifyContent="center" align="left" minHeight="60vh">
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
  const downloadAvailable = device.is_certificate_available_for_download;
  const canRevoke = device.status !== 'REVOKED';

  return (
    <BaseLayout>
      <Box sx={{ py: 3 }}>
        {/* Header with Back Button and Device Name */}
        <Box display="flex" align="left" gap={2} mb={2}>
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

            {/* Download buttons - only when a certificate exists */}
            {device.certificate_pem && (
              downloadAvailable ? (
                <>
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
                </>
              ) : (
                <Alert severity={device.status === 'REVOKED' ? 'error' : 'warning'} sx={{ flex: 1 }}>
                  {device.status === 'REVOKED'
                    ? 'This device has been revoked. Certificates can no longer be generated or downloaded.'
                    : 'The 24-hour download window for this certificate has expired. Regenerate the certificate to download it again.'}
                </Alert>
              )
            )}
          </Stack>
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
            <Tab label="Device Info" />
            <Tab label="Recent Messages" />
            <Tab label="Integration Guide" />
          </Tabs>
        </Box>

        {/* Tab Panel: Device Info */}
        {activeTab === 0 && (
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
                        <Box display="flex" align="left" gap={1} mb={0.5}>
                        <Memory fontSize="small" color="action" />
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Description
                        </Typography>
                        </Box>
                        <Typography variant="body2" align="left">{device.description}</Typography>
                      </Box>
                      )}

                      {/* Device Type */}
                    <Box>
                      <Box display="flex" align="left">
                        <Memory fontSize="small" color="action" />
                        <Typography variant="subtitle2" color="text.secondary">
                          Device Type
                        </Typography>
                      </Box>
                      <Typography variant="body2" display="flex" align="left">
                        {device.device_type?.name || 'Not specified'}
                      </Typography>
                    </Box>

                    {/* Encryption Algorithm */}
                    <Box>
                      <Box display="flex" align="left" gap={1} mb={0.5}>
                        <Security fontSize="small" color="action" />
                        <Typography variant="subtitle2" color="text.secondary">
                          Encryption Algorithm
                        </Typography>
                      </Box>
                      <Typography variant="body2" display="flex" align="left">
                        {device.certificate_algorithm?.replace(/_/g, '-') || 'N/A'}
                      </Typography>
                    </Box>

                    {/* Location */}
                    {(device.latitude || device.longitude) && (
                      <Box>
                        <Box display="flex" align="left" gap={1} mb={0.5}>
                          <LocationOn fontSize="small" color="action" />
                          <Typography variant="subtitle2" color="text.secondary">
                            Location
                          </Typography>
                        </Box>
                        <Typography variant="body2" display="flex" align="left">
                          Lat: {device.latitude || 'N/A'}
                        </Typography>
                        <Typography variant="body2" display="flex" align="left">
                          Long: {device.longitude || 'N/A'}
                        </Typography>
                      </Box>
                    )}

                    {/* Created Date */}
                    <Box>
                      <Box display="flex" align="left" gap={1} mb={0.5}>
                        <CalendarToday fontSize="small" color="action" />
                        <Typography variant="subtitle2" color="text.secondary">
                          Created
                        </Typography>
                      </Box>
                      <Typography variant="body2" display="flex" align="left">
                        {device.created_at
                          ? format(new Date(device.created_at), 'PPpp')
                          : 'N/A'}
                      </Typography>
                    </Box>

                    {/* Certificate Expiry */}
                    {device.certificate_expiry && (
                      <Box>
                        <Box display="flex" align="left" gap={1} mb={0.5}>
                          <Security fontSize="small" color="action" />
                          <Typography variant="subtitle2" color="text.secondary">
                            Certificate Expires
                          </Typography>
                        </Box>
                        <Typography variant="body2" display="flex" align="left">
                          {format(new Date(device.certificate_expiry), 'PPpp')}
                        </Typography>
                      </Box>
                    )}
                  </Stack>

                  <Divider sx={{ my: 2 }} />

                  {/* Edit Device Button */}
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Edit />}
                    onClick={() => setEditModalOpen(true)}
                    disabled={device.status === 'REVOKED'}
                  >
                    Edit Device Information
                  </Button>

                  <Divider sx={{ my: 2 }} />

                  {/* Revoke Device */}
                  <Tooltip title={!canRevoke ? 'Device already revoked' : ''}>
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
                  </Tooltip>
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
        )}

        {/* Tab Panel: Recent Messages */}
        {activeTab === 1 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Messages
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {device.recent_messages?.length > 0 ? (
                <Stack spacing={2}>
                  {device.recent_messages.map((msg) => (
                    <Box
                      key={msg.id}
                      sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
                    >
                      <Box display="flex" justifyContent="space-between" mb={0.5}>
                        <Chip label={msg.message_type} size="small" />
                        <Typography variant="caption" color="text.secondary">
                          {format(new Date(msg.timestamp), 'PPpp')}
                        </Typography>
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{ fontFamily: 'monospace', color: 'text.secondary' }}
                      >
                        {msg.data_preview}
                      </Typography>
                      {msg.confidence !== null && (
                        <Typography variant="caption" color="text.secondary">
                          Confidence: {(msg.confidence * 100).toFixed(1)}%
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Alert severity="info">No messages received from this device yet.</Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tab Panel: Integration Guide */}
        {activeTab === 2 && (
          <IntegrationGuide />
        )}
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

      {/* Edit Device Modal */}
      <EditDeviceModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        device={device}
        onUpdateSuccess={() => {
          // Device data will be automatically refetched by React Query
          alert('Device updated successfully!');
        }}
      />
    </BaseLayout>
  );
};

export default DeviceDetail;
