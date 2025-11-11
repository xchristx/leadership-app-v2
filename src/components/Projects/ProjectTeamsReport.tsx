// ============================================================================
// COMPONENTE PROJECT TEAMS REPORT - INFORME GENERAL DE EQUIPOS
// ============================================================================
// Informe completo de todos los equipos de un proyecto con carátula profesional
// ============================================================================

import { useRef, useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  IconButton,
  Grid,
  CardMedia,
  CircularProgress,
  type SxProps,
} from '@mui/material';
import { Close as CloseIcon, Description as WordIcon, Assessment as AssessmentIcon } from '@mui/icons-material';
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { supabase } from '../../lib/supabase';
import type { Team } from '../../types';
import type { CategorySummary } from '../Teams/ComparativeAnalysis/types';
import SimplePDFExporter from '../PDF/SimplePDFExporter';

interface ProjectTeamsReportProps {
  open: boolean;
  onClose: () => void;
  teams: Team[];
  projectName: string;
}

interface TeamCategoryData {
  teamId: string;
  teamName: string;
  categories: CategorySummary[];
}

export function ProjectTeamsReport({ open, onClose, teams, projectName }: ProjectTeamsReportProps) {
  const { palette } = useTheme();
  const lineChartRef = useRef<HTMLDivElement>(null);

  // Estados para datos de categorías
  const [teamsCategoryData, setTeamsCategoryData] = useState<TeamCategoryData[]>([]);
  const [aggregatedCategories, setAggregatedCategories] = useState<CategorySummary[]>([]);
  const [loading, setLoading] = useState(false);

  // Usar todos los equipos (ya no se filtra project_leadership, está obsoleto)
  const regularTeams = useMemo(() => teams, [teams]);

  // Verificar si hay datos del director (supervisor) en las categorías agregadas
  const hasSupervisorData = useMemo(() => aggregatedCategories?.some(cat => cat.supervisor_total > 0), [aggregatedCategories]);
  // Cargar datos de categorías para todos los equipos
  useEffect(() => {
    async function loadTeamsCategoryData() {
      if (!open || regularTeams.length === 0) return;

      setLoading(true);
      try {
        const teamsData: TeamCategoryData[] = [];
        const categoryAggregation: Map<string, { auto_total: number; otros_total: number; supervisor_total: number; count: number }> =
          new Map();

        for (const team of regularTeams) {
          // Obtener evaluaciones del equipo
          const { data: evaluations, error } = await supabase
            .from('evaluations')
            .select(
              `
              id,
              evaluator_role,
              responses_data,
              teams!inner(
                projects!inner(
                  question_templates!inner(
                    questions(*)
                  )
                )
              )
            `
            )
            .eq('team_id', team.id)
            .eq('is_complete', true)
            .not('responses_data', 'is', null);

          if (error || !evaluations || evaluations.length === 0) continue;

          // Procesar evaluaciones del equipo
          const evalWithRelations = evaluations[0] as {
            teams?: {
              projects?: {
                question_templates?: {
                  questions?: Array<{
                    id: string;
                    question_type: string | null;
                    text_leader: string;
                    text_collaborator: string;
                    order_index: number;
                    category: unknown;
                  }>;
                };
              };
            };
          };

          const questions = evalWithRelations?.teams?.projects?.question_templates?.questions || [];
          const categoryMap = new Map<string, { name: string; auto_total: number; otros_total: number; supervisor_total: number }>();

          for (const question of questions) {
            if (question.question_type !== 'likert') continue;

            const leaderResponses: number[] = [];
            const collaboratorResponses: number[] = [];
            const supervisorResponses: number[] = [];
            evaluations.forEach(evaluation => {
              const role = evaluation.evaluator_role;
              const responses: Record<string, unknown> = {};
              try {
                if (evaluation.responses_data) {
                  const jsonData =
                    typeof evaluation.responses_data === 'string' ? JSON.parse(evaluation.responses_data) : evaluation.responses_data;

                  if (jsonData && typeof jsonData === 'object' && 'responses' in jsonData) {
                    const responsesData = jsonData.responses as Record<string, unknown>;
                    Object.entries(responsesData).forEach(([questionId, responseData]) => {
                      if (responseData && typeof responseData === 'object' && 'value' in responseData) {
                        responses[questionId] = (responseData as { value: unknown }).value;
                      }
                    });
                  }
                }
              } catch (error) {
                console.warn('Error parsing responses_data:', error);
              }
              const responseValue = responses[question.id];
              if (typeof responseValue === 'number') {
                if (role === 'leader') {
                  leaderResponses.push(responseValue);
                } else if (role === 'supervisor') {
                  supervisorResponses.push(responseValue);
                } else {
                  collaboratorResponses.push(responseValue);
                }
              }
            });

            if (leaderResponses.length > 0 || collaboratorResponses.length > 0 || supervisorResponses.length > 0) {
              const leaderAvg =
                leaderResponses.length > 0 ? leaderResponses.reduce((sum, val) => sum + val, 0) / leaderResponses.length : 0;
              const collaboratorsAvg =
                collaboratorResponses.length > 0
                  ? collaboratorResponses.reduce((sum, val) => sum + val, 0) / collaboratorResponses.length
                  : 0;
              const supervisorsAvg =
                supervisorResponses.length > 0 ? supervisorResponses.reduce((sum, val) => sum + val, 0) / supervisorResponses.length : 0;

              // Procesar por categorías
              if (question.category) {
                let categoryName = 'Sin Categoría';

                try {
                  const categoryData = typeof question.category === 'string' ? JSON.parse(question.category) : question.category;

                  if (categoryData && typeof categoryData === 'object' && 'name' in categoryData) {
                    categoryName = (categoryData as { name: string }).name;
                  }
                } catch (error) {
                  console.warn('Error parsing category data:', error);
                }

                if (!categoryMap.has(categoryName)) {
                  categoryMap.set(categoryName, {
                    name: categoryName,
                    auto_total: 0,
                    otros_total: 0,
                    supervisor_total: 0,
                  });
                }

                const cat = categoryMap.get(categoryName)!;
                cat.auto_total += leaderAvg;
                cat.otros_total += collaboratorsAvg;
                cat.supervisor_total += supervisorsAvg;

                // Agregar a la agregación global
                if (!categoryAggregation.has(categoryName)) {
                  categoryAggregation.set(categoryName, {
                    auto_total: 0,
                    otros_total: 0,
                    supervisor_total: 0,
                    count: 0,
                  });
                }
                const aggCat = categoryAggregation.get(categoryName)!;
                aggCat.auto_total += leaderAvg;
                aggCat.otros_total += collaboratorsAvg;
                aggCat.supervisor_total += supervisorsAvg;
                aggCat.count += 1;
              }
            }
          }

          // Guardar datos del equipo
          const teamCategories: CategorySummary[] = Array.from(categoryMap.values()).map(cat => ({
            category: cat.name,
            auto_total: cat.auto_total,
            otros_total: cat.otros_total,
            supervisor_total: cat.supervisor_total,
          }));

          teamsData.push({
            teamId: team.id,
            teamName: team.name,
            categories: teamCategories,
          });
        }
        // Calcular promedios agregados
        const aggregated: CategorySummary[] = Array.from(categoryAggregation.entries()).map(([category, data]) => ({
          category,
          auto_total: data.count > 0 ? data.auto_total / data.count : 0,
          otros_total: data.count > 0 ? data.otros_total / data.count : 0,
          supervisor_total: data.count > 0 ? data.supervisor_total / data.count : 0,
        }));

        setTeamsCategoryData(teamsData);
        setAggregatedCategories(aggregated);
      } catch (error) {
        console.error('Error loading teams category data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadTeamsCategoryData();
  }, [open, regularTeams]);

  // Estilo común para páginas en formato carta (exacto para exportación PDF)
  const pageStyle: SxProps = {
    width: '216mm',
    height: '279mm',
    maxWidth: '216mm',
    maxHeight: '279mm',
    p: '20mm',
    mb: '10mm',
    boxSizing: 'border-box',
    backgroundColor: 'white',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    mx: 'auto',
    overflow: 'hidden',
    '@media print': {
      width: '216mm',
      height: '279mm',
      p: '20mm',
      mb: 0,
      boxShadow: 'none',
      pageBreakAfter: 'always',
    },
  };

  // Calcular estadísticas generales
  const totalTeams = regularTeams.length;
  const totalMembers = regularTeams.reduce((sum, team) => sum + (team.team_size || 0), 0);
  console.log({ aggregatedCategories });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth PaperProps={{ sx: { maxHeight: '90vh' } }}>
      {/* Header del diálogo */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
          borderBottom: '1px solid #e0e0e0',
          backgroundColor: '#f8f9fa',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AssessmentIcon sx={{ color: palette.primary.main, fontSize: 28 }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Informe General de Equipos
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }} data-testid="export-buttons">
          {/* Botones de exportación */}
          <SimplePDFExporter contentElementId="project-teams-report-content" />
          <Button variant="outlined" size="small" startIcon={<WordIcon />} disabled sx={{ display: 'none' }}>
            Word
          </Button>

          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      <DialogContent sx={{ py: 3, backgroundColor: '#f5f5f5' }}>
        <Box id="project-teams-report-content" sx={{ p: 0 }}>
          {/* ============================================================ */}
          {/* CARÁTULA */}
          {/* ============================================================ */}
          <Paper data-testid="page" sx={{ ...pageStyle, p: 0 }} className="caratula">
            <Box
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                overflow: 'hidden',
                justifyContent: 'space-between',
              }}
            >
              {/* Header corporativo */}
              <Box
                sx={{
                  height: '100px',
                  background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 50%, #0d47a1 100%)',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  px: 4,
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: `
                      linear-gradient(45deg, transparent 65%, rgba(255,255,255,0.03) 65%, rgba(255,255,255,0.03) 70%, transparent 70%),
                      linear-gradient(-45deg, transparent 65%, rgba(255,255,255,0.03) 65%, rgba(255,255,255,0.03) 70%, transparent 70%)
                    `,
                    backgroundSize: '40px 40px',
                    opacity: 0.6,
                  },
                }}
              >
                {/* Logo */}
                <Box
                  sx={{
                    width: 140,
                    height: 70,
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                    border: '2px solid rgba(255,255,255,0.8)',
                    padding: '8px',
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  <CardMedia
                    component="img"
                    image="/ho_logo.jpg"
                    sx={{
                      width: '100%',
                      height: 'auto',
                      maxHeight: 54,
                      objectFit: 'contain',
                    }}
                  />
                </Box>

                {/* Título del header */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', position: 'relative', zIndex: 1 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      color: 'rgba(255,255,255,0.9)',
                      fontWeight: 400,
                      fontSize: '0.9rem',
                      letterSpacing: '0.5px',
                      textShadow: '0 1px 1px rgba(0,0,0,0.1)',
                    }}
                  >
                    Consultores para el desarrollo
                  </Typography>
                </Box>
              </Box>

              {/* Contenido principal */}
              <Box
                sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  px: 6,
                  py: 6,
                  textAlign: 'center',
                }}
              >
                {/* Título principal */}
                <Box
                  sx={{
                    mb: 5,
                    p: 4,
                    backgroundColor: 'white',
                    borderRadius: 3,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    border: '1px solid #e0e0e0',
                    maxWidth: '550px',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '6px',
                      background: 'linear-gradient(90deg, #1976d2, #42a5f5, #1976d2)',
                    },
                  }}
                >
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 700,
                      color: palette.primary.main,
                      fontSize: '2rem',
                      letterSpacing: '1px',
                      textTransform: 'uppercase',
                      mb: 2,
                    }}
                  >
                    INFORME GENERAL
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 600,
                      color: '#0d47a1',
                      fontSize: '1.3rem',
                      letterSpacing: '0.5px',
                    }}
                  >
                    INVENTARIO DE PRÁCTICAS DE LIDERAZGO
                  </Typography>
                </Box>

                {/* Información del proyecto */}
                <Box
                  sx={{
                    backgroundColor: '#f8f9fa',
                    borderRadius: 4,
                    p: 4,
                    mb: 4,
                    maxWidth: '510px',
                    width: '100%',
                    border: '2px solid #e3f2fd',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '6px',
                      height: '100%',
                      background: 'linear-gradient(180deg, #1976d2, #42a5f5)',
                    },
                  }}
                >
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 600,
                      color: palette.primary.main,
                      fontSize: '1.6rem',
                      mb: 3,
                    }}
                  >
                    {projectName}
                  </Typography>

                  <Typography
                    variant="body1"
                    sx={{
                      color: '#546e7a',
                      fontWeight: 400,
                      fontSize: '1rem',
                    }}
                  >
                    Análisis Comparativo de Equipos y Estructura Organizacional
                  </Typography>
                </Box>

                {/* Indicadores de progreso */}
                <Box sx={{ display: 'flex', gap: 2 }}>
                  {[0, 1, 2, 3, 4].map(index => (
                    <Box
                      key={index}
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        backgroundColor: index === 2 ? palette.primary.main : '#e3f2fd',
                        transform: index === 2 ? 'scale(1.5)' : 'scale(1)',
                      }}
                    />
                  ))}
                </Box>
              </Box>

              {/* Footer */}
              <Box
                sx={{
                  backgroundColor: 'white',
                  borderTop: '3px solid #1976d2',
                  py: 3,
                  px: 4,
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 3,
                    backgroundColor: '#f8f9fa',
                    borderRadius: 2,
                    p: 2,
                    border: '1px solid #e0e0e0',
                    maxWidth: 400,
                    margin: '0 auto',
                  }}
                >
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: '10px',
                      backgroundColor: palette.primary.main,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                    }}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.89-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.11-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"
                        fill="white"
                      />
                    </svg>
                  </Box>
                  <Box sx={{ textAlign: 'left', flex: 1 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#546e7a',
                        fontSize: '0.85rem',
                        fontWeight: 500,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        mb: 0.5,
                      }}
                    >
                      Fecha de Elaboración
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{
                        color: palette.primary.main,
                        fontWeight: 600,
                        fontSize: '1.1rem',
                      }}
                    >
                      {new Date().toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Paper>

          {/* ============================================================ */}
          {/* RESUMEN EJECUTIVO */}
          {/* ============================================================ */}
          <Paper data-testid="page" sx={pageStyle} className="pagina-comun">
            {/* Encabezado */}
            <Box
              sx={{
                backgroundColor: '#f8fafc',
                borderLeft: '6px solid #2563eb',
                padding: '15px 25px',
                marginBottom: '20px',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              }}
            >
              <Typography
                variant="h4"
                sx={{
                  margin: 0,
                  fontSize: '24px',
                  fontWeight: '600',
                  color: '#1e293b',
                  textAlign: 'center',
                  mb: 2,
                }}
              >
                Resumen Ejecutivo
              </Typography>
              <Typography
                variant="subtitle1"
                sx={{
                  textAlign: 'center',
                  color: '#64748b',
                  fontSize: '14px',
                }}
              >
                Análisis general de equipos del proyecto
              </Typography>
            </Box>

            {/* Información del proyecto */}
            <Box
              sx={{
                backgroundColor: '#f1f5f9',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                padding: '20px',
                mb: 4,
              }}
            >
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2" sx={{ fontSize: '0.9rem', mb: 1, color: '#252525' }}>
                    <strong style={{ color: '#1e3a8a' }}>Proyecto:</strong> {projectName}
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.9rem', color: '#252525' }}>
                    <strong style={{ color: '#1e3a8a' }}>Período:</strong>{' '}
                    {new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2" sx={{ fontSize: '0.9rem', mb: 1, color: '#252525' }}>
                    <strong style={{ color: '#1e3a8a' }}>Total equipos:</strong> {totalTeams}
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.9rem', color: '#252525' }}>
                    <strong style={{ color: '#1e3a8a' }}>Total participantes:</strong> {totalMembers}
                  </Typography>
                </Grid>
                {hasSupervisorData && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.85rem', color: '#1e3a8a', fontStyle: 'italic', mt: 1 }}>
                      * Este proyecto incluye evaluaciones del Director
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>

            <TableContainer
              sx={{
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                mb: 3,
              }}
            >
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f9fafb' }}>
                    <TableCell
                      sx={{
                        color: '#374151',
                        fontWeight: '600',
                        fontSize: '0.85rem',
                        borderBottom: '2px solid #e5e7eb',
                        py: 1.5,
                      }}
                    >
                      Equipo
                    </TableCell>
                    <TableCell
                      sx={{
                        color: '#374151',
                        fontWeight: '600',
                        fontSize: '0.85rem',
                        borderBottom: '2px solid #e5e7eb',
                      }}
                    >
                      Líder
                    </TableCell>
                    <TableCell
                      sx={{
                        color: '#374151',
                        fontWeight: '600',
                        fontSize: '0.85rem',
                        borderBottom: '2px solid #e5e7eb',
                      }}
                    >
                      Contacto
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        color: '#374151',
                        fontWeight: '600',
                        fontSize: '0.85rem',
                        borderBottom: '2px solid #e5e7eb',
                      }}
                    >
                      Miembros
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {regularTeams.map(team => (
                    <TableRow
                      key={team.id}
                      sx={{
                        '&:nth-of-type(odd)': {
                          backgroundColor: '#f8fafc',
                        },
                        '&:hover': {
                          backgroundColor: '#e2e8f0',
                        },
                      }}
                    >
                      <TableCell
                        sx={{
                          fontWeight: '600',
                          fontSize: '0.85rem',
                          color: '#1e3a8a',
                          borderRight: '1px solid #e2e8f0',
                          padding: '12px 8px',
                        }}
                      >
                        {team.name}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.85rem', padding: '12px 8px' }}>{team.leader_name || '-'}</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', padding: '12px 8px', color: '#64748b' }}>{team.leader_email || '-'}</TableCell>
                      <TableCell align="center" sx={{ fontSize: '0.9rem', fontWeight: '600', padding: '12px 8px' }}>
                        {team.team_size || 0}
                      </TableCell>
                    </TableRow>
                  ))}
                  {regularTeams.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        align="center"
                        sx={{
                          fontSize: '0.9rem',
                          color: '#64748b',
                          fontStyle: 'italic',
                          padding: '20px',
                        }}
                      >
                        No hay equipos registrados en este proyecto
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* ============================================================ */}
          {/* ANÁLISIS POR CATEGORÍAS - COMPARACIÓN PROMEDIO */}
          {/* ============================================================ */}
          {loading ? (
            <Paper data-testid="page" sx={pageStyle} className="pagina-comun">
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                <CircularProgress />
              </Box>
            </Paper>
          ) : aggregatedCategories.length > 0 ? (
            <>
              {/* PÁGINA 1: Tabla Comparativa */}
              <Paper data-testid="page" sx={pageStyle} className="pagina-comun">
                {/* Encabezado */}
                <Box
                  sx={{
                    backgroundColor: '#f8fafc',
                    borderLeft: '6px solid #2563eb',
                    padding: '15px 25px',
                    marginBottom: '20px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  }}
                >
                  <Typography
                    variant="h4"
                    sx={{
                      margin: 0,
                      fontSize: '24px',
                      fontWeight: '600',
                      color: '#1e293b',
                      textAlign: 'center',
                      mb: 2,
                    }}
                  >
                    Análisis Comparativo por Categorías
                  </Typography>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      textAlign: 'center',
                      color: '#64748b',
                      fontSize: '14px',
                    }}
                  >
                    Comparación promedio de líderes y colaboradores en las cinco prácticas de liderazgo
                  </Typography>
                </Box>

                {/* Tabla comparativa por categoría */}
                <Box sx={{ mb: 4 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: '600',
                      fontSize: '16px',
                      color: '#374151',
                      mb: 2,
                      textAlign: 'center',
                    }}
                  >
                    Cuadro Comparativo - Promedio General por Práctica
                  </Typography>

                  <TableContainer
                    sx={{
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      mb: 3,
                    }}
                  >
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ backgroundColor: '#f9fafb' }}>
                          <TableCell
                            sx={{
                              color: '#374151',
                              fontWeight: '600',
                              fontSize: '0.85rem',
                              borderBottom: '2px solid #e5e7eb',
                              py: 1.5,
                            }}
                          >
                            Práctica de Liderazgo
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{
                              color: '#374151',
                              fontWeight: '600',
                              fontSize: '0.85rem',
                              borderBottom: '2px solid #e5e7eb',
                              minWidth: '120px',
                            }}
                          >
                            Promedio Líderes
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{
                              color: '#374151',
                              fontWeight: '600',
                              fontSize: '0.85rem',
                              borderBottom: '2px solid #e5e7eb',
                              minWidth: '120px',
                            }}
                          >
                            Promedio Colaboradores
                          </TableCell>
                          {hasSupervisorData && (
                            <TableCell
                              align="center"
                              sx={{
                                color: '#374151',
                                fontWeight: '600',
                                fontSize: '0.85rem',
                                borderBottom: '2px solid #e5e7eb',
                                minWidth: '120px',
                                backgroundColor: 'rgba(255, 107, 53, 0.1)',
                              }}
                            >
                              Promedio Director
                            </TableCell>
                          )}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {aggregatedCategories.map((cat, index) => {
                          return (
                            <TableRow
                              key={index}
                              sx={{
                                '&:nth-of-type(odd)': {
                                  backgroundColor: '#f8fafc',
                                },
                                '&:hover': {
                                  backgroundColor: '#e2e8f0',
                                },
                              }}
                            >
                              <TableCell
                                sx={{
                                  fontWeight: '600',
                                  fontSize: '0.85rem',
                                  color: '#1e3a8a',
                                  borderRight: '1px solid #e2e8f0',
                                  padding: '12px 8px',
                                }}
                              >
                                {cat.category}
                              </TableCell>
                              <TableCell
                                align="center"
                                sx={{
                                  color: palette.primary.main,
                                  fontWeight: '700',
                                  fontSize: '1rem',
                                  borderRight: '1px solid #e2e8f0',
                                  backgroundColor: 'rgba(25, 118, 210, 0.05)',
                                  padding: '12px 8px',
                                }}
                              >
                                {cat.auto_total.toFixed(1)}
                              </TableCell>
                              <TableCell
                                align="center"
                                sx={{
                                  color: palette.secondary.main,
                                  fontWeight: '700',
                                  fontSize: '1rem',
                                  borderRight: '1px solid #e2e8f0',
                                  backgroundColor: 'rgba(211, 47, 47, 0.05)',
                                  padding: '12px 8px',
                                }}
                              >
                                {cat.otros_total.toFixed(1)}
                              </TableCell>
                              {hasSupervisorData && (
                                <TableCell
                                  align="center"
                                  sx={{
                                    color: '#ff6b35',
                                    fontWeight: '700',
                                    fontSize: '1rem',
                                    borderRight: '1px solid #e2e8f0',
                                    backgroundColor: 'rgba(255, 107, 53, 0.1)',
                                    padding: '12px 8px',
                                  }}
                                >
                                  {cat.supervisor_total.toFixed(1)}
                                </TableCell>
                              )}
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>

                {/* Interpretación de la tabla */}
                <Box
                  sx={{
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    padding: '20px',
                    borderLeft: '4px solid #3b82f6',
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#374151',
                      mb: 2,
                    }}
                  >
                    Interpretación del Cuadro Comparativo
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: '0.9rem',
                      lineHeight: 1.6,
                      color: '#6b7280',
                      mb: 2,
                    }}
                  >
                    {hasSupervisorData
                      ? 'La tabla muestra la comparación promedio entre la autopercepción de los líderes, la percepción de los colaboradores y la evaluación del Director en cada una de las cinco prácticas de liderazgo, agregando datos de todos los equipos del proyecto '
                      : 'La tabla muestra la comparación promedio entre la autopercepción de los líderes y la percepción de los colaboradores en cada una de las cinco prácticas de liderazgo, agregando datos de todos los equipos del proyecto '}
                    <strong>{projectName}</strong>
                    {hasSupervisorData &&
                      '. Los promedios permiten identificar brechas perceptivas entre líderes, colaboradores y la visión del Director.'}
                  </Typography>
                </Box>
              </Paper>

              {/* PÁGINA 2: Gráfico de Líneas */}
              <Paper data-testid="page" sx={pageStyle} className="pagina-comun">
                {/* Encabezado */}
                <Box
                  sx={{
                    backgroundColor: '#f8fafc',
                    borderLeft: '6px solid #2563eb',
                    padding: '15px 25px',
                    marginBottom: '20px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  }}
                >
                  <Typography
                    variant="h4"
                    sx={{
                      margin: 0,
                      fontSize: '24px',
                      fontWeight: '600',
                      color: '#1e293b',
                      textAlign: 'center',
                      mb: 2,
                    }}
                  >
                    Análisis Gráfico Comparativo
                  </Typography>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      textAlign: 'center',
                      color: '#64748b',
                      fontSize: '14px',
                    }}
                  >
                    {hasSupervisorData
                      ? 'Visualización de la comparación entre líderes, colaboradores y Director'
                      : 'Visualización de la comparación entre líderes y colaboradores'}
                  </Typography>
                </Box>

                {/* Gráfico de líneas comparativo */}
                {aggregatedCategories.length > 0 && (
                  <Box
                    sx={{
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      padding: '20px',
                      mb: 3,
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: '600',
                        fontSize: '16px',
                        color: '#374151',
                        mb: 2,
                        textAlign: 'center',
                      }}
                    >
                      Gráfico Comparativo por Práctica de Liderazgo
                    </Typography>

                    <Box sx={{ height: 450 }} ref={lineChartRef}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={aggregatedCategories.map((cat, index) => ({
                            practica: cat.category.length > 20 ? cat.category.substring(0, 17) + '...' : cat.category,
                            Líderes: Number(cat.auto_total.toFixed(1)),
                            Colaboradores: Number(cat.otros_total.toFixed(1)),
                            ...(hasSupervisorData && { Director: Number(cat.supervisor_total.toFixed(1)) }),
                            index: index + 1,
                          }))}
                          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                          <XAxis
                            dataKey="practica"
                            tick={{ fontSize: 10, fill: '#475569' }}
                            angle={-30}
                            textAnchor="end"
                            height={100}
                            interval={0}
                          />
                          <YAxis
                            domain={[1, 5]}
                            tick={{ fontSize: 10, fill: '#475569' }}
                            label={{
                              value: 'Puntuación Promedio',
                              angle: -90,
                              position: 'insideLeft',
                              style: { textAnchor: 'middle', fill: '#1e3a8a', fontWeight: '600' },
                            }}
                          />
                          <Tooltip
                            formatter={(value, name) => [value, name]}
                            labelFormatter={label => label}
                            contentStyle={{
                              backgroundColor: '#fff',
                              border: '2px solid #1e3a8a',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: '600',
                            }}
                          />
                          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '20px', fontWeight: '600' }} />
                          <Line
                            type="monotone"
                            dataKey="Líderes"
                            stroke={palette.primary.main}
                            strokeWidth={4}
                            dot={{ fill: palette.primary.main, strokeWidth: 3, r: 5 }}
                            activeDot={{ r: 8 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="Colaboradores"
                            stroke={palette.secondary.main}
                            strokeWidth={4}
                            dot={{ fill: palette.secondary.main, strokeWidth: 3, r: 5 }}
                            activeDot={{ r: 8 }}
                          />
                          {hasSupervisorData && (
                            <Line
                              type="monotone"
                              dataKey="Director"
                              stroke="#ff6b35"
                              strokeWidth={4}
                              dot={{ fill: '#ff6b35', strokeWidth: 3, r: 5 }}
                              activeDot={{ r: 8 }}
                            />
                          )}
                        </LineChart>
                      </ResponsiveContainer>
                    </Box>
                  </Box>
                )}

                {/* Interpretación del gráfico */}
                <Box
                  sx={{
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    padding: '20px',
                    borderLeft: '4px solid #3b82f6',
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#374151',
                      mb: 2,
                    }}
                  >
                    Interpretación del Análisis Gráfico
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: '0.9rem',
                      lineHeight: 1.6,
                      color: '#6b7280',
                      mb: 2,
                    }}
                  >
                    El gráfico de líneas permite visualizar de manera clara las tendencias y diferencias entre la autopercepción de los
                    líderes (línea azul) y la percepción de los colaboradores (línea morada) en cada una de las cinco prácticas de
                    liderazgo.
                  </Typography>
                </Box>
              </Paper>
            </>
          ) : null}

          {/* ============================================================ */}
          {/* DETALLE POR EQUIPO - CATEGORÍAS */}
          {/* ============================================================ */}
          {teamsCategoryData.length > 0 && (
            <Paper data-testid="page" sx={pageStyle} className="pagina-comun">
              <Box
                sx={{
                  backgroundColor: '#f8fafc',
                  borderLeft: '6px solid #2563eb',
                  padding: '15px 25px',
                  marginBottom: '20px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                }}
              >
                <Typography
                  variant="h4"
                  sx={{
                    margin: 0,
                    fontSize: '24px',
                    fontWeight: '600',
                    color: '#1e293b',
                    textAlign: 'center',
                  }}
                >
                  Comparación Detallada por Equipo
                </Typography>
              </Box>

              {/* Tabla con comparación por equipo y categoría */}
              <TableContainer
                sx={{
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  mb: 3,
                }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f9fafb' }}>
                      <TableCell
                        sx={{
                          color: '#374151',
                          fontWeight: '600',
                          fontSize: '0.85rem',
                          borderBottom: '2px solid #e5e7eb',
                          py: 1.5,
                        }}
                      >
                        Equipo
                      </TableCell>
                      {aggregatedCategories.map((cat, idx) => (
                        <TableCell
                          key={idx}
                          align="center"
                          sx={{
                            color: '#374151',
                            fontWeight: '600',
                            fontSize: '0.75rem',
                            borderBottom: '2px solid #e5e7eb',
                            minWidth: '80px',
                          }}
                        >
                          {cat.category.split(' ')[0]}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {teamsCategoryData.map((teamData, teamIdx) => (
                      <TableRow
                        key={teamIdx}
                        sx={{
                          '&:nth-of-type(odd)': {
                            backgroundColor: '#f8fafc',
                          },
                          '&:hover': {
                            backgroundColor: '#e2e8f0',
                          },
                        }}
                      >
                        <TableCell
                          sx={{
                            fontWeight: '600',
                            fontSize: '0.85rem',
                            color: '#1e3a8a',
                            borderRight: '1px solid #e2e8f0',
                            padding: '12px 8px',
                          }}
                        >
                          {teamData.teamName}
                        </TableCell>
                        {aggregatedCategories.map((aggrCat, catIdx) => {
                          const teamCat = teamData.categories.find(c => c.category === aggrCat.category);
                          const difference = teamCat ? teamCat.otros_total - teamCat.auto_total : 0;
                          const hasSupervisorInCategory = teamCat && teamCat.supervisor_total > 0;
                          return (
                            <TableCell
                              key={catIdx}
                              align="center"
                              sx={{
                                fontSize: '0.8rem',
                                fontWeight: '600',
                                padding: '12px 4px',
                                color: difference > 0.5 ? '#2e7d32' : difference < -0.5 ? '#d32f2f' : '#64748b',
                              }}
                            >
                              {teamCat ? (
                                <Box>
                                  <Box sx={{ color: palette.primary.main }}>{teamCat.auto_total.toFixed(1)}</Box>
                                  <Box sx={{ color: palette.secondary.main, fontSize: '0.75rem' }}>{teamCat.otros_total.toFixed(1)}</Box>
                                  {hasSupervisorData && hasSupervisorInCategory && (
                                    <Box sx={{ color: '#ff6b35', fontSize: '0.75rem' }}>{teamCat.supervisor_total.toFixed(1)}</Box>
                                  )}
                                </Box>
                              ) : (
                                '-'
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Leyenda */}
              <Box
                sx={{
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  padding: '15px',
                  display: 'flex',
                  gap: 3,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor: palette.primary.main,
                    }}
                  />
                  <Typography variant="body2" sx={{ fontSize: '0.85rem', color: '#374151' }}>
                    Líderes
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor: palette.secondary.main,
                    }}
                  />
                  <Typography variant="body2" sx={{ fontSize: '0.85rem', color: '#374151' }}>
                    Colaboradores
                  </Typography>
                </Box>
                {hasSupervisorData && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        backgroundColor: '#ff6b35',
                      }}
                    />
                    <Typography variant="body2" sx={{ fontSize: '0.85rem', color: '#374151' }}>
                      Director
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
