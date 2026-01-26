import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
    Box,
    Card,
    CardContent,
    CardHeader,
    TextField,
    Button,
    FormControlLabel,
    Checkbox,
    Alert,
    Typography,
    Link,
} from '@mui/material';
import { BaseLayout } from '../components/BaseLayout';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
    const { login } = useAuth();

    // Form state
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        remember_me: false,
    });

    // UI state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [fieldErrors, setFieldErrors] = useState({});

    // Handle input changes
    const handleChange = (e) => {
        const { name, value, checked, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
        // Clear field error when user starts typing
        if (fieldErrors[name]) {
            setFieldErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    // Handle form submission
    const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors({});

    try {
        await login(formData);
    } catch (err) {
        // Handle different types of errors
        if (err.response?.data?.errors) {
            // Field-specific errors from Django form validation
            setFieldErrors(err.response.data.errors);
        } else if (err.response?.data?.non_field_errors) {
            // General form errors
            setError(err.response.data.non_field_errors[0]);
        } else if (err.response?.status === 403) {
            setError('CSRF token missing or invalid. Please refresh the page.');
        } else {
            // Generic error
            setError('An error occurred. Please try again.');
        }
    } finally {
        setLoading(false);
    }
}
return (
    <BaseLayout maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 'calc(100vh - 200px)', // Center vertically minus header/footer
        }}
      >
        <Card sx={{ width: '100%', maxWidth: 500 }}>
          <CardHeader
            title="C3DS Login"
            subheader="Sign in to your account"
            sx={{
              textAlign: 'center',
              '& .MuiCardHeader-title': {
                fontSize: '1.5rem',
                fontWeight: 600,
              },
            }}
          />
          
          <CardContent>
            {/* General error alert */}
            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} noValidate>
              {/* Username field */}
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
                helperText={fieldErrors.username?.[0]}
                disabled={loading}
              />

              {/* Password field */}
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
                error={!!fieldErrors.password}
                helperText={fieldErrors.password?.[0]}
                disabled={loading}
              />

              {/* Remember me checkbox */}
              <FormControlLabel
                control={
                  <Checkbox
                    name="remember_me"
                    checked={formData.remember_me}
                    onChange={handleChange}
                    disabled={loading}
                  />
                }
                label="Remember me"
              />

              {/* Submit button */}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Login'}
              </Button>

              {/* Register link */}
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2">
                  Don't have an account?{' '}
                  <Link component={RouterLink} to="/register">
                    Register here
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