import { useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Typography, Stack, CircularProgress, Select, MenuItem, FormControl,
} from '@mui/material';
import { ArrowBack, Add } from '@mui/icons-material';
import AdminPageLayout from '../components/AdminPageLayout';
import { adminAPI } from '../api/client';

const SEVERITY_COLOR = { CRITICAL: '#f44336', HIGH: '#f44336', MEDIUM: '#ff9800', LOW: '#2196f3' };
const STATUS_COLOR = { OPEN: '#f44336', INVESTIGATING: '#ff9800', RESOLVED: '#00ff41', ESCALATED: '#9c27b0' };

const darkSelectSx = {
  color: '#e0e0e0', fontFamily: 'monospace', fontSize: '0.8rem',
  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.15)' },
  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
  '& .MuiSvgIcon-root': { color: '#90a4ae' },
};

function SectionLabel({ children }) {
  return (
    <Typography sx={{ color: '#00ff41', fontFamily: 'monospace', fontSize: '0.65rem', letterSpacing: 2, mb: 1.5 }}>
      {children}
    </Typography>
  );
}

function ColorChip({ label, color }) {
  return (
    <Box sx={{ px: 0.75, py: 0.25, bgcolor: `${color}22`, border: `1px solid ${color}` }}>
      <Typography sx={{ color, fontFamily: 'monospace', fontSize: '0.65rem', letterSpacing: 1 }}>
        {label}
      </Typography>
    </Box>
  );
}

export default function AdminIncidentDetail() {
  const { incidentId } = useParams();
  const queryClient = useQueryClient();
  const [noteText, setNoteText] = useState('');

  const { data: incident, isLoading, isError } = useQuery({
    queryKey: ['incident', incidentId],
    queryFn: () => adminAPI.getIncident(incidentId).then(r => r.data),
  });

  const statusMutation = useMutation({
    mutationFn: (newStatus) => adminAPI.updateIncident(incidentId, { incident_status: newStatus }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['incident', incidentId] }),
  });

  const noteMutation = useMutation({
    mutationFn: (content) => adminAPI.addNote(incidentId, content),
    onSuccess: () => {
      setNoteText('');
      queryClient.invalidateQueries({ queryKey: ['incident', incidentId] });
    },
  });

  if (isLoading) return (
    <AdminPageLayout>
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4 }}>
        <CircularProgress size={24} sx={{ color: '#00ff41' }} />
      </Box>
    </AdminPageLayout>
  );

  if (isError || !incident) return (
    <AdminPageLayout>
      <Typography sx={{ color: '#f44336', fontFamily: 'monospace', fontSize: '0.8rem' }}>
        Incident not found.
      </Typography>
    </AdminPageLayout>
  );

  const severityColor = SEVERITY_COLOR[incident.severity] || '#90a4ae';
  const statusColor = STATUS_COLOR[incident.incident_status] || '#90a4ae';

  return (
    <AdminPageLayout>
      <Box maxWidth={900} mx="auto">
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

        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={3}>
          <Box>
            <Typography sx={{ color: '#e0e0e0', fontFamily: 'monospace', fontWeight: 700, fontSize: '1.1rem', letterSpacing: 1, mb: 1 }}>
              {incident.title}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <ColorChip label={incident.incident_status} color={statusColor} />
              <ColorChip label={incident.severity} color={severityColor} />
              <Typography sx={{ color: '#78909c', fontFamily: 'monospace', fontSize: '0.7rem' }}>
                Created by {incident.created_by_username} · {new Date(incident.created_at).toLocaleString()}
              </Typography>
            </Stack>
          </Box>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <Select
              value={incident.incident_status}
              onChange={e => statusMutation.mutate(e.target.value)}
              sx={darkSelectSx}
            >
              {['OPEN', 'INVESTIGATING', 'RESOLVED', 'ESCALATED'].map(s => (
                <MenuItem key={s} value={s} sx={{ fontFamily: 'monospace', fontSize: '0.8rem', color: STATUS_COLOR[s] || '#e0e0e0' }}>
                  {s}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        {incident.description && (
          <Typography sx={{ color: '#90a4ae', fontFamily: 'monospace', fontSize: '0.85rem', mb: 3 }}>
            {incident.description}
          </Typography>
        )}

        <Stack spacing={2}>
          {/* Linked anomaly flags */}
          <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)' }}>
            <SectionLabel>LINKED ANOMALY FLAGS ({incident.linked_flags?.length || 0})</SectionLabel>
            {incident.linked_flags?.length === 0 ? (
              <Typography sx={{ color: '#546e7a', fontFamily: 'monospace', fontSize: '0.8rem' }}>No flags linked.</Typography>
            ) : (
              <Stack spacing={1}>
                {incident.linked_flags?.map(flag => {
                  const fc = SEVERITY_COLOR[flag.severity] || '#90a4ae';
                  return (
                    <Box
                      key={flag.id}
                      sx={{
                        p: 1.5,
                        bgcolor: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderLeft: `3px solid ${fc}`,
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center" mb={0.5} flexWrap="wrap">
                        <ColorChip label={flag.severity} color={fc} />
                        <Box sx={{ px: 0.75, py: 0.25, border: '1px solid rgba(255,255,255,0.2)' }}>
                          <Typography sx={{ color: '#90a4ae', fontFamily: 'monospace', fontSize: '0.65rem', letterSpacing: 1 }}>
                            {flag.flag_type}
                          </Typography>
                        </Box>
                        <Typography sx={{ color: '#e0e0e0', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                          {flag.device_name || 'Network'}
                        </Typography>
                        <Typography sx={{ color: '#78909c', fontFamily: 'monospace', fontSize: '0.7rem' }}>
                          {new Date(flag.raised_at).toLocaleString()}
                        </Typography>
                      </Stack>
                      <Typography sx={{ color: '#90a4ae', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                        {flag.explanation}
                      </Typography>
                    </Box>
                  );
                })}
              </Stack>
            )}
          </Box>

          {/* Investigation notes */}
          <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)' }}>
            <SectionLabel>INVESTIGATION NOTES</SectionLabel>
            {incident.notes?.length === 0 && (
              <Typography sx={{ color: '#546e7a', fontFamily: 'monospace', fontSize: '0.8rem', mb: 2 }}>
                No notes yet. Add the first note below.
              </Typography>
            )}
            <Stack spacing={1} mb={2}>
              {incident.notes?.map(note => (
                <Box
                  key={note.id}
                  sx={{ p: 1.5, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderLeft: '3px solid rgba(255,255,255,0.2)' }}
                >
                  <Typography sx={{ color: '#e0e0e0', fontFamily: 'monospace', fontSize: '0.8rem', mb: 0.25 }}>
                    {note.content}
                  </Typography>
                  <Typography sx={{ color: '#78909c', fontFamily: 'monospace', fontSize: '0.7rem' }}>
                    {note.author_username || 'Unknown'} · {new Date(note.created_at).toLocaleString()}
                  </Typography>
                </Box>
              ))}
            </Stack>

            {/* Add note */}
            <Stack direction="row" spacing={1} alignItems="flex-start">
              <Box
                component="textarea"
                placeholder="Add an investigation note..."
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                rows={3}
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.06)',
                  color: '#e0e0e0',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 4,
                  padding: '8px',
                  fontSize: '0.8rem',
                  fontFamily: 'monospace',
                  resize: 'vertical',
                  outline: 'none',
                }}
              />
              <Box
                component="button"
                onClick={() => noteMutation.mutate(noteText)}
                disabled={!noteText.trim() || noteMutation.isPending}
                sx={{
                  px: 1.5, py: 1, cursor: 'pointer', bgcolor: 'transparent',
                  border: '1px solid #00ff41', color: '#00ff41',
                  fontFamily: 'monospace', fontSize: '0.75rem', letterSpacing: 1,
                  display: 'flex', alignItems: 'center', gap: 0.5, whiteSpace: 'nowrap',
                  '&:hover': { bgcolor: 'rgba(0,255,65,0.1)' },
                  '&:disabled': { borderColor: '#546e7a', color: '#546e7a', cursor: 'not-allowed' },
                }}
              >
                <Add sx={{ fontSize: 16 }} /> ADD NOTE
              </Box>
            </Stack>
          </Box>
        </Stack>
      </Box>
    </AdminPageLayout>
  );
}
