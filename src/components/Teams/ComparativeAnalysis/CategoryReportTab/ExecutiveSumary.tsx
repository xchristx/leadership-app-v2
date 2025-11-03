import {
  Box,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useTheme,
  type SxProps,
} from '@mui/material';
import type { CategorySummary, ComparativeData } from '../types';
import PracticeMedia from './PracticeMedia';

interface ExecutiveSumaryProps {
  pageStyle: SxProps;
  teamName: string;
  comparativeData: ComparativeData[];
  leadershipPractices: CategorySummary[];
  leaderName?: string;
  hasSupervisorData?: boolean;
}

const ExecutiveSumary = ({
  pageStyle,
  teamName,
  comparativeData,
  leadershipPractices,
  leaderName,
  hasSupervisorData,
}: ExecutiveSumaryProps) => {
  const { palette } = useTheme();

  // estilos de resaltado para partes importantes del texto (no cambian el texto)
  const highlightAuto: SxProps = { fontWeight: 700, color: palette.primary.main };
  const highlightOtros: SxProps = { fontWeight: 700, color: palette.secondary.main };
  const highlightSupervisor: SxProps = { fontWeight: 700, color: palette.supervisor?.main || palette.primary.main };
  const highlightOpportunity: SxProps = {
    fontWeight: 700,
    backgroundColor: 'rgba(59,130,246,0.06)',
    padding: '2px 4px',
    borderRadius: '4px',
  };

  // Subcomponent to render a CardMedia for a practice image (PNG -> JPG fallback),
  // and a colored dot fallback if image is not available.

  return (
    <Paper sx={pageStyle} className="pagina-comun" data-testid="page">
      {/* Encabezado simplificado */}
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
            mb: 3,
          }}
        >
          Resumen Ejecutivo
        </Typography>
        <Grid container spacing={3}>
          <Grid size={{ xs: 6 }}>
            <Typography variant="body2" sx={{ fontSize: '0.9rem', mb: 1, color: '#252525' }}>
              <strong style={{ color: '#1e3a8a' }}>Equipo:</strong> {teamName}
            </Typography>

            <Typography variant="body2" sx={{ fontSize: '0.9rem', color: '#252525' }}>
              <strong style={{ color: '#1e3a8a' }}>Período:</strong>{' '}
              {new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </Typography>
          </Grid>
          <Grid size={{ xs: 6 }}>
            {leaderName && (
              <Typography variant="body2" sx={{ fontSize: '0.9rem', mb: 1 }}>
                <strong style={{ color: '#1e3a8a' }}>Líder:</strong> {leaderName}
              </Typography>
            )}
            <Typography variant="body2" sx={{ fontSize: '0.9rem', color: '#252525' }}>
              <strong style={{ color: '#1e3a8a' }}>Total preguntas:</strong> {comparativeData.length}
            </Typography>
          </Grid>
        </Grid>
        {/* <Typography
            variant="body1"
            sx={{
              color: '#64748b',
              textAlign: 'center',
              mt: 1,
              fontSize: '14px',
            }}
          >
            Análisis comparativo de prácticas de liderazgo
          </Typography> */}
      </Box>

      {/* Información del equipo en tarjeta corporativa */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
          borderRadius: '12px',
          border: '1px solid #cbd5e1',
          padding: '20px',
          mb: 4,
          position: 'relative',
          overflow: 'hidden',
          display: 'none',
        }}
      >
        {/* <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #1e3a8a 0%, #0369a1 100%)',
          }}
        /> */}

        {/* <Grid container spacing={3}>
          <Grid size={{ xs: 6 }}>
            <Typography variant="body2" sx={{ fontSize: '0.9rem', mb: 1, color: '#252525' }}>
              <strong style={{ color: '#1e3a8a' }}>Equipo:</strong> {teamName}
            </Typography>

            <Typography variant="body2" sx={{ fontSize: '0.9rem', color: '#252525' }}>
              <strong style={{ color: '#1e3a8a' }}>Período:</strong>{' '}
              {new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </Typography>
          </Grid>
          <Grid size={{ xs: 6 }}>
            {leaderName && (
              <Typography variant="body2" sx={{ fontSize: '0.9rem', mb: 1 }}>
                <strong style={{ color: '#1e3a8a' }}>Líder:</strong> {leaderName}
              </Typography>
            )}
            <Typography variant="body2" sx={{ fontSize: '0.9rem', color: '#252525' }}>
              <strong style={{ color: '#1e3a8a' }}>Total preguntas:</strong> {comparativeData.length}
            </Typography>
          </Grid>
        </Grid> */}
      </Box>

      {/* Tabla comparativa principal simplificada */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: '600',
            fontSize: '18px',
            color: '#374151',
            mb: 2,
            textAlign: 'center',
          }}
        >
          Cuadro Comparativo - Autopercepción vs {hasSupervisorData ? 'Percepción externa' : 'Percepción de Colaboradores'}
        </Typography>

        <TableContainer
          sx={{
            border: '1px solid #d1d5db',
            borderRadius: '8px',
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
                    py: 1.5,
                    minWidth: '100px',
                  }}
                >
                  Autopercepción
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    color: '#374151',
                    fontWeight: '600',
                    fontSize: '0.85rem',
                    borderBottom: '2px solid #e5e7eb',
                    py: 1.5,
                    minWidth: '100px',
                  }}
                >
                  Observadores
                </TableCell>
                {hasSupervisorData && (
                  <TableCell
                    align="center"
                    sx={{
                      color: '#374151',
                      fontWeight: '600',
                      fontSize: '0.85rem',
                      borderBottom: '2px solid #e5e7eb',
                      py: 1.5,
                      minWidth: '100px',
                    }}
                  >
                    Director
                  </TableCell>
                )}

                {hasSupervisorData && (
                  <TableCell
                    align="center"
                    sx={{
                      color: '#374151',
                      fontWeight: '600',
                      fontSize: '0.85rem',
                      borderBottom: '2px solid #e5e7eb',
                      py: 1.5,
                      minWidth: '90px',
                    }}
                  >
                    Promedio (Director, Observadores)
                  </TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {leadershipPractices.length > 0 ? (
                leadershipPractices.map((practice, index) => {
                  const difference = practice.otros_total - practice.auto_total;
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
                          maxWidth: '200px',
                          color: '#1e3a8a',
                          borderRight: '1px solid #e2e8f0',
                          padding: '12px 8px',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PracticeMedia category={practice.category} index={index} />
                          <Box component="span">{practice.category}</Box>
                        </Box>
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          color: palette.primary.main,
                          fontWeight: '700',
                          fontSize: '1rem',
                          borderRight: '1px solid #e2e8f0',
                          backgroundColor: index % 2 === 0 ? 'rgba(25, 118, 210, 0.05)' : 'inherit',
                          padding: '12px 8px',
                        }}
                      >
                        {practice.auto_total}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          color: palette.secondary.main,
                          fontWeight: '700',
                          fontSize: '1rem',
                          borderRight: '1px solid #e2e8f0',
                          backgroundColor: index % 2 === 0 ? 'rgba(211, 47, 47, 0.05)' : 'inherit',
                          padding: '12px 8px',
                        }}
                      >
                        {practice.otros_total}
                      </TableCell>
                      {hasSupervisorData && (
                        <TableCell
                          align="center"
                          sx={{
                            fontWeight: '700',
                            fontSize: '1rem',
                            color: palette.supervisor.main,
                            backgroundColor:
                              difference > 0
                                ? 'rgba(46, 125, 50, 0.1)'
                                : difference < 0
                                ? 'rgba(211, 47, 47, 0.1)'
                                : 'rgba(30, 58, 138, 0.05)',
                            padding: '12px 8px',
                            borderRadius: difference !== 0 ? '4px' : 'inherit',
                          }}
                        >
                          {practice.supervisor_total}
                        </TableCell>
                      )}
                      {hasSupervisorData && (
                        <TableCell
                          align="center"
                          sx={{
                            fontWeight: '700',
                            fontSize: '1rem',
                            color: '#1e3a8a',
                            backgroundColor:
                              difference > 0
                                ? 'rgba(46, 125, 50, 0.1)'
                                : difference < 0
                                ? 'rgba(211, 47, 47, 0.1)'
                                : 'rgba(30, 58, 138, 0.05)',
                            padding: '12px 8px',
                            borderRadius: difference !== 0 ? '4px' : 'inherit',
                          }}
                        >
                          {((practice.supervisor_total + practice.otros_total) / 2).toFixed(1)}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    align="center"
                    sx={{
                      fontSize: '0.9rem',
                      color: '#64748b',
                      fontStyle: 'italic',
                      padding: '20px',
                    }}
                  >
                    No se encontraron prácticas de liderazgo definidas
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Interpretación inicial simplificada */}
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
            display: 'none',
          }}
        >
          Interpretación
        </Typography>

        <Typography
          variant="body2"
          sx={{
            fontSize: '0.9rem',
            lineHeight: 1.6,
            color: '#6b7280',
          }}
        >
          Las diferencias entre{' '}
          <Box component="span" sx={highlightAuto}>
            la autopercepción del <strong>líder</strong>
          </Box>{' '}
          {hasSupervisorData ? (
            <>
              <Box component="span">, </Box>
              <Box component="span" sx={highlightOtros}>
                la percepción de sus colaboradores
              </Box>{' '}
              <Box component="span" sx={highlightSupervisor}>
                y el Director
              </Box>
            </>
          ) : (
            <Box component="span" sx={highlightOtros}>
              y la percepción de sus colaboradores
            </Box>
          )}{' '}
          constituyen{' '}
          <Box component="span" sx={highlightOpportunity}>
            una oportunidad para el desarrollo del liderazgo
          </Box>
          . Analizar estas brechas permite identificar fortalezas, reconocer áreas de mejora y ajustar las prácticas de liderazgo para
          lograr una mayor coherencia entre la intención y el impacto. Este proceso favorece el crecimiento personal, mejora la comunicación
          con el equipo y contribuye a un liderazgo más efectivo y consciente.
        </Typography>
      </Box>
    </Paper>
  );
};

export default ExecutiveSumary;
