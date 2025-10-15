// ============================================================================
// COMPONENTE TOGGLE DE TEMA
// ============================================================================
// Botón para cambiar entre modo claro y oscuro
// ============================================================================

import { IconButton, Tooltip } from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import { useTheme } from '../../theme';

interface ThemeToggleProps {
  size?: 'small' | 'medium' | 'large';
  showTooltip?: boolean;
}

export function ThemeToggle({ size = 'medium', showTooltip = true }: ThemeToggleProps) {
  const { mode, toggleTheme } = useTheme();
  const isDark = mode === 'dark';

  const button = (
    <IconButton
      onClick={toggleTheme}
      size={size}
      color="inherit"
      aria-label="toggle theme"
      sx={{
        transition: 'transform 0.2s',
        '&:hover': {
          transform: 'scale(1.1)',
        },
      }}
    >
      {isDark ? <Brightness7 /> : <Brightness4 />}
    </IconButton>
  );

  if (showTooltip) {
    return <Tooltip title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}>{button}</Tooltip>;
  }

  return button;
}
