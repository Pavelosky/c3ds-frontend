import React from 'react';
import { Alert, Button, Container, Typography, Box } from '@mui/material';
import { Refresh } from '@mui/icons-material';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so next render shows fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console (in production, you'd send to error tracking service)
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    // Reset error state to try rendering again
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // Fallback UI when error occurs
      return (
        <Container maxWidth="sm" sx={{ mt: 8 }}>
          <Box textAlign="center">
            <Alert severity="error" sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Something went wrong
              </Typography>
              <Typography variant="body2">
                {this.state.error?.message || 'An unexpected error occurred'}
              </Typography>
            </Alert>
            <Button 
              variant="contained" 
              startIcon={<Refresh />} 
              onClick={this.handleReset}
            >
              Try Again
            </Button>
          </Box>
        </Container>
      );
    }

    // No error, render children normally
    return this.props.children;
  }
}