import { Box, Container } from '@mui/material';
import { Navigation } from './Navigation';

export const BaseLayout = ({ children, maxWidth = 'lg' }) => {
const currentYear = new Date().getFullYear();

return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navigation />
        <Container maxWidth={maxWidth} component="main" sx={{ flexGrow: 1, py: 4 }}>
            {children}
        </Container>
        <Box
            component="footer"
            sx={{
                py: 2,
                px: 2,
                mt: 'auto',
                backgroundColor: 'background.paper',
                borderTop: '1px solid',
                borderColor: 'divider',
                textAlign: 'center',
                color: 'text.secondary',
                fontSize: '0.875rem',
            }}
        >
            C3DS - Civilian Distributed Drone Detection System © {currentYear}
        </Box>
    </Box>
);
};