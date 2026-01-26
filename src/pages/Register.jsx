import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  TextField,
  Button,
  Alert,
  Typography,
  Link,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormHelperText,
} from '@mui/material';
import { BaseLayout } from '../components/BaseLayout';
import { useAuth } from '../contexts/AuthContext';

export default function Register() {
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password1: '',
    password2: '',
    user_type: 'NON_PARTICIPANT',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors({});

    try {
      await register(formData);
    } catch (err) {
      if (err.response?.data?.errors) {
        setFieldErrors(err.response.data.errors);
      } else if (err.response?.data?.non_field_errors) {
        setError(err.response.data.non_field_errors[0]);
      } else if (err.response?.status === 403) {
        setError('CSRF token missing or invalid. Please refresh the page.');
      } else {
        setError('An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseLayout maxWidth="sm">
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 200px)' }}>
        <Card sx={{ width: '100%', maxWidth: 500 }}>
          <CardHeader
            title="C3DS Registration"
            subheader="Create your account"
          />
          <CardContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} noValidate>
              <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                label="Username"
                name="username"
                autoComplete="username"
                autoFocus
                value={formData.username}
                onChange={handleChange}
                error={!!fieldErrors.username}
                helperText={fieldErrors.username?.[0] || 'Required. Letters, digits and @/./+/-/_ only.'}
                disabled={loading}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                error={!!fieldErrors.email}
                helperText={fieldErrors.email?.[0] || 'Required. Enter a valid email address.'}
                disabled={loading}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                name="password1"
                label="Password"
                type="password"
                id="password1"
                autoComplete="new-password"
                value={formData.password1}
                onChange={handleChange}
                error={!!fieldErrors.password1}
                helperText={fieldErrors.password1?.[0]}
                disabled={loading}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                name="password2"
                label="Confirm Password"
                type="password"
                id="password2"
                autoComplete="new-password"
                value={formData.password2}
                onChange={handleChange}
                error={!!fieldErrors.password2}
                disabled={loading}
              />

              <FormControl
                component="fieldset"
                margin="normal"
                fullWidth
                error={!!fieldErrors.user_type}
                disabled={loading}
              >
                <FormLabel component="legend">Account Type</FormLabel>
                <RadioGroup
                  name="user_type"
                  value={formData.user_type}
                  onChange={handleChange}
                >
                  <FormControlLabel
                    value="PARTICIPANT"
                    control={<Radio />}
                    label="System Participant - I want to add my sensor device"
                  />
                  <FormControlLabel
                    value="NON_PARTICIPANT"
                    control={<Radio />}
                    label="Dashboard User - I only want to recieve notifications"
                  />
                </RadioGroup>
                <FormHelperText>
                  {fieldErrors.user_type?.[0] || 'Select your role in the system'}
                </FormHelperText>
              </FormControl>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading}
              >
                {loading ? 'Creating account...' : 'Register'}
              </Button>

              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2">
                  Already have an account?{' '}
                  <Link component={RouterLink} to="/login">
                    Login
                  </Link>
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </BaseLayout>
  );
}
