import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  Box,
  CircularProgress,
} from '@mui/material';
import { useUpdateDevice } from '../hooks/useParticipantDevices';

export function EditDeviceModal({ open, onClose, device, onUpdateSuccess }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [deviceType, setDeviceType] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [error, setError] = useState(null);

  const updateDevice = useUpdateDevice();

  // Initialize form with device data when modal opens
  useEffect(() => {
    if (device && open) {
      setName(device.name || '');
      setDescription(device.description || '');
      setDeviceType(device.device_type?.name || '');
      setLatitude(device.latitude || '');
      setLongitude(device.longitude || '');
      setError(null);
    }
  }, [device, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const updateData = {
        name,
        description,
        device_type: deviceType || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
      };

      await updateDevice.mutateAsync({
        deviceId: device.id,
        data: updateData,
      });

      onUpdateSuccess();
      handleClose();
    } catch (err) {
      // Handle specific error codes
      if (err.response?.status === 400) {
        const errorData = err.response?.data;
        if (errorData?.name) {
          setError('Name error: ' + errorData.name[0]);
        } else if (errorData?.error) {
          setError(errorData.error);
        } else {
          setError('Invalid data. Please check your input.');
        }
      } else {
        setError('Update failed: ' + (err.response?.data?.detail || err.message));
      }
    }
  };

  const handleClose = () => {
    if (!updateDevice.isPending) {
      setName('');
      setDescription('');
      setDeviceType('');
      setLatitude('');
      setLongitude('');
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Device Information</DialogTitle>
      <DialogContent>
        {/* Error Alert */}
        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2, mt: 2 }}>
            {error}
          </Alert>
        )}

        {/* Form */}
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Device Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            margin="normal"
            helperText="A friendly name for your device"
            disabled={updateDevice.isPending}
          />

          <TextField
            fullWidth
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            rows={3}
            margin="normal"
            helperText="Optional description or notes about the device"
            disabled={updateDevice.isPending}
          />

          <TextField
            fullWidth
            label="Device Type"
            value={deviceType}
            onChange={(e) => setDeviceType(e.target.value)}
            margin="normal"
            helperText="e.g., ESP32, ESP8266, Raspberry Pi"
            disabled={updateDevice.isPending}
          />

          <TextField
            fullWidth
            label="Latitude"
            type="number"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            margin="normal"
            inputProps={{
              step: 'any',
              min: -90,
              max: 90,
            }}
            helperText="Latitude coordinate (-90 to 90)"
            disabled={updateDevice.isPending}
          />

          <TextField
            fullWidth
            label="Longitude"
            type="number"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            margin="normal"
            inputProps={{
              step: 'any',
              min: -180,
              max: 180,
            }}
            helperText="Longitude coordinate (-180 to 180)"
            disabled={updateDevice.isPending}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={updateDevice.isPending}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={updateDevice.isPending || !name}
          startIcon={updateDevice.isPending && <CircularProgress size={16} />}
        >
          {updateDevice.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
