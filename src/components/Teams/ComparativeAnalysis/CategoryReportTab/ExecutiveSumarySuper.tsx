import {
  Box,
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

interface ExecutiveSumarySuperProps {
  pageStyle: SxProps;
  teamName: string;
  comparativeData: ComparativeData[];
  leadershipPractices: CategorySummary[];
}

const ExecutiveSumarySuper = ({ pageStyle, leadershipPractices }: ExecutiveSumarySuperProps) => {
  const { palette } = useTheme();
  return (
    <Paper sx={pageStyle} className="pagina-comun" data-testid="page">
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
          Cuadro Comparativo - Autopercepción vs Percepción del DIRECTOR de equipo
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
                  DIRECTOR
                </TableCell>
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
                  Diferencia
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {leadershipPractices.length > 0 ? (
                leadershipPractices.map((practice, index) => {
                  const difference = practice.supervisor_total - practice.auto_total;
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
                        {practice.auto_total.toFixed(1)}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          color: palette.supervisor.main,
                          fontWeight: '700',
                          fontSize: '1rem',
                          borderRight: '1px solid #e2e8f0',
                          backgroundColor: index % 2 === 0 ? 'rgba(211, 47, 47, 0.05)' : 'inherit',
                          padding: '12px 8px',
                        }}
                      >
                        {practice.supervisor_total.toFixed(1)}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          fontWeight: '700',
                          fontSize: '1rem',
                          color: difference > 0 ? palette.success.main : difference < 0 ? palette.error.main : '#1e3a8a',
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
                        {difference > 0 ? '+' : ''}
                        {difference.toFixed(1)}
                      </TableCell>
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
          Este cuadro presenta la comparación entre la <strong>autopercepción del líder</strong> y la{' '}
          <strong>percepción de su superior</strong> en las cinco prácticas fundamentales del liderazgo. Las{' '}
          <span style={{ color: palette.success.main, fontWeight: '600' }}>diferencias negativas</span> indican que el líder se percibe con
          mayor competencia, mientras que las <span style={{ color: palette.error.main, fontWeight: '600' }}>diferencias positivas</span>{' '}
          sugieren que su superior ve áreas con oportunidades de mejora. Esta información es crucial para identificar brechas en la
          percepción y enfocar los esfuerzos de desarrollo del liderazgo.
        </Typography>
      </Box>
    </Paper>
  );
};

export default ExecutiveSumarySuper;
