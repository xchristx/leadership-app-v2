// ============================================================================
// COMPONENTE CHARTS TRENDS TAB
// ============================================================================
// Pestaña de gráficos y tendencias con visualizaciones
// ============================================================================

import { Grid, Card, CardContent, Typography } from '@mui/material';
import { CustomPieChart } from '../../Charts/PieChart';
import { CustomLineChart } from '../../Charts/LineChart';
import { CustomBarChart } from '../../Charts/BarChart';
import type { ChartData } from './types';

interface ChartsTrendsTabProps {
  comparativeData: Array<{
    question_id: string;
    question_text: string;
    leader_avg: number;
    collaborators_avg: number;
    supervisors_avg: number;
    leader_count: number;
    collaborators_count: number;
    supervisors_count: number;
    order_index: number;
  }>;
  categoryData: Array<{
    category: string;
    leader_total: number;
    collaborator_total: number;
    questions: Array<{
      question_id: string;
      question_text: string;
      question_number: number;
      leader_avg: number;
      collaborator_avg: number;
      leader_responses: number[];
      collaborator_responses: number[];
      average_collaborator: number;
    }>;
  }>;
  loading: boolean;
}

export function ChartsTrendsTab({ comparativeData }: ChartsTrendsTabProps) {
  // Convertir datos a formato ChartData
  const chartData: ChartData = {
    alignment: [
      {
        name: 'Muy Alineados',
        value: comparativeData.filter(d => Math.abs(d.leader_avg - d.collaborators_avg) < 0.8).length,
        color: '#4caf50',
      },
      {
        name: 'Moderadamente Alineados',
        value: comparativeData.filter(d => {
          const diff = Math.abs(d.leader_avg - d.collaborators_avg);
          return diff >= 0.8 && diff < 1.5;
        }).length,
        color: '#ff9800',
      },
      {
        name: 'Desalineados',
        value: comparativeData.filter(d => Math.abs(d.leader_avg - d.collaborators_avg) >= 1.5).length,
        color: '#f44336',
      },
    ],
    trends: comparativeData.slice(0, 10).map(d => ({
      question: d.question_text.substring(0, 20) + '...',
      leader: d.leader_avg,
      collaborator: d.collaborators_avg,
      supervisor: d.supervisors_avg,
      difference: Math.abs(d.leader_avg - d.collaborators_avg),
      sup_difference: Math.abs(d.leader_avg - d.supervisors_avg),
    })),
  };
  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📊 Distribución de Alineación
            </Typography>
            {chartData.alignment.length > 0 && <CustomPieChart data={chartData.alignment} height={300} />}
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📈 Comparación por Pregunta
            </Typography>
            {chartData.trends.length > 0 && (
              <CustomBarChart
                data={chartData.trends}
                height={300}
                xKey="question"
                yKeys={['leader', 'collaborator', 'supervisor']}
                colors={['#1976d2', '#9c27b0', '#ff6b35']}
              />
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12 }}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📉 Tendencia de Diferencias
            </Typography>
            {chartData.trends.length > 0 && (
              <CustomLineChart data={chartData.trends} height={300} dataKey="difference" nameKey="question" color="#ff9800" />
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
