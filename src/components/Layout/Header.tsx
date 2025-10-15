// ============================================================================
// COMPONENTE HEADER
// ============================================================================
// Barra superior con navegación, búsqueda y perfil de usuario
// ============================================================================

import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  useTheme,
  useMediaQuery,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useState } from 'react';
import { useAppDispatch, useAuth } from '../../hooks';
import { toggleSidebar, toggleSidebarCollapse } from '../../store/slices/uiSlice';
import { ThemeToggle } from '../UI';

export function Header() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const dispatch = useAppDispatch();
  // Selector simplificado sin usar sidebar state por ahora
  const { user, profile, signOut } = useAuth();

  // Estados locales
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [searchValue, setSearchValue] = useState('');

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSidebarToggle = () => {
    if (isMobile) {
      // En móvil, abrir/cerrar el sidebar
      dispatch(toggleSidebar());
    } else {
      // En escritorio, colapsar/expandir el sidebar
      dispatch(toggleSidebarCollapse());
    }
  };

  const handleSignOut = async () => {
    handleMenuClose();
    await signOut();
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: theme.zIndex.drawer + 1,
        bgcolor: 'background.paper',
        color: 'text.primary',
        boxShadow: 1,
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Toolbar>
        {/* Botón de menú */}
        <IconButton edge="start" color="inherit" aria-label="toggle menu" onClick={handleSidebarToggle} sx={{ mr: 2 }}>
          <MenuIcon />
        </IconButton>

        {/* Logo/Título */}
        <Typography
          variant="h6"
          component="div"
          sx={{
            flexGrow: 0,
            mr: 4,
            fontWeight: 600,
            display: { xs: 'none', sm: 'block' },
          }}
        >
          Leadership Eval
        </Typography>

        {/* Barra de búsqueda */}
        {!isMobile && (
          <TextField
            size="small"
            placeholder="Buscar proyectos, equipos..."
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
            sx={{
              width: 300,
              mr: 'auto',
              '& .MuiOutlinedInput-root': {
                bgcolor: 'action.hover',
                '&:hover': {
                  bgcolor: 'action.selected',
                },
                '&.Mui-focused': {
                  bgcolor: 'background.paper',
                },
              },
            }}
          />
        )}

        {/* Spacer */}
        <Box sx={{ flexGrow: 1 }} />

        {/* Iconos de acción */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Toggle de tema */}
          <ThemeToggle />

          {/* Notificaciones */}
          <IconButton sx={{ display: 'none' }} color="inherit">
            <NotificationsIcon />
          </IconButton>

          {/* Perfil de usuario */}
          <IconButton onClick={handleMenuOpen} sx={{ p: 0, ml: 1 }}>
            <Avatar
              sx={{ width: 32, height: 32 }}
              alt={profile?.first_name || user?.email}
              // src={profile?.avatar_url} // TODO: Agregar campo avatar_url a User
            >
              {profile?.first_name?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
            </Avatar>
          </IconButton>
        </Box>

        {/* Menú de perfil */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          onClick={handleMenuClose}
          PaperProps={{
            elevation: 3,
            sx: {
              overflow: 'visible',
              filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
              mt: 1.5,
              minWidth: 200,
              '&:before': {
                content: '""',
                display: 'block',
                position: 'absolute',
                top: 0,
                right: 14,
                width: 10,
                height: 10,
                bgcolor: 'background.paper',
                transform: 'translateY(-50%) rotate(45deg)',
                zIndex: 0,
              },
            },
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          {/* Información del usuario */}
          <MenuItem disabled>
            <Box>
              <Typography variant="subtitle2" noWrap>
                {profile?.first_name} {profile?.last_name}
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap>
                {user?.email}
              </Typography>
            </Box>
          </MenuItem>

          <Divider />

          {/* Opciones del menú */}
          <MenuItem onClick={handleMenuClose}>
            <PersonIcon sx={{ mr: 1 }} />
            Mi Perfil
          </MenuItem>

          <MenuItem onClick={handleMenuClose}>
            <SettingsIcon sx={{ mr: 1 }} />
            Configuración
          </MenuItem>

          <Divider />

          <MenuItem onClick={handleSignOut}>
            <LogoutIcon sx={{ mr: 1 }} />
            Cerrar Sesión
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
