import { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Avatar,
  Divider,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountCircle,
  Logout,
  Dashboard,
  Public,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const Navigation = () => {
  const { user, isAuthenticated, isParticipant, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState(null);

  const handleUserMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleUserMenuClose = () => setAnchorEl(null);
  const handleMobileMenuOpen = (event) => setMobileMenuAnchor(event.currentTarget);
  const handleMobileMenuClose = () => setMobileMenuAnchor(null);
  const handleLogout = async () => {
    handleUserMenuClose();
    await logout();
  };

  return (
    <AppBar
      position="sticky"
      sx={{
        bgcolor: '#003f87',
        boxShadow: '0 4px 18px rgba(0, 0, 0, 0.5)',

      }}
    >
      <Toolbar sx={{ minHeight: '64px !important' }}>
        <Typography
          variant="h6"
          component={RouterLink}
          to="/"
          sx={{
            flexGrow: 1,
            textDecoration: 'none',
            color: '#ffffff',
            fontWeight: 700,
            fontFamily: 'monospace',
            letterSpacing: 2,
            fontSize: '1.25rem'
          }}
        >
          C3DS
        </Typography>

        {/* Desktop Navigation */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2 }}>
          <Button color="inherit" component={RouterLink} to="/" startIcon={<Public />}>
            Public Dashboard
          </Button>

          {isParticipant && (
            <Button color="inherit" component={RouterLink} to="/dashboard" startIcon={<Dashboard />}>
              My Devices
            </Button>
          )}

          {isAuthenticated ? (
            <>
              <IconButton color="inherit" onClick={handleUserMenuOpen} aria-label='User menu'>
                <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32 }}>
                  {user?.username?.[0]?.toUpperCase() || 'U'}
                </Avatar>
              </IconButton>
              <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleUserMenuClose}>
                <MenuItem disabled>
                  <ListItemIcon><AccountCircle /></ListItemIcon>
                  <ListItemText primary={user?.username} secondary={user?.user_type} />
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon><Logout fontSize="small" /></ListItemIcon>
                  <ListItemText>Logout</ListItemText>
                </MenuItem>
              </Menu>
            </>
          ) : (
            <>
              <Button color="inherit" component={RouterLink} to="/login" variant="outlined" sx={{ borderColor: 'white', mr: 1 }}>
                Login
              </Button>
              <Button color="inherit" component={RouterLink} to="/register" variant="contained" sx={{ bgcolor: 'secondary.main' }}>
                Register
              </Button>
            </>
          )}
        </Box>

        {/* Mobile Navigation */}
        <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
          <IconButton color="inherit" onClick={handleMobileMenuOpen} aria-label='Open navigation'>
            <MenuIcon />
          </IconButton>
          <Menu anchorEl={mobileMenuAnchor} open={Boolean(mobileMenuAnchor)} onClose={handleMobileMenuClose}>
            <MenuItem component={RouterLink} to="/" onClick={handleMobileMenuClose}>
              <ListItemIcon><Public /></ListItemIcon>
              <ListItemText>Public Dashboard</ListItemText>
            </MenuItem>
            {isParticipant && (
              <MenuItem component={RouterLink} to="/dashboard" onClick={handleMobileMenuClose}>
                <ListItemIcon><Dashboard /></ListItemIcon>
                <ListItemText>My Devices</ListItemText>
              </MenuItem>
            )}
            {isAuthenticated ? [
              <Divider key="divider" />,
              <MenuItem key="user-info" disabled>
                <ListItemText primary={user?.username} secondary={user?.user_type} />
              </MenuItem>,
              <MenuItem key="logout" onClick={handleLogout}>
                <ListItemIcon><Logout /></ListItemIcon>
                <ListItemText>Logout</ListItemText>
              </MenuItem>
            ] : [
              <MenuItem key="login" component={RouterLink} to="/login" onClick={handleMobileMenuClose}>
                Login
              </MenuItem>,
              <MenuItem key="register" component={RouterLink} to="/register" onClick={handleMobileMenuClose}>
                Register
              </MenuItem>
            ]}
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};