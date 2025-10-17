// ============================================================================
// COMPONENTE TAB PANEL
// ============================================================================
// Panel de pestañas reutilizable para el análisis comparativo
// ============================================================================

import { Box } from '@mui/material';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

export function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      style={{
        height: value === index ? 'auto' : '0',
        overflow: value === index ? 'visible' : 'hidden',
      }}
      {...other}
    >
      {value === index && (
        <Box
          sx={{
            p: 2,
            height: 'auto',
            minHeight: 'fit-content',
          }}
        >
          {children}
        </Box>
      )}
    </div>
  );
}
