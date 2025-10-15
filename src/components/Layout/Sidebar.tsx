// ============================================================================
// COMPONENTE SIDEBAR - CORREGIDO
// ============================================================================
// Barra lateral de navegación con menús y enlaces
// ============================================================================

import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  Box,
  Typography,
  useTheme,
  useMediaQuery,
  Collapse,
  IconButton,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Work as ProjectsIcon,
  Groups as TeamsIcon,
  Assessment as EvaluationsIcon,
  Quiz as QuestionnairesIcon,
  BarChart as ReportsIcon,
  Settings as SettingsIcon,
  ExpandLess,
  ExpandMore,
  ChevronLeft as ChevronLeftIcon,
  Business as OrganizationIcon,
} from '@mui/icons-material';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { setSidebarOpen, toggleSidebarCollapse, selectSidebar } from '../../store/slices/uiSlice'; // Import agregado
import { useAppDispatch, useAppSelector } from '../../store';

interface NavigationItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  path?: string;
  children?: NavigationItem[];
}

const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: <DashboardIcon />,
    path: '/dashboard',
  },
  {
    id: 'projects',
    title: 'Proyectos',
    icon: <ProjectsIcon />,
    path: '/projects',
  },
  {
    id: 'teams',
    title: 'Equipos',
    icon: <TeamsIcon />,
    path: '/teams',
  },
  {
    id: 'evaluations',
    title: 'Evaluaciones',
    icon: <EvaluationsIcon />,
    path: '/evaluations',
  },
  {
    id: 'questionnaires',
    title: 'Cuestionarios',
    icon: <QuestionnairesIcon />,
    path: '/questionnaires',
  },
  {
    id: 'reports',
    title: 'Reportes',
    icon: <ReportsIcon />,
    path: '/reports',
  },
];

const adminItems: NavigationItem[] = [
  {
    id: 'organization',
    title: 'Organización',
    icon: <OrganizationIcon />,
    path: '/organization',
  },
  {
    id: 'settings',
    title: 'Configuración',
    icon: <SettingsIcon />,
    path: '/settings',
  },
];

interface SidebarProps {
  profile?: {
    role?: string;
  };
}

export function Sidebar({ profile }: SidebarProps) {
  // Profile como prop
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  // Obtener estado del sidebar desde Redux
  const { isOpen: sidebarOpen, isCollapsed: sidebarCollapsed } = useAppSelector(selectSidebar);

  // Estados locales
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const drawerWidth = sidebarCollapsed ? 64 : 240;

  const handleItemClick = (item: NavigationItem) => {
    if (item.children) {
      // Toggle expansión
      const newExpanded = new Set(expandedItems);
      if (newExpanded.has(item.id)) {
        newExpanded.delete(item.id);
      } else {
        newExpanded.add(item.id);
      }
      setExpandedItems(newExpanded);
    } else if (item.path) {
      // Navegar a la ruta
      if (isMobile) {
        dispatch(setSidebarOpen(false));
      }
      navigate(item.path);
    }
  };

  const handleCollapseToggle = () => {
    dispatch(toggleSidebarCollapse());
  };

  const isItemActive = (path?: string) => {
    if (!path) return false;

    // Para rutas exactas
    if (location.pathname === path) return true;

    // Para subrutas (opcional)
    if (path !== '/' && location.pathname.startsWith(path)) {
      return true;
    }

    return false;
  };

  const renderNavigationItem = (item: NavigationItem, level = 0) => {
    const isActive = isItemActive(item.path);
    const isExpanded = expandedItems.has(item.id);
    const hasChildren = item.children && item.children.length > 0;

    return (
      <Box key={item.id}>
        <ListItem disablePadding sx={{ display: 'block' }}>
          <ListItemButton
            onClick={() => handleItemClick(item)}
            selected={isActive}
            sx={{
              minHeight: 48,
              justifyContent: sidebarCollapsed ? 'center' : 'initial',
              px: 2.5,
              pl: level > 0 ? (sidebarCollapsed ? 2.5 : 4) : 2.5, // Corregido para modo colapsado
              '&.Mui-selected': {
                backgroundColor: 'primary.main',
                color: 'primary.contrastText',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
                '& .MuiListItemIcon-root': {
                  color: 'inherit',
                },
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: sidebarCollapsed ? 'auto' : 3,
                justifyContent: 'center',
                color: isActive ? 'inherit' : 'text.secondary',
              }}
            >
              {item.icon}
            </ListItemIcon>

            {!sidebarCollapsed && (
              <>
                <ListItemText
                  primary={item.title}
                  sx={{
                    opacity: 1,
                    '& .MuiTypography-root': {
                      fontSize: '0.875rem',
                      fontWeight: isActive ? 600 : 400,
                    },
                  }}
                />
                {hasChildren && (isExpanded ? <ExpandLess /> : <ExpandMore />)}
              </>
            )}
          </ListItemButton>
        </ListItem>

        {/* Submenús */}
        {hasChildren && !sidebarCollapsed && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children!.map(child => renderNavigationItem(child, level + 1))}
            </List>
          </Collapse>
        )}
      </Box>
    );
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header del sidebar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: sidebarCollapsed ? 'center' : 'space-between',
          px: sidebarCollapsed ? 1 : 2,
          py: 2,
          minHeight: 64,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        {!sidebarCollapsed && (
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            Leadership Eval
          </Typography>
        )}

        {!isMobile && (
          <IconButton
            onClick={handleCollapseToggle}
            size="small"
            sx={{
              color: 'text.secondary',
            }}
          >
            <ChevronLeftIcon
              sx={{
                transform: sidebarCollapsed ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: theme.transitions.create('transform', {
                  duration: theme.transitions.duration.shortest,
                }),
              }}
            />
          </IconButton>
        )}
      </Box>

      {/* Navegación principal */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <List sx={{ pt: 1 }}>{navigationItems.map(item => renderNavigationItem(item))}</List>

        {/* Elementos de admin */}
        {profile?.role === 'admin' || profile?.role === 'super_admin' ? (
          <>
            <Divider sx={{ my: 2 }} />
            <List>{adminItems.map(item => renderNavigationItem(item))}</List>
          </>
        ) : null}
      </Box>
    </Box>
  );

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'permanent'}
      open={isMobile ? sidebarOpen : true} // Conectado con estado global
      onClose={() => dispatch(setSidebarOpen(false))}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          overflowX: 'hidden',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
}
