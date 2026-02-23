import { useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Typography, Card, CardContent, CardHeader, Chip, Button,
  TextField, Select, MenuItem, FormControl, InputLabel, Divider,
  Stack, Alert, CircularProgress, List, ListItem, ListItemText,
  Paper,
} from '@mui/material';
import { ArrowBack, Add } from '@mui/icons-material';
import { BaseLayout } from '../components/BaseLayout';
import { adminAPI } from '../api/client';

const SEVERITY_COLOR = { CRITICAL: 'error', HIGH: 'error', MEDIUM: 'warning', LOW: 'info' };
const STATUS_COLOR = { OPEN: 'error', INVESTIGATING: 'warning', RESOLVED: 'success', ESCALATED: 'secondary' };

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

  if (isLoading) return <BaseLayout><Box p={3}><CircularProgress /></Box></BaseLayout>;
  if (isError || !incident) return <BaseLayout><Box p={3}><Alert severity="error">Incident not found.</Alert></Box></BaseLayout>;

  return (
    <BaseLayout>
      <Box p={3} maxWidth={900} mx="auto">
        <Button startIcon={<ArrowBack />} component={RouterLink} to="/c3ds-admin" sx={{ mb: 2 }}>
          Back to Admin
        </Button>

        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box>
            <Typography variant="h5" fontWeight={700}>{incident.title}</Typography>
            <Stack direction="row" spacing={1} mt={1}>
              <Chip label={incident.incident_status} color={STATUS_COLOR[incident.incident_status] || 'default'} />
              <Chip label={incident.severity} color={SEVERITY_COLOR[incident.severity] || 'default'} />
              <Typography variant="body2" color="text.secondary" alignSelf="center">
                Created by {incident.created_by_username} · {new Date(incident.created_at).toLocaleString()}
              </Typography>
            </Stack>
          </Box>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Change Status</InputLabel>
            <Select
              value={incident.incident_status}
              label="Change Status"
              onChange={(e) => statusMutation.mutate(e.target.value)}
            >
              {['OPEN', 'INVESTIGATING', 'RESOLVED', 'ESCALATED'].map(s => (
                <MenuItem key={s} value={s}>{s}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        {incident.description && (
          <Typography variant="body1" mb={3} color="text.secondary">{incident.description}</Typography>
        )}

        <Stack spacing={3}>
          {/* Linked anomaly flags */}
          <Card>
            <CardHeader title={`Linked Anomaly Flags (${incident.linked_flags?.length || 0})`} />
            <Divider />
            <CardContent>
              {incident.linked_flags?.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No flags linked.</Typography>
              ) : (
                <Stack spacing={1}>
                  {incident.linked_flags?.map(flag => (
                    <Paper key={flag.id} variant="outlined" sx={{ p: 1.5 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip label={flag.severity} color={SEVERITY_COLOR[flag.severity] || 'default'} size="small" />
                        <Chip label={flag.flag_type} size="small" variant="outlined" />
                        <Typography variant="body2">{flag.device_name || 'Network'}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(flag.raised_at).toLocaleString()}
                        </Typography>
                      </Stack>
                      <Typography variant="body2" mt={0.5}>{flag.explanation}</Typography>
                    </Paper>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>

          {/* Investigation notes */}
          <Card>
            <CardHeader title="Investigation Notes" />
            <Divider />
            <CardContent>
              {incident.notes?.length === 0 && (
                <Typography variant="body2" color="text.secondary" mb={2}>
                  No notes yet. Add the first note below.
                </Typography>
              )}
              <List dense>
                {incident.notes?.map(note => (
                  <ListItem key={note.id} alignItems="flex-start" sx={{ px: 0 }}>
                    <ListItemText
                      primary={note.content}
                      secondary={`${note.author_username || 'Unknown'} · ${new Date(note.created_at).toLocaleString()}`}
                    />
                  </ListItem>
                ))}
              </List>

              {/* Add note */}
              <Stack direction="row" spacing={1} mt={2} alignItems="flex-start">
                <TextField
                  fullWidth
                  multiline
                  minRows={2}
                  placeholder="Add an investigation note..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  size="small"
                />
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => noteMutation.mutate(noteText)}
                  disabled={!noteText.trim() || noteMutation.isPending}
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  Add Note
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Box>
    </BaseLayout>
  );
}
