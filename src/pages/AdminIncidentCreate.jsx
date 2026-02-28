import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Typography, Stack, Select, MenuItem, FormControl,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import AdminPageLayout from '../components/AdminPageLayout';
import { adminAPI } from '../api/client';

const darkSelectSx = {
  color: '#e0e0e0', fontFamily: 'monospace', fontSize: '0.8rem',
  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.15)' },
  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
  '& .MuiSvgIcon-root': { color: '#90a4ae' },
};

const STATUS_COLOR = { OPEN: '#f44336', INVESTIGATING: '#ff9800', RESOLVED: '#00ff41', ESCALATED: '#9c27b0' };
const SEVERITY_COLOR = { CRITICAL: '#f44336', HIGH: '#f44336', MEDIUM: '#ff9800', LOW: '#2196f3' };

function FieldLabel({ children }) {
  return (
    <Typography sx={{ color: '#00ff41', fontFamily: 'monospace', fontSize: '0.65rem', letterSpacing: 2, mb: 0.75 }}>
      {children}
    </Typography>
  );
}

export default function AdminIncidentCreate() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('MEDIUM');
  const [incidentStatus, setIncidentStatus] = useState('OPEN');

  const createMutation = useMutation({
    mutationFn: (data) => adminAPI.createIncident(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      navigate(`/c3ds-admin/incidents/${res.data.id}`);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    createMutation.mutate({
      title: title.trim(),
      description: description.trim(),
      severity,
      incident_status: incidentStatus,
    });
  };

  return (
    <AdminPageLayout>
      <Box maxWidth={700} mx="auto">
        <Box
          component={RouterLink}
          to="/c3ds-admin"
          sx={{
            display: 'inline-flex', alignItems: 'center', gap: 0.5, mb: 2,
            color: '#90a4ae', fontFamily: 'monospace', fontSize: '0.75rem',
            textDecoration: 'none', letterSpacing: 1,
            '&:hover': { color: '#00ff41' },
          }}
        >
          <ArrowBack sx={{ fontSize: 16 }} /> BACK TO ADMIN
        </Box>

        <Typography sx={{ color: '#e0e0e0', fontFamily: 'monospace', fontWeight: 700, fontSize: '1.1rem', letterSpacing: 1, mb: 3 }}>
          NEW INCIDENT
        </Typography>

        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2.5}>
            {/* Title */}
            <Box>
              <FieldLabel>TITLE *</FieldLabel>
              <Box
                component="input"
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Short descriptive title..."
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.06)',
                  color: '#e0e0e0',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 4,
                  padding: '8px 10px',
                  fontSize: '0.85rem',
                  fontFamily: 'monospace',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </Box>

            {/* Description */}
            <Box>
              <FieldLabel>DESCRIPTION</FieldLabel>
              <Box
                component="textarea"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Detailed description of what is being investigated..."
                rows={4}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.06)',
                  color: '#e0e0e0',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 4,
                  padding: '8px 10px',
                  fontSize: '0.85rem',
                  fontFamily: 'monospace',
                  resize: 'vertical',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </Box>

            {/* Severity + Status row */}
            <Stack direction="row" spacing={2}>
              <Box flex={1}>
                <FieldLabel>SEVERITY</FieldLabel>
                <FormControl size="small" fullWidth>
                  <Select value={severity} onChange={e => setSeverity(e.target.value)} sx={darkSelectSx}>
                    {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(s => (
                      <MenuItem key={s} value={s} sx={{ fontFamily: 'monospace', fontSize: '0.8rem', color: SEVERITY_COLOR[s] || '#e0e0e0' }}>
                        {s}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <Box flex={1}>
                <FieldLabel>STATUS</FieldLabel>
                <FormControl size="small" fullWidth>
                  <Select value={incidentStatus} onChange={e => setIncidentStatus(e.target.value)} sx={darkSelectSx}>
                    {['OPEN', 'INVESTIGATING', 'RESOLVED', 'ESCALATED'].map(s => (
                      <MenuItem key={s} value={s} sx={{ fontFamily: 'monospace', fontSize: '0.8rem', color: STATUS_COLOR[s] || '#e0e0e0' }}>
                        {s}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Stack>

            {/* Error */}
            {createMutation.isError && (
              <Typography sx={{ color: '#f44336', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                Failed to create incident. Please try again.
              </Typography>
            )}

            {/* Submit */}
            <Box
              component="button"
              type="submit"
              disabled={!title.trim() || createMutation.isPending}
              sx={{
                alignSelf: 'flex-start',
                px: 2, py: 1, cursor: 'pointer', bgcolor: 'transparent',
                border: '1px solid #00ff41', color: '#00ff41',
                fontFamily: 'monospace', fontSize: '0.8rem', letterSpacing: 2,
                '&:hover': { bgcolor: 'rgba(0,255,65,0.1)' },
                '&:disabled': { borderColor: '#546e7a', color: '#546e7a', cursor: 'not-allowed' },
              }}
            >
              {createMutation.isPending ? 'CREATING...' : 'CREATE INCIDENT'}
            </Box>
          </Stack>
        </Box>
      </Box>
    </AdminPageLayout>
  );
}
