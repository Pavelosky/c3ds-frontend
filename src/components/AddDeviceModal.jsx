import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Stack,
  Typography,
  Box,
  FormHelperText,
} from '@mui/material';
import { useCreateDevice } from '../hooks/useParticipantDevices';

export const AddDeviceModal = ({ open, onClose }) => {
  const createDevice = useCreateDevice();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    device_type: '',
    latitude: '',
    longitude: '',
    certificate_algorithm: 'ECDSA_P256',
  });

  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors({ ...fieldErrors, [name]: null });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});

    try {
      // Clean up the data before sending
      const dataToSend = {
        name: formData.name,
        description: formData.description || null,
        device_type: formData.device_type || null,
        latitude: formData.latitude === '' ? null : parseFloat(formData.latitude),
        longitude: formData.longitude === '' ? null : parseFloat(formData.longitude),
        certificate_algorithm: formData.certificate_algorithm,
      };

      await createDevice.mutateAsync(dataToSend);

      // Reset form on success
      setFormData({
        name: '',
        description: '',
        device_type: '',
        latitude: '',
        longitude: '',
        certificate_algorithm: 'ECDSA_P256'
      });
      setFieldErrors({});
      onClose();
    } catch (error) {
      console.error('Device creation failed:', error);

      // Parse validation errors from backend
      if (error?.response?.data) {
        const errors = error.response.data;
        const newFieldErrors = {};

        // Convert backend errors to field-specific errors
        Object.keys(errors).forEach(field => {
          if (Array.isArray(errors[field])) {
            newFieldErrors[field] = errors[field][0]; // Take first error message
          } else {
            newFieldErrors[field] = errors[field];
          }
        });

        setFieldErrors(newFieldErrors);
      }
    }
  };

  const getGeneralError = () => {
    // Show general error if there's a non-field error
    if (createDevice.isError && !Object.keys(fieldErrors).length) {
      return createDevice.error?.response?.data?.detail ||
             createDevice.error?.message ||
             'Failed to create device. Please try again.';
    }
    return null;
  };

  return (
    <Dialog open={open} onClose={!createDevice.isPending ? onClose : undefined} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Add New Device</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {getGeneralError() && (
              <Alert severity="error">{getGeneralError()}</Alert>
            )}

            {/* Device Name */}
            <TextField
              fullWidth
              required
              label="Device Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Sensor-Vilnius-001"
              error={!!fieldErrors.name}
              helperText={fieldErrors.name || "A unique name to identify your device"}
            />

            {/* Device Description */}
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="e.g., Balcony sensor monitoring drone activity"
              multiline
              rows={2}
              error={!!fieldErrors.description}
              helperText={fieldErrors.description || "Optional notes about the device location or purpose"}
            />

            {/* Device Type */}
            <FormControl fullWidth required error={!!fieldErrors.device_type}>
              <InputLabel>Device Type</InputLabel>
              <Select
                name="device_type"
                value={formData.device_type}
                onChange={handleChange}
                label="Device Type"
              >
                <MenuItem value="RASPBERRY_PI">Raspberry Pi</MenuItem>
                <MenuItem value="ESP32">ESP32</MenuItem>
                <MenuItem value="ESP8266">ESP8266</MenuItem>
                <MenuItem value="OTHER">Other</MenuItem>
              </Select>
              <FormHelperText>
                {fieldErrors.device_type || "Select the type of IoT device"}
              </FormHelperText>
            </FormControl>

            {/* Location Section */}
            <Box>
              <Typography variant="subtitle2" gutterBottom sx={{ mb: 2 }}>
                Device Location (Optional)
              </Typography>
              <Stack spacing={2}>
                <TextField
                  label="Latitude"
                  name="latitude"
                  type="number"
                  value={formData.latitude}
                  onChange={handleChange}
                  placeholder="e.g., 54.687157"
                  inputProps={{
                    step: "any",
                    min: -90,
                    max: 90
                  }}
                  error={!!fieldErrors.latitude}
                  helperText={fieldErrors.latitude || "Latitude coordinate between -90 and 90"}
                  fullWidth
                />
                <TextField
                  label="Longitude"
                  name="longitude"
                  type="number"
                  value={formData.longitude}
                  onChange={handleChange}
                  placeholder="e.g., 25.279652"
                  inputProps={{
                    step: "any",
                    min: -180,
                    max: 180
                  }}
                  error={!!fieldErrors.longitude}
                  helperText={fieldErrors.longitude || "Longitude coordinate between -180 and 180"}
                  fullWidth
                />
              </Stack>
            </Box>

            {/* Certificate Algorithm */}
            <FormControl fullWidth required error={!!fieldErrors.certificate_algorithm}>
              <InputLabel>Certificate Algorithm</InputLabel>
              <Select
                name="certificate_algorithm"
                value={formData.certificate_algorithm}
                onChange={handleChange}
                label="Certificate Algorithm"
              >
                <MenuItem value="ECDSA_P256">ECDSA P-256 (Recommended for ESP32/ESP8266)</MenuItem>
                <MenuItem value="ECDSA_P384">ECDSA P-384 (High security IoT)</MenuItem>
                <MenuItem value="RSA_2048">RSA-2048 (General purpose)</MenuItem>
                <MenuItem value="RSA_4096">RSA-4096 (Raspberry Pi 4+)</MenuItem>
              </Select>
              <FormHelperText>
                {fieldErrors.certificate_algorithm || "Select the certificate algorithm for device authentication"}
              </FormHelperText>
            </FormControl>

            {/* Algorithm Guide */}
            <Box sx={{ p: 2, bgcolor: 'info.lighter', borderRadius: 1 }}>
              <Typography variant="caption" display="block" gutterBottom>
                <strong>Quick Guide: Certificate Algorithm Recommendations</strong>
              </Typography>
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                • <strong>ECDSA P-256:</strong> Recommended for ESP32, ESP8266, Arduino, and mobile devices (faster, smaller signatures)
              </Typography>
              <Typography variant="caption" display="block">
                • <strong>ECDSA P-384:</strong> High security for constrained devices
              </Typography>
              <Typography variant="caption" display="block">
                • <strong>RSA-2048:</strong> General purpose, good for Raspberry Pi and desktop systems
              </Typography>
              <Typography variant="caption" display="block">
                • <strong>RSA-4096:</strong> Maximum security for powerful devices only
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} disabled={createDevice.isPending}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={createDevice.isPending}>
            {createDevice.isPending ? 'Creating...' : 'Add Device'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
