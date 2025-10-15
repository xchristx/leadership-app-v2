// ============================================================================
// COMPONENTE LAYOUT PRINCIPAL
// ============================================================================
// Layout base de la aplicación con sidebar, header y área de contenido
// ============================================================================

import { Box, useTheme, useMediaQuery } from '@mui/material';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const sidebarWidth = 20;
  const contentMarginLeft = isMobile ? 0 : sidebarWidth;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <Sidebar />

      {/* Área principal */}
      <Box
        sx={{
          flexGrow: 1,
          marginLeft: isMobile ? 0 : `${contentMarginLeft}px`,
          transition: theme.transitions.create(['margin-left'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          display: 'flex',
          flexDirection: 'column',
          pt: 5,
        }}
      >
        {/* Header */}
        <Header />

        {/* Contenido principal */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            bgcolor: 'background.default',
            minHeight: 'calc(100vh - 64px)', // Restar altura del header
            overflow: 'auto',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
