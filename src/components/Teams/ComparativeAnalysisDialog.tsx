// ============================================================================
// COMPONENTE COMPARATIVE ANALYSIS DIALOG - MODULAR
// ============================================================================
// Dialog modular para análisis comparativo refactorizado en componentes
// ============================================================================

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Tabs,
  Tab,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Close as CloseIcon,
  Assessment as AssessmentIcon,
  Analytics as AnalyticsIcon,
  BarChart as BarChartIcon,
  // TrendingUp as TrendingUpIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';
import { useState } from 'react';

// Importar componentes modulares
import { ExecutiveSummaryTab } from './ComparativeAnalysis/ExecutiveSummaryTab';
import { CategoryAnalysisTab } from './ComparativeAnalysis/CategoryAnalysisTab';
import { DetailedAnalysisTab } from './ComparativeAnalysis/DetailedAnalysisTab';
// import { ChartsTrendsTab } from './ComparativeAnalysis/ChartsTrendsTab';
import { CategoryReportTab } from './ComparativeAnalysis';
import { TabPanel } from './ComparativeAnalysis/TabPanel';
import { useComparativeAnalysis } from './ComparativeAnalysis/useComparativeAnalysis';
import { exportToExcelSimple } from './ComparativeAnalysis/exportToExcel';
import type { ComparativeAnalysisDialogProps } from './ComparativeAnalysis/types';

export function ComparativeAnalysisDialog({ open, onClose, teamId, teamName }: ComparativeAnalysisDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [tabValue, setTabValue] = useState(0);

  // Usar el hook personalizado para cargar datos
  const { comparativeData, categoryData, categorySummary, metrics, loading } = useComparativeAnalysis(teamId, open);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleExportToExcel = async () => {
    // Usar la nueva exportación mejorada con XLSX
    try {
      const success = await exportToExcelSimple(comparativeData, categoryData, categorySummary);
      if (!success) {
        console.error('Error al exportar Excel mejorado, intentando método estándar...');
        // Fallback a exportación estándar
        const standardSuccess = await exportToExcelSimple(comparativeData, categoryData, categorySummary);
        if (!standardSuccess) {
          console.error('Error al exportar a Excel');
        }
      }
    } catch (error) {
      // Fallback a exportación estándar
      console.log('Error con Excel mejorado, usando exportación estándar:', error);
      const success = await exportToExcelSimple(comparativeData, categoryData, categorySummary);
      if (!success) {
        console.error('Error al exportar a Excel');
      }
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth fullScreen>
      <DialogTitle
        sx={{
          m: 0,
          p: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        Análisis Comparativo - {teamName}
        <IconButton
          aria-label="cerrar"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: theme => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          px: { xs: 1, md: 3 },
          height: 'calc(100vh - 120px)',
          overflow: 'auto',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#f1f1f1',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#888',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: '#555',
          },
          py: 0,
        }}
      >
        <Box sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', position: 'sticky', top: 0, backgroundColor: 'background.paper', zIndex: 1 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant={isMobile ? 'scrollable' : 'fullWidth'}
              scrollButtons="auto"
              allowScrollButtonsMobile
            >
              <Tab icon={<AssessmentIcon />} label="Resumen Ejecutivo" iconPosition="start" />
              <Tab icon={<AnalyticsIcon />} label="Análisis por Categorías" iconPosition="start" />
              <Tab icon={<BarChartIcon />} label="Análisis Detallado" iconPosition="start" />
              {/* <Tab icon={<TrendingUpIcon />} label="Gráficos y Tendencias" iconPosition="start" /> */}
              <Tab icon={<DescriptionIcon />} label="Reporte por Categorías" iconPosition="start" />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <ExecutiveSummaryTab metrics={metrics} categorySummary={categorySummary} loading={loading} />
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <CategoryAnalysisTab
              handleExportToExcel={handleExportToExcel}
              categoryData={categoryData}
              categorySummary={categorySummary}
              loading={loading}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <DetailedAnalysisTab comparativeData={comparativeData} loading={loading} />
          </TabPanel>

          {/* <TabPanel value={tabValue} index={3}>
            <ChartsTrendsTab comparativeData={comparativeData} categoryData={categoryData} loading={loading} />
          </TabPanel> */}

          <TabPanel value={tabValue} index={3}>
            <CategoryReportTab
              comparativeData={comparativeData}
              categoryData={categoryData}
              categorySummary={categorySummary}
              loading={loading}
              teamName={teamName}
            />
          </TabPanel>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}
