// ============================================================================
// PÁGINA DE EVALUACIONES
// ============================================================================
// Lista y gestión de evaluaciones
// ============================================================================

import { Box, Typography, Button, Chip } from '@mui/material';
import { Add as AddIcon, Assessment as AssessmentIcon } from '@mui/icons-material';
import { CustomTable, type Column } from '../components';
import { useEvaluations } from '../hooks';
import type { Evaluation } from '../types';

export function Evaluations() {
  const { evaluations, isLoading } = useEvaluations();

  const handleCreateEvaluation = () => {
    // TODO: Implementar navegación a crear evaluación
    console.log('Navigate to create evaluation');
  };

  const handleViewEvaluation = (evaluation: Evaluation) => {
    // TODO: Implementar navegación a ver evaluación
    console.log('View evaluation:', evaluation.id);
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
      render: (value, row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AssessmentIcon color="primary" />
          <Box>
            <Typography variant="body2" fontWeight={500}>
              Evaluación #{String(value).slice(0, 8)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Equipo: {row.team_id}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      id: 'created_at',
      label: 'Fecha Creación',
      sortable: true,
      render: value => formatDate(String(value)),
    },
    {
      id: 'created_at',
      label: 'Estado',
      align: 'center',
      render: () => <Chip label="Activa" color="success" size="small" />,
    },
    {
      id: 'evaluator_name',
      label: 'Evaluador',
      render: (value: unknown) => <Typography variant="body2">{String(value || 'Sin asignar')}</Typography>,
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Evaluaciones
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gestiona las evaluaciones de liderazgo
          </Typography>
        </Box>

        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateEvaluation}>
          Nueva Evaluación
        </Button>
      </Box>

      {/* Tabla de evaluaciones */}
      <CustomTable
        data={evaluations}
        columns={columns}
        loading={isLoading}
        searchable
        pagination
        onRowClick={handleViewEvaluation}
        emptyMessage="No hay evaluaciones disponibles"
      />
    </Box>
  );
}
