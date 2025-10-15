// ============================================================================
// PÁGINA DE EQUIPOS
// ============================================================================
// Lista y gestión de equipos
// ============================================================================

import { Box, Typography, Button, Chip, Avatar, AvatarGroup } from '@mui/material';
import { Add as AddIcon, Person as PersonIcon } from '@mui/icons-material';
import { CustomTable, type Column } from '../components';
import { useTeams } from '../hooks';
import type { Team } from '../types';

export function Teams() {
  const { teams, isLoading } = useTeams();

  const handleCreateTeam = () => {
    // TODO: Implementar navegación a crear equipo
    console.log('Navigate to create team');
  };

  const handleViewTeam = (team: Team) => {
    // TODO: Implementar navegación a ver equipo
    console.log('View team:', team.id);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  // Configuración de columnas para la tabla
  const columns: Column<Team>[] = [
    {
      id: 'name',
      label: 'Nombre del Equipo',
      sortable: true,
      render: (value, row) => (
        <Box>
          <Typography variant="body2" fontWeight={500}>
            {String(value)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Proyecto: {row.project_id}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'created_at',
      label: 'Miembros',
      align: 'center',
      render: () => (
        <AvatarGroup max={4} sx={{ justifyContent: 'center' }}>
          <Avatar sx={{ width: 32, height: 32 }}>
            <PersonIcon />
          </Avatar>
          <Avatar sx={{ width: 32, height: 32 }}>
            <PersonIcon />
          </Avatar>
          <Avatar sx={{ width: 32, height: 32 }}>
            <PersonIcon />
          </Avatar>
        </AvatarGroup>
      ),
    },
    {
      id: 'is_active',
      label: 'Estado',
      align: 'center',
      render: value => <Chip label={value ? 'Activo' : 'Inactivo'} color={value ? 'success' : 'default'} size="small" />,
    },
    {
      id: 'created_at',
      label: 'Creado',
      sortable: true,
      render: value => formatDate(String(value)),
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Equipos
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gestiona los equipos y sus miembros
          </Typography>
        </Box>

        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateTeam}>
          Nuevo Equipo
        </Button>
      </Box>

      {/* Tabla de equipos */}
      <CustomTable
        data={teams}
        columns={columns}
        loading={isLoading}
        searchable
        pagination
        onRowClick={handleViewTeam}
        emptyMessage="No hay equipos disponibles"
      />
    </Box>
  );
}
