// ============================================================================
// PÁGINA DE EVALUACIONES - VERSIÓN OPTIMIZADA
// ============================================================================

import { Box, Typography, Button, Chip, IconButton, Tooltip, Card, LinearProgress, Alert, Grid, Paper } from '@mui/material';
import {
  Assessment as AssessmentIcon,
  Visibility as VisibilityIcon,
  PlayArrow as ContinueIcon,
  Download as DownloadIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useState } from 'react';
import { CustomTable, type Column, EvaluationViewer } from '../components';
import { useEvaluations } from '../hooks';
import type { Evaluation } from '../types';

// Interface extendida para las evaluaciones con campos adicionales
interface EnhancedEvaluation extends Evaluation {
  team_name: string;
  project_name: string;
}

export function Evaluations() {
  const { evaluations, isLoading, refetch } = useEvaluations();
  const [selectedEvaluationId, setSelectedEvaluationId] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    status: 'all',
    role: 'all',
    team: 'all',
  });

  // Estadísticas rápidas
  const stats = {
    total: evaluations?.length || 0,
    completed: evaluations?.filter(e => e.is_complete).length || 0,
    inProgress: evaluations?.filter(e => !e.is_complete).length || 0,
    completionRate: evaluations?.length ? Math.round((evaluations.filter(e => e.is_complete).length / evaluations.length) * 100) : 0,
  };

  // Enriquecer evaluaciones con nombre de equipo y proyecto
  const evaluationsWithNames: EnhancedEvaluation[] = (evaluations || []).map(ev => {
    let teamName = ev.team_name;
    let projectName = ev.teams?.projects?.name;

    if (!teamName && ev.team && typeof ev.team === 'object') {
      teamName = ev.team.name;
    }
    if (!projectName && ev.teams?.projects?.name) {
      projectName = ev.teams.projects.name;
    }

    return {
      ...ev,
      team_name: teamName || 'Sin equipo',
      project_name: projectName || 'Sin proyecto',
    };
  });

  // Aplicar filtros
  const filteredEvaluations = evaluationsWithNames.filter(evaluation => {
    if (activeFilters.status !== 'all') {
      if (activeFilters.status === 'completed' && !evaluation.is_complete) return false;
      if (activeFilters.status === 'in-progress' && evaluation.is_complete) return false;
    }

    if (activeFilters.role !== 'all' && evaluation.evaluator_role !== activeFilters.role) {
      return false;
    }

    return true;
  });

  const handleViewEvaluation = (evaluation: EnhancedEvaluation) => {
    if (evaluation.is_complete) {
      setSelectedEvaluationId(evaluation.id);
      setViewerOpen(true);
    } else {
      // TODO: Implementar continuación de evaluación
      console.log('Continue evaluation:', evaluation.id);
    }
  };

  const handleContinueEvaluation = (evaluation: EnhancedEvaluation, e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implementar continuación de evaluación
    console.log('Continue evaluation:', evaluation.id);
  };

  const handleDownloadReport = (evaluation: EnhancedEvaluation, e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implementar descarga de reporte
    console.log('Download report for:', evaluation.id);
  };

  const closeViewer = () => {
    setViewerOpen(false);
    setSelectedEvaluationId(null);
  };

  const handleRefresh = () => {
    refetch();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Configuración de columnas optimizada para evitar scroll horizontal
  const columns: Column<EnhancedEvaluation>[] = [
    {
      id: 'id',
      label: 'Evaluación',
      sortable: true,
      render: (_, row) => {
        // Acortar el nombre de la evaluación si es muy largo
        const title = row.template_title || 'Evaluación sin título';
        const shortTitle = title.length > 24 ? title.slice(0, 24) + '...' : title;
        return (
          <Tooltip title={title} enterDelay={500}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 28,
                  height: 28,
                  borderRadius: 1.5,
                  bgcolor: row.is_complete ? 'success.light' : 'warning.light',
                  color: 'white',
                  flexShrink: 0,
                }}
              >
                <AssessmentIcon fontSize="small" />
              </Box>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography
                  variant="body2"
                  fontWeight={600}
                  noWrap
                  sx={{
                    fontSize: '0.80rem',
                    lineHeight: 1.2,
                    maxWidth: 110,
                  }}
                >
                  {shortTitle}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', fontSize: '0.72rem', maxWidth: 110 }}>
                  {row.team_name}
                </Typography>
              </Box>
            </Box>
          </Tooltip>
        );
      },
    },
    {
      id: 'evaluator_name',
      label: 'Evaluador',
      render: (value: unknown, row) => (
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" fontWeight={500} noWrap sx={{ fontSize: '0.875rem' }}>
            {String(value || 'Sin asignar')}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
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
        <Chip
          label={value === 'leader' ? 'Líder' : 'Colab.'}
          color={value === 'leader' ? 'primary' : 'secondary'}
          size="small"
          variant="outlined"
          sx={{
            fontSize: '0.75rem',
            height: 24,
            '& .MuiChip-label': { px: 1 },
          }}
        />
      ),
    },
    {
      id: 'is_complete',
      label: 'Progreso',
      align: 'center',
      render: (value, row) => {
        const percentage = typeof row.completion_percentage === 'number' ? row.completion_percentage : 0;

        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, minWidth: 80 }}>
            {!value ? (
              <>
                <LinearProgress
                  variant="determinate"
                  value={percentage}
                  sx={{
                    width: '100%',
                    height: 6,
                    borderRadius: 3,
                    minWidth: 60,
                  }}
                />
                <Typography variant="caption" fontWeight={500} sx={{ fontSize: '0.75rem' }}>
                  {percentage}%
                </Typography>
              </>
            ) : (
              <Chip
                label="Completada"
                color="success"
                size="small"
                sx={{
                  fontSize: '0.75rem',
                  height: 24,
                }}
              />
            )}
          </Box>
        );
      },
    },
    {
      id: 'completed_at',
      label: 'Fecha',
      sortable: true,
      render: value =>
        value ? (
          <Tooltip title={new Date(String(value)).toLocaleString('es-ES')}>
            <Typography variant="body2" noWrap sx={{ fontSize: '0.875rem' }}>
              {formatDate(String(value))}
            </Typography>
          </Tooltip>
        ) : (
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
            En progreso
          </Typography>
        ),
    },
    {
      id: 'evaluator_email',
      label: 'Acciones',
      align: 'center',
      render: (_, row) => (
        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', minWidth: 80 }}>
          {row.is_complete ? (
            <>
              <Tooltip title="Ver evaluación">
                <IconButton
                  size="small"
                  color="primary"
                  onClick={e => {
                    e.stopPropagation();
                    handleViewEvaluation(row);
                  }}
                  sx={{
                    width: 32,
                    height: 32,
                    '& .MuiSvgIcon-root': { fontSize: '1.1rem' },
                  }}
                >
                  <VisibilityIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Descargar reporte">
                <IconButton
                  size="small"
                  color="secondary"
                  onClick={e => handleDownloadReport(row, e)}
                  sx={{
                    width: 32,
                    height: 32,
                    '& .MuiSvgIcon-root': { fontSize: '1.1rem' },
                  }}
                >
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
            </>
          ) : (
            <Tooltip title="Continuar evaluación">
              <Button
                variant="contained"
                size="small"
                onClick={e => handleContinueEvaluation(row, e)}
                sx={{
                  minWidth: 'auto',
                  px: 1.5,
                  py: 0.5,
                  fontSize: '0.75rem',
                  height: 32,
                }}
                startIcon={<ContinueIcon sx={{ fontSize: '1.1rem' }} />}
              >
                Cont.
              </Button>
            </Tooltip>
          )}
        </Box>
      ),
    },
  ];

  // Componente para el estado vacío mejorado

  return (
    <Box
      sx={{
        px: { xs: 1, sm: 2, md: 4 },
        py: { xs: 1, sm: 2 },
        width: '100%',
        maxWidth: '100vw',
        boxSizing: 'border-box',
        bgcolor: 'background.default',
        minHeight: '100vh',
      }}
    >
      {/* Header visual y responsivo */}
      <Box sx={{ mb: 4, px: { xs: 1, sm: 2 }, py: { xs: 2, sm: 3 }, borderRadius: 3, bgcolor: 'background.paper', boxShadow: 1 }}>
        <Grid container alignItems="center" spacing={2}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <AssessmentIcon sx={{ fontSize: 40, color: 'primary.main', mr: 1 }} />
              <Box>
                <Typography variant="h4" component="h1" fontWeight={700} gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                  Evaluaciones
                </Typography>
                <Typography variant="body1" color="text.secondary" noWrap>
                  Gestiona y revisa todas las evaluaciones
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 5 }}>
            <Box
              sx={{
                display: 'flex',
                gap: 1.5,
                justifyContent: { xs: 'flex-start', md: 'flex-end' },
                flexWrap: 'wrap',
                mt: { xs: 2, md: 0 },
              }}
            >
              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={() => {
                  /* TODO: Implementar filtros */
                }}
                sx={{
                  fontSize: '0.95rem',
                  borderRadius: 2,
                  boxShadow: 0,
                  bgcolor: 'background.default',
                  ':hover': { bgcolor: 'grey.100' },
                }}
                size="medium"
              >
                Filtros
              </Button>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleRefresh}
                disabled={isLoading}
                size="medium"
                sx={{
                  fontSize: '0.95rem',
                  borderRadius: 2,
                  boxShadow: 0,
                  bgcolor: 'background.default',
                  ':hover': { bgcolor: 'grey.100' },
                }}
              >
                Actualizar
              </Button>
            </Box>
          </Grid>
        </Grid>

        {/* Tarjetas de estadísticas con iconos y colores */}
        <Grid container spacing={2} sx={{ mt: 2, display: 'none' }}>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Card
              sx={{
                p: 2,
                textAlign: 'center',
                borderRadius: 2,
                boxShadow: 0,
                bgcolor: 'primary.light',
                transition: 'transform 0.2s',
                ':hover': { transform: 'scale(1.04)' },
              }}
            >
              <AssessmentIcon sx={{ fontSize: 28, mb: 1 }} />
              <Typography variant="h6" fontWeight={700}>
                {stats.total}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.85 }}>
                Total
              </Typography>
            </Card>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Card
              sx={{
                p: 2,
                textAlign: 'center',
                borderRadius: 2,
                boxShadow: 0,
                bgcolor: 'success.light',
                transition: 'transform 0.2s',
                ':hover': { transform: 'scale(1.04)' },
              }}
            >
              <VisibilityIcon sx={{ fontSize: 28, mb: 1 }} />
              <Typography variant="h6" fontWeight={700}>
                {stats.completed}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.85 }}>
                Completas
              </Typography>
            </Card>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Card
              sx={{
                p: 2,
                textAlign: 'center',
                borderRadius: 2,
                boxShadow: 0,
                bgcolor: 'warning.light',
                transition: 'transform 0.2s',
                ':hover': { transform: 'scale(1.04)' },
              }}
            >
              <ContinueIcon sx={{ fontSize: 28, mb: 1 }} />
              <Typography variant="h6" fontWeight={700}>
                {stats.inProgress}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.85 }}>
                En Progreso
              </Typography>
            </Card>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Card
              sx={{
                p: 2,
                textAlign: 'center',
                borderRadius: 2,
                boxShadow: 0,
                bgcolor: 'info.light',
                transition: 'transform 0.2s',
                ':hover': { transform: 'scale(1.04)' },
              }}
            >
              <DownloadIcon sx={{ fontSize: 28, mb: 1 }} />
              <Typography variant="h6" fontWeight={700}>
                {stats.completionRate}%
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.85 }}>
                Completadas
              </Typography>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Contenido principal con fondo y bordes suaves */}
      <Paper
        elevation={0}
        sx={{
          border: 1,
          borderColor: 'divider',
          borderRadius: 3,
          overflow: 'hidden',
          bgcolor: 'background.paper',
          boxShadow: 1,
          mt: 2,
        }}
      >
        {/* Tabla de evaluaciones optimizada */}
        <Box
          sx={{
            width: '100%',
            overflow: 'hidden',
            '& .MuiTableContainer-root': {
              overflowX: 'auto',
            },
            px: { xs: 0, sm: 1 },
            py: { xs: 0, sm: 1 },
          }}
        >
          <CustomTable
            data={filteredEvaluations}
            columns={columns}
            loading={isLoading}
            searchable
            pagination
            onRowClick={handleViewEvaluation}
          />
        </Box>
      </Paper>

      {/* Modal de visualización de evaluaciones */}
      <EvaluationViewer open={viewerOpen} evaluationId={selectedEvaluationId} onClose={closeViewer} />

      {/* Alertas contextuales */}
      {filteredEvaluations.length === 0 && evaluationsWithNames.length > 0 && (
        <Alert severity="info" sx={{ mt: 2, fontSize: '0.875rem' }}>
          No se encontraron evaluaciones con los filtros aplicados.
          <Button
            color="inherit"
            size="small"
            onClick={() => setActiveFilters({ status: 'all', role: 'all', team: 'all' })}
            sx={{ ml: 1, fontSize: '0.75rem' }}
          >
            Limpiar filtros
          </Button>
        </Alert>
      )}
    </Box>
  );
}
