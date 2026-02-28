import { Box } from '@mui/material';
import { Navigation } from './Navigation';

export default function AdminPageLayout({ children }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: '#0a0e27', overflow: 'hidden' }}>
      <Navigation />
      <Box sx={{
        flex: 1,
        overflowY: 'auto',
        p: 3,
        '&::-webkit-scrollbar': { width: 6 },
        '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 3 },
      }}>
        {children}
      </Box>
    </Box>
  );
}
