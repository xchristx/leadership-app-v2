// ============================================================================
// PÁGINA DE EVALUACIONES
// ============================================================================
// Lista y gestión de evaluaciones con modal de visualización
// ============================================================================

import { Box, Typography, Button, Chip, IconButton, Tooltip } from '@mui/material';
import { Add as AddIcon, Assessment as AssessmentIcon, Visibility as VisibilityIcon } from '@mui/icons-material';
import { useState } from 'react';
import { CustomTable, type Column, EvaluationViewer } from '../components';
import { useEvaluations } from '../hooks';
import type { Evaluation } from '../types';

export function Evaluations() {
  const { evaluations, isLoading } = useEvaluations();

  console.log({ evaluations });

  // Enriquecer evaluaciones con nombre de equipo y proyecto si no existen
  const evaluationsWithNames = (evaluations || []).map(ev => {
    // Si existe la relación team y/o project, extraerlos
    let teamName = ev.team_name;
    let projectName = ev.teams?.projects.name;
    if (!teamName && ev.team && typeof ev.team === 'object') {
      teamName = ev.team.name;
      if (!projectName && ev.teams?.projects.name && typeof ev.teams?.projects.name === 'object') {
        projectName = ev.teams.projects.name;
      }
    }
    return {
      ...ev,
      team_name: teamName || '',
      project_name: projectName || '',
    };
  });
  const [selectedEvaluationId, setSelectedEvaluationId] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  const handleCreateEvaluation = () => {
    // TODO: Implementar navegación a crear evaluación
    console.log('Navigate to create evaluation');
  };

  const handleViewEvaluation = (evaluation: Evaluation) => {
    if (evaluation.is_complete) {
      setSelectedEvaluationId(evaluation.id);
      setViewerOpen(true);
    } else {
      console.log('Continue evaluation:', evaluation.id);
    }
  };

  const closeViewer = () => {
    setViewerOpen(false);
    setSelectedEvaluationId(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  // Configuración de columnas para la tabla
  const columns: Column<Evaluation>[] = [
    {
      id: 'id',
      label: 'Evaluación',
      sortable: true,
      render: (_, row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AssessmentIcon color="primary" />
          <Typography variant="body2" fontWeight={500}>
            {row.template_title || 'Template sin título'}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'team_name',
      label: 'Equipo',
      render: value => <Typography variant="body2">{String(value || 'Equipo sin nombre')}</Typography>,
    },
    {
      id: 'project_name' as 'team_name',
      label: 'Proyecto',
      render: value => <Typography variant="body2">{String(value || '-')}</Typography>,
    },
    {
      id: 'evaluator_name',
      label: 'Evaluador',
      render: (value: unknown, row) => (
        <Box>
          <Typography variant="body2" fontWeight={500}>
            {String(value || 'Sin asignar')}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {row.evaluator_email}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'evaluator_role',
      label: 'Rol',
      align: 'center',
      render: value => (
        <Chip label={value === 'leader' ? 'Líder' : 'Colaborador'} color={value === 'leader' ? 'primary' : 'secondary'} size="small" />
      ),
    },
    {
      id: 'is_complete',
      label: 'Estado',
      align: 'center',
      render: (value, row) => {
        const percentage = typeof row.completion_percentage === 'number' ? row.completion_percentage : 0;
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
            <Chip label={value ? 'Completa' : 'En progreso'} color={value ? 'success' : 'warning'} size="small" />
            {Boolean(value) && percentage > 0 && (
              <Typography variant="caption" color="text.secondary">
                {percentage}%
              </Typography>
            )}
          </Box>
        );
      },
    },
    {
      id: 'completed_at',
      label: 'Fecha Finalización',
      sortable: true,
      render: value =>
        value ? (
          formatDate(String(value))
        ) : (
          <Typography variant="caption" color="text.secondary">
            -
          </Typography>
        ),
    },
    {
      id: 'view' as 'evaluator_metadata',
      label: 'Ver',
      align: 'center',
      render: (_, row) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title={row.is_complete ? 'Ver evaluación completa' : 'Continuar evaluación'}>
            <IconButton
              size="small"
              onClick={e => {
                e.stopPropagation();
                handleViewEvaluation(row);
              }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box
      sx={{
        px: { xs: 1, sm: 2, md: 3 },
        py: { xs: 1, sm: 2, md: 3 },
        width: '100%',
        maxWidth: '100vw',
        boxSizing: 'border-box',
        overflowX: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          mb: 3,
          gap: { xs: 2, sm: 0 },
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Evaluaciones
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gestiona las evaluaciones de liderazgo
          </Typography>
        </Box>
        <Button
          sx={{ display: 'none', mt: { xs: 1, sm: 0 }, width: { xs: '100%', sm: 'auto' } }}
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateEvaluation}
        >
          Nueva Evaluación
        </Button>
      </Box>

      {/* Tabla de evaluaciones */}
      <Box sx={{ width: '100%', overflowX: 'auto' }}>
        <CustomTable
          data={evaluationsWithNames}
          columns={columns}
          loading={isLoading}
          searchable
          pagination
          onRowClick={handleViewEvaluation}
          emptyMessage="No hay evaluaciones disponibles"
        />
      </Box>

      {/* Modal de visualización de evaluaciones */}
      <EvaluationViewer open={viewerOpen} evaluationId={selectedEvaluationId} onClose={closeViewer} />
    </Box>
  );
}
