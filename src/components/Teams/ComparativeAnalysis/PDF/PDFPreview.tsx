import React from 'react';
import { Box, Container, Typography, AppBar, Toolbar, IconButton } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { PDFPreviewPage } from './PDFPreviewPage';
import { mockData } from './mockData';

export const PDFPreview: React.FC = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Header de la vista previa */}
      <AppBar position="sticky" color="primary">
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={handleBack} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Vista Previa PDF - Editor de Estilos
          </Typography>
          <Typography variant="body2" sx={{ ml: 2 }}>
            Edita los estilos en PDFPreviewPage.tsx
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Contenido principal */}
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom align="center" sx={{ mb: 4, color: '#1976d2' }}>
          📄 Vista Previa del Reporte PDF
        </Typography>

        <Typography variant="body1" align="center" sx={{ mb: 4, color: '#666' }}>
          Esta vista previa te permite editar los estilos del PDF sin generar el documento completo.
          <br />
          Los cambios se reflejarán inmediatamente al guardar el archivo.
        </Typography>

        {/* Páginas del PDF */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
          {/* Carátula */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" align="center" sx={{ mb: 2, color: '#1976d2' }}>
              Página 1: Carátula
            </Typography>
            <PDFPreviewPage pageType="cover" data={mockData} />
          </Box>

          {/* Resumen Ejecutivo */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" align="center" sx={{ mb: 2, color: '#1976d2' }}>
              Página 2: Resumen Ejecutivo
            </Typography>
            <PDFPreviewPage pageType="summary" data={mockData} />
          </Box>

          {/* Análisis Gráfico */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" align="center" sx={{ mb: 2, color: '#1976d2' }}>
              Página 3: Análisis Gráfico
            </Typography>
            <PDFPreviewPage pageType="chart" data={mockData} />
          </Box>

          {/* Páginas de detalle por categoría */}
          {mockData.categoryData.map((category, index) => (
            <React.Fragment key={index}>
              {/* Página A: Gráfico por categoría */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" align="center" sx={{ mb: 2, color: '#1976d2' }}>
                  Página {4 + index * 2}: {category.category.name} - Análisis
                </Typography>
                <PDFPreviewPage pageType="categoryChart" data={mockData} categoryIndex={index} />
              </Box>

              {/* Página B: Tabla detallada */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" align="center" sx={{ mb: 2, color: '#1976d2' }}>
                  Página {5 + index * 2}: {category.category.name} - Detalle
                </Typography>
                <PDFPreviewPage pageType="categoryTable" data={mockData} categoryIndex={index} />
              </Box>
            </React.Fragment>
          ))}
        </Box>

        {/* Instrucciones */}
        <Box sx={{ mt: 6, p: 3, backgroundColor: '#e3f2fd', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom color="primary">
            📝 Instrucciones de Uso:
          </Typography>
          <Typography variant="body2" component="ul" sx={{ pl: 2 }}>
            <li>
              Edita los estilos en <code>PDFPreviewPage.tsx</code> usando CSS normal
            </li>
            <li>Los cambios se reflejan automáticamente al guardar</li>
            <li>Usa las DevTools del navegador para experimentar</li>
            <li>
              Una vez satisfecho, transfiere los estilos a <code>ReportPDFDocument.tsx</code>
            </li>
            <li>Recuerda las limitaciones de @react-pdf/renderer al transferir</li>
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};
