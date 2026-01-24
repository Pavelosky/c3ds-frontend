import { Chip } from '@mui/material';

export const StatusChip = ({ status, size = 'small' }) => {
  const statusConfig = {
    PENDING: { color: 'warning', label: 'Pending' },
    ACTIVE: { color: 'success', label: 'Active' },
    INACTIVE: { color: 'info', label: 'Inactive' },
    REVOKED: { color: 'error', label: 'Revoked' },
    EXPIRED: { color: 'default', label: 'Expired' },
  };

  const config = statusConfig[status] || statusConfig.EXPIRED;
  return <Chip label={config.label} color={config.color} size={size} sx={{ fontWeight: 500 }} />;
};