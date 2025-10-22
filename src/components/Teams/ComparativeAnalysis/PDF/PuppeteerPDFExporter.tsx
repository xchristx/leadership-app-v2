import React, { useState } from 'react';
import { Button } from '@mui/material';
import { PictureAsPdf as PdfIcon } from '@mui/icons-material';

interface PuppeteerPDFExporterProps {
  teamName: string;
  disabled?: boolean;
  onStart?: () => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

export const PuppeteerPDFExporter: React.FC<PuppeteerPDFExporterProps> = ({ teamName, disabled = false, onStart, onComplete, onError }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleExportToPDF = async () => {
    try {
      setIsGenerating(true);
      onStart?.();

      // Como Puppeteer no puede ejecutarse directamente en el navegador,
      // usaremos una API intermedia o html2pdf.js como alternativa

      // Opción 1: Usar la API de impresión del navegador (más simple)
      const printContent = () => {
        // Preparar el contenido para impresión
        const printButton = document.querySelector('[data-testid="export-buttons"]') as HTMLElement;
        if (printButton) {
          printButton.style.display = 'none';
        }

        // Configurar estilos de impresión
        const printStyles = document.createElement('style');
        printStyles.textContent = `
          @media print {
            @page {
              size: Letter;
              margin: 20mm;
            }
            
            body * {
              visibility: hidden;
            }
            
            #category-report-content,
            #category-report-content * {
              visibility: visible;
            }
            
            #category-report-content {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            
            [data-testid="page"] {
              page-break-after: always;
              page-break-inside: avoid;
            }
            
            [data-testid="page"]:last-child {
              page-break-after: auto;
            }
            
            /* Asegurar que los gráficos se impriman correctamente */
            canvas, svg {
              max-width: 100% !important;
              height: auto !important;
            }
            
            /* Mejorar legibilidad de tablas */
            table {
              border-collapse: collapse !important;
            }
            
            /* Mantener colores */
            * {
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
          }
        `;

        document.head.appendChild(printStyles);

        // Usar la API de impresión del navegador
        window.print();

        // Limpiar después de imprimir
        setTimeout(() => {
          document.head.removeChild(printStyles);
          if (printButton) {
            printButton.style.display = 'flex';
          }
        }, 1000);
      };

      // Opción 2: Si tienes un servidor con Puppeteer, enviar HTML
      const sendToPuppeteerAPI = async () => {
        // Obtener el contenido del reporte
        const reportContent = document.getElementById('category-report-content');
        if (!reportContent) {
          throw new Error('No se encontró el contenido del reporte');
        }

        // Obtener HTML completo con estilos
        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Reporte de Liderazgo - ${teamName}</title>
            <style>
              /* Estilos base del reporte */
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
                line-height: 1.4;
                color: #333;
                margin: 0;
                padding: 0;
              }
              
              /* Configuración de página */
              @page {
                size: Letter;
                margin: 20mm;
              }
              
              /* Saltos de página */
              [data-testid="page"] {
                page-break-after: always;
                page-break-inside: avoid;
                min-height: calc(100vh - 40mm);
                display: block;
                width: 100%;
              }
              
              [data-testid="page"]:last-child {
                page-break-after: auto;
              }
              
              /* Estilos de tabla */
              table {
                border-collapse: collapse;
                width: 100%;
              }
              
              th, td {
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
              }
              
              th {
                background-color: #f5f5f5;
                font-weight: bold;
              }
              
              /* Mantener colores y estilos */
              * {
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
              }
              
              /* Ocultar elementos no deseados */
              [data-testid="export-buttons"] {
                display: none !important;
              }
            </style>
          </head>
          <body>
            ${reportContent.innerHTML}
          </body>
          </html>
        `;

        // Enviar a tu API de Puppeteer (si la tienes configurada)
        const response = await fetch('/api/generate-pdf', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            html: htmlContent,
            filename: `Reporte_Liderazgo_${teamName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
            options: {
              format: 'Letter',
              printBackground: true,
              margin: {
                top: '20mm',
                right: '20mm',
                bottom: '20mm',
                left: '20mm',
              },
            },
          }),
        });

        if (!response.ok) {
          throw new Error(`Error del servidor: ${response.statusText}`);
        }

        // Descargar el PDF
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `Reporte_Liderazgo_${teamName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      };

      // Intentar usar la API de Puppeteer, si no está disponible usar impresión del navegador
      try {
        await sendToPuppeteerAPI();
      } catch (apiError) {
        console.log('API de Puppeteer no disponible, usando impresión del navegador:', apiError);
        printContent();
      }

      onComplete?.();
    } catch (error) {
      console.error('Error al generar PDF:', error);
      onError?.(error instanceof Error ? error : new Error('Error desconocido'));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      variant="contained"
      startIcon={<PdfIcon />}
      onClick={handleExportToPDF}
      disabled={disabled || isGenerating}
      sx={{
        backgroundColor: isGenerating ? '#90caf9' : '#1976d2',
        color: 'white',
        '&:hover': {
          backgroundColor: '#1565c0',
        },
        '&:disabled': {
          backgroundColor: '#e0e0e0',
          color: '#9e9e9e',
        },
      }}
    >
      {isGenerating ? 'Generando PDF...' : 'PDF Alta Fidelidad'}
    </Button>
  );
};

export default PuppeteerPDFExporter;
