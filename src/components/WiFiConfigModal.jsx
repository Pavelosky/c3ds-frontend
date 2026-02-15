import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  AlertTitle,
  Box,
  CircularProgress,
} from '@mui/material';
import { downloadCodeBundle } from '../hooks/useParticipantDevices';

export function WiFiConfigModal({ open, onClose, deviceId, deviceName, onDownloadSuccess }) {
  const [wifiSsid, setWifiSsid] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await downloadCodeBundle(deviceId, deviceName, wifiSsid, wifiPassword);
      onDownloadSuccess();
      // Reset form
      setWifiSsid('');
      setWifiPassword('');
    } catch (err) {
      // Handle specific error codes
      if (err.response?.status === 410) {
        setError('Certificate download window expired. Please regenerate certificate.');
      } else if (err.response?.status === 400) {
        setError(err.response?.data?.error || 'Invalid WiFi credentials');
      } else {
        setError('Download failed: ' + (err.response?.data?.detail || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setWifiSsid('');
      setWifiPassword('');
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Configure Device WiFi</DialogTitle>
      <DialogContent>
        {/* Info Alert */}
        <Alert severity="info" sx={{ mb: 2, mt: 2 }}>
          <AlertTitle>What's in the bundle?</AlertTitle>
          <Box component="ul" sx={{ m: 0, pl: 2 }}>
            <li>Arduino sketch for ESP8266/ESP32</li>
            <li>Pre-configured device certificate and private key</li>
            <li>WiFi connection settings (from this form)</li>
            <li>Setup instructions (README.md)</li>
          </Box>
        </Alert>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Form */}
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="WiFi SSID"
            value={wifiSsid}
            onChange={(e) => setWifiSsid(e.target.value.slice(0, 32))}
            required
            margin="normal"
            helperText={`${wifiSsid.length}/32 characters`}
            disabled={loading}
          />
          <TextField
            fullWidth
            label="WiFi Password"
            type="password"
            value={wifiPassword}
            onChange={(e) => setWifiPassword(e.target.value.slice(0, 64))}
            required
            margin="normal"
            helperText={`${wifiPassword.length}/64 characters`}
            disabled={loading}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || !wifiSsid || !wifiPassword}
          startIcon={loading && <CircularProgress size={16} />}
        >
          {loading ? 'Downloading...' : 'Download Code Bundle'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
