import { Box, Paper, Typography, useTheme, type SxProps } from '@mui/material';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface GeneralGraphicAnalysisProps {
  pageStyle: SxProps;
  leadershipPractices: {
    category: string;
    auto_total: number;
    otros_total: number;
    supervisor_total?: number;
  }[];
  hasSupervisorData: boolean;
  lineChartRef: React.RefObject<HTMLDivElement | null>;
}

const GeneralGraphicAnalysis = ({ pageStyle, leadershipPractices, hasSupervisorData, lineChartRef }: GeneralGraphicAnalysisProps) => {
  const { palette } = useTheme();

  return (
    <Paper sx={pageStyle} data-testid="page" className="pagina-comun">
      {/* Encabezado simplificado */}
      <Box
        sx={{
          backgroundColor: '#f8fafc',
          borderLeft: '6px solid #2563eb',
          padding: '20px 25px',
          marginBottom: '25px',
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
          Análisis Gráfico Comparativo
        </Typography>
      </Box>

      {leadershipPractices.length > 0 && (
        <Box
          sx={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            padding: '20px',
            mb: 3,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <Box sx={{ height: '380px' }} ref={lineChartRef}>
            <ResponsiveContainer width="100%" height={380}>
              <LineChart
                data={leadershipPractices.map((practice, index) => ({
                  practica: practice.category.length > 20 ? practice.category.substring(0, 17) + '...' : practice.category,
                  AUTO: Number(practice.auto_total.toFixed(1)),
                  OBSERVADORES: Number(practice.otros_total.toFixed(1)),
                  SUPERVISORES: Number(((practice as { supervisor_total?: number }).supervisor_total ?? 0).toFixed(1)),
                  index: index + 1,
                }))}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                <XAxis
                  dataKey="practica"
                  tick={{ fontSize: 9, textAnchor: 'end', fill: '#475569' }}
                  angle={-30}
                  textAnchor="end"
                  height={80}
                  interval={0}
                />
                <YAxis
                  domain={[15, 30]}
                  tick={{ fontSize: 10, fill: '#475569' }}
                  tickCount={6}
                  label={{
                    value: 'Puntuación',
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
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Legend
                  wrapperStyle={{
                    fontSize: '12px',
                    paddingTop: '20px',
                    fontWeight: '600',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="AUTO"
                  stroke={palette.primary.main}
                  strokeWidth={4}
                  dot={{ fill: palette.primary.main, strokeWidth: 3, r: 3 }}
                  activeDot={{ r: 8, fill: palette.primary.main, strokeWidth: 3, stroke: '#fff' }}
                  label={{ position: 'top', fontSize: 10, fill: palette.primary.main, fontWeight: '600' }}
                />
                <Line
                  type="monotone"
                  dataKey="OBSERVADORES"
                  stroke={palette.secondary.main}
                  strokeWidth={4}
                  dot={{ fill: palette.secondary.main, strokeWidth: 3, r: 3 }}
                  activeDot={{ r: 8, fill: palette.secondary.main, strokeWidth: 3, stroke: '#fff' }}
                  label={{ position: 'bottom', fontSize: 10, fill: palette.secondary.main, fontWeight: '600' }}
                />
                {hasSupervisorData && (
                  <Line
                    type="monotone"
                    dataKey="SUPERVISORES"
                    stroke={palette.supervisor.main}
                    strokeWidth={4}
                    dot={{ fill: palette.supervisor.main, strokeWidth: 3, r: 3 }}
                    activeDot={{ r: 8, fill: palette.supervisor.main, strokeWidth: 3, stroke: '#fff' }}
                    label={{ position: 'top', fontSize: 10, fill: palette.supervisor.main, fontWeight: '600' }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Box>
      )}

      {/* Interpretación del análisis simplificada */}
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
          Interpretación del Análisis
        </Typography>

        <Typography
          variant="body2"
          sx={{
            fontSize: '0.9rem',
            lineHeight: 1.6,
            mb: 2,
            color: '#6b7280',
          }}
        >
          <strong>El gráfico de líneas</strong> facilita la visualización de las diferencias entre autopercepción y percepción externa en
          cada práctica.{' '}
          {hasSupervisorData ? (
            <>
              <span style={{ color: palette.primary.main, fontWeight: '600' }}> Las líneas azules (autopercepción),</span>
              <span style={{ color: palette.secondary.main, fontWeight: '600' }}> moradas (observadores)</span>
              <span style={{ color: palette.supervisor.main, fontWeight: '600' }}> y naranjas (líder de líder)</span> permiten identificar
              rápidamente:
            </>
          ) : (
            <>
              <span style={{ color: palette.primary.main, fontWeight: '600' }}> Las líneas azules (autopercepción)</span> y
              <span style={{ color: palette.secondary.main, fontWeight: '600' }}> moradas (observadores)</span> permiten identificar
              rápidamente:
            </>
          )}
        </Typography>

        <Box
          component="ul"
          sx={{
            margin: 0,
            paddingLeft: '20px',
            '& li': {
              fontSize: '0.85rem',
              lineHeight: 1.5,
              marginBottom: '8px',
              color: '#6b7280',
              fontWeight: '500',
            },
          }}
        >
          <li>
            <strong>Convergencias:</strong> Donde ambas líneas se aproximan, indicando alineación perceptual
          </li>
          <li>
            <strong>Divergencias:</strong> Separaciones significativas que requieren atención y desarrollo
          </li>
        </Box>
      </Box>
    </Paper>
  );
};

export default GeneralGraphicAnalysis;
