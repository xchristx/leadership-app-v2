// ============================================================================
// PÁGINA DE PROYECTOS
// ============================================================================
// Lista y gestión de proyectos con tabla y filtros
// ============================================================================

import { Box, Typography, Button, Chip } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { CustomTable, type Column } from '../components';
import { useProjects } from '../hooks';
import type { Project } from '../types';

export function Projects() {
  const { projects, isLoading } = useProjects();

  const handleCreateProject = () => {
    // TODO: Implementar navegación a crear proyecto
    console.log('Navigate to create project');
  };

  const handleViewProject = (project: Project) => {
    // TODO: Implementar navegación a ver proyecto
    console.log('View project:', project.id);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'completed':
        return 'primary';
      case 'draft':
        return 'default';
      case 'archived':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Activo';
      case 'completed':
        return 'Completado';
      case 'draft':
        return 'Borrador';
      case 'archived':
        return 'Archivado';
      default:
        return status;
    }
  };

  // Configuración de columnas para la tabla
  const columns: Column<Project>[] = [
    {
      id: 'name',
      label: 'Nombre',
      sortable: true,
      render: (value, row) => (
        <Box>
          <Typography variant="body2" fontWeight={500}>
            {String(value)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Creado: {formatDate(row.created_at)}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'status',
      label: 'Estado',
      align: 'center',
      render: value => <Chip label={getStatusLabel(String(value))} color={getStatusColor(String(value))} size="small" />,
    },
    {
      id: 'created_at',
      label: 'Fecha Creación',
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
            Proyectos
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gestiona tus proyectos de evaluación de liderazgo
          </Typography>
        </Box>

        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateProject}>
          Nuevo Proyecto
        </Button>
      </Box>

      {/* Tabla de proyectos */}
      <CustomTable
        data={projects}
        columns={columns}
        loading={isLoading}
        searchable
        pagination
        onRowClick={handleViewProject}
        emptyMessage="No hay proyectos disponibles"
      />
    </Box>
  );
}
