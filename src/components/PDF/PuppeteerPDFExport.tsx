import React, { useState } from 'react';
import { Button, CircularProgress, Alert, Snackbar } from '@mui/material';
import { PictureAsPdf } from '@mui/icons-material';

interface PuppeteerPDFExportProps {
  teamName?: string;
  disabled?: boolean;
}

const PuppeteerPDFExport: React.FC<PuppeteerPDFExportProps> = ({ teamName = 'Equipo', disabled = false }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleExportPDF = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener el contenido HTML completo de la página
      const contentElement = document.getElementById('category-report-content');

      if (!contentElement) {
        throw new Error('No se encontró el contenido del reporte');
      }

      // Crear una copia limpia del contenido sin botones de exportación
      const clonedContent = contentElement.cloneNode(true) as HTMLElement;
      const exportButtons = clonedContent.querySelector('[data-testid="export-buttons"]');
      if (exportButtons) {
        exportButtons.remove();
      }

      // Obtener todos los estilos CSS de la página
      const styleSheets = Array.from(document.styleSheets);
      let allStyles = '';

      try {
        styleSheets.forEach(styleSheet => {
          try {
            if (styleSheet.cssRules) {
              Array.from(styleSheet.cssRules).forEach(rule => {
                allStyles += rule.cssText + '\n';
              });
            }
          } catch {
            // Ignorar estilos no accesibles por CORS
          }
        });
      } catch {
        console.warn('No se pudieron capturar todos los estilos CSS');
      }

      // Crear el HTML completo para enviar a Puppeteer
      const fullHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reporte de Liderazgo - ${teamName}</title>
          
          <!-- Fuentes -->
          <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;600;700&display=swap" rel="stylesheet">
          
          <style>
            ${allStyles}
            
            /* Estilos específicos para PDF */
            @page {
              margin: 15mm;
              size: A4;
            }
            
            body {
              margin: 0;
              padding: 0;
              font-family: 'Roboto', Arial, sans-serif;
              background: white !important;
            }
            
            /* Asegurar colores en impresión */
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            /* Saltos de página */
            [data-testid="page"] {
              page-break-after: always;
              margin-bottom: 0;
            }
            
            [data-testid="page"]:last-child {
              page-break-after: auto;
            }
            
            /* Ocultar elementos de interfaz */
            [data-testid="export-buttons"] {
              display: none !important;
            }
          </style>
        </head>
        <body>
          ${clonedContent.outerHTML}
        </body>
        </html>
      `;

      // Enviar a la API de Puppeteer (intentar servidor local primero)
      const apiEndpoints = [
        'http://localhost:3001/api/generate-pdf', // Servidor local
        '/api/generate-pdf', // Netlify/Vercel function
      ];

      let response = null;
      let lastError = null;

      for (const endpoint of apiEndpoints) {
        try {
          response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              html: fullHTML,
              filename: `Reporte_Liderazgo_${teamName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
            }),
          });

          if (response.ok) {
            break; // Éxito, salir del bucle
          }
        } catch (error) {
          lastError = error;
          response = null;
        }
      }

      if (!response || !response.ok) {
        // Si la API no está disponible, usar método de respaldo
        console.warn('API de Puppeteer no disponible, usando método de respaldo');
        if (lastError) console.warn('Error:', lastError);
        fallbackPrintMethod(fullHTML, teamName);
        return;
      }

      // Descargar el PDF generado
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Reporte_Liderazgo_${teamName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setSuccess(true);
      console.log('PDF generado exitosamente con Puppeteer');
    } catch (error) {
      console.error('Error en exportación Puppeteer:', error);

      // Método de respaldo: ventana de impresión
      try {
        const contentElement = document.getElementById('category-report-content');
        if (contentElement) {
          fallbackPrintMethod(contentElement.outerHTML, teamName);
        } else {
          throw new Error('No se pudo acceder al contenido del reporte');
        }
      } catch (fallbackError) {
        setError('Error al generar el PDF. Por favor, inténtalo de nuevo.');
        console.error('Error en método de respaldo:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  // Método de respaldo usando ventana de impresión del navegador
  const fallbackPrintMethod = (htmlContent: string, teamName: string) => {
    const printWindow = window.open('', '_blank');

    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Reporte de Liderazgo - ${teamName}</title>
          <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;600;700&display=swap" rel="stylesheet">
          <style>
            @page { margin: 15mm; size: A4; }
            body { 
              margin: 0; 
              padding: 20px; 
              font-family: 'Roboto', Arial, sans-serif; 
              background: white; 
            }
            * { -webkit-print-color-adjust: exact !important; }
            [data-testid="export-buttons"] { display: none !important; }
            [data-testid="page"] { page-break-after: always; margin-bottom: 20px; }
            [data-testid="page"]:last-child { page-break-after: auto; }
          </style>
        </head>
        <body>
          ${htmlContent}
          <div style="position: fixed; top: 20px; right: 20px; z-index: 10000;">
            <button onclick="window.print(); window.close();" style="
              padding: 12px 24px;
              background: #1976d2;
              color: white;
              border: none;
              border-radius: 6px;
              cursor: pointer;
              font-size: 16px;
              font-weight: 600;
              font-family: 'Roboto', Arial, sans-serif;
            ">
              🖨️ Imprimir PDF
            </button>
          </div>
        </body>
        </html>
      `);

      printWindow.document.close();

      setTimeout(() => {
        printWindow.focus();
      }, 1000);

      setSuccess(true);
      console.log('Usando método de respaldo: ventana de impresión');
    }
  };

  return (
    <>
      <Button
        variant="contained"
        color="primary"
        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PictureAsPdf />}
        onClick={handleExportPDF}
        disabled={disabled || loading}
        sx={{
          ml: 1,
          minWidth: '160px',
          '&.Mui-disabled': {
            backgroundColor: 'rgba(0, 0, 0, 0.12)',
            color: 'rgba(0, 0, 0, 0.26)',
          },
        }}
      >
        {loading ? 'Generando...' : 'PDF Puppeteer'}
      </Button>

      {/* Notificación de éxito */}
      <Snackbar
        open={success}
        autoHideDuration={3000}
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccess(false)} severity="success" sx={{ width: '100%' }}>
          ¡PDF generado exitosamente!
        </Alert>
      </Snackbar>

      {/* Notificación de error */}
      <Snackbar
        open={!!error}
        autoHideDuration={4000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </>
  );
};

export default PuppeteerPDFExport;
