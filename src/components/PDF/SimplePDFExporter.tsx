import React from 'react';
import { Button } from '@mui/material';
import { PictureAsPdf } from '@mui/icons-material';

interface SimplePDFExporterProps {
  content?: string;
  contentElementId?: string;
}

interface PageSize {
  name: string;
  size: string;
  width: string;
  height: string;
  margin: string;
}

const PAGE_SIZES: PageSize[] = [
  {
    name: 'Carta (Letter)',
    size: 'letter',
    width: '8.5in',
    height: '11in',
    margin: '0.5in',
  },
  {
    name: 'A4',
    size: 'A4',
    width: '210mm',
    height: '297mm',
    margin: '15mm',
  },
  {
    name: 'Legal',
    size: 'legal',
    width: '8.5in',
    height: '14in',
    margin: '0.5in',
  },
  {
    name: 'Carta - Sin márgenes',
    size: 'letter',
    width: '8.5in',
    height: '11in',
    margin: '0',
  },
  {
    name: 'A4 - Sin márgenes',
    size: 'A4',
    width: '210mm',
    height: '297mm',
    margin: '0',
  },
];

const SimplePDFExporter: React.FC<SimplePDFExporterProps> = ({ contentElementId = 'pdf-pages-only' }) => {
  // Solo permitir formato carta
  const cartaPageSize = PAGE_SIZES[0];
  const handleExportPDF = () => {
    console.log('🔍 Iniciando exportación PDF...');
    console.log('📋 Página seleccionada:', cartaPageSize);
    console.log('🆔 Buscando elemento con ID:', contentElementId);

    // Buscar el elemento
    let sourceElement = document.getElementById(contentElementId);

    if (!sourceElement) {
      console.log('❌ Elemento no encontrado con ID:', contentElementId);
      console.log('🔄 Intentando con IDs alternativos...');

      // Probar diferentes IDs
      const alternativeIds = ['pdf-pages-only', 'category-report-content'];

      for (const id of alternativeIds) {
        sourceElement = document.getElementById(id);
        if (sourceElement) {
          console.log('✅ Elemento encontrado con ID alternativo:', id);
          break;
        }
      }
    } else {
      console.log('✅ Elemento encontrado:', sourceElement);
    }

    if (!sourceElement) {
      console.log('❌ No se pudo encontrar ningún elemento con los IDs:', [
        contentElementId,
        ...['pdf-pages-only', 'category-report-content'],
      ]);
      alert(`No se encontró el contenido del reporte. Por favor verifica que estés en la página correcta.`);
      return;
    }

    console.log('📄 Contenido del elemento (longitud):', sourceElement.innerHTML.length);

    // Crear una nueva ventana
    const printWindow = window.open('', '_blank');

    if (printWindow) {
      // Copiar todas las hojas de estilo del documento padre
      const styleSheets = Array.from(document.styleSheets);
      let allStyles = '';

      // Intentar capturar estilos CSS
      try {
        styleSheets.forEach(styleSheet => {
          try {
            if (styleSheet.cssRules) {
              Array.from(styleSheet.cssRules).forEach(rule => {
                allStyles += rule.cssText + '\n';
              });
            }
          } catch {
            // Algunos estilos pueden no ser accesibles por CORS
          }
        });
      } catch {
        console.warn('No se pudieron capturar todos los estilos CSS');
      }

      // Clonar el contenido del elemento
      const clonedContent = sourceElement.cloneNode(true) as HTMLElement;
      console.log('Contenido clonado:', clonedContent);
      console.log('HTML del contenido clonado (primeros 500 chars):', clonedContent.outerHTML.substring(0, 500));

      // Remover elementos que no deben imprimirse
      const exportButtons = clonedContent.querySelector('[data-testid="export-buttons"]');
      if (exportButtons) {
        exportButtons.remove();
        console.log('Botones de exportación removidos');
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Reporte de Liderazgo - ${new Date().toLocaleDateString('es-ES')}</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          
          <!-- Importar fuentes de Google -->
          <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;600;700&display=swap" rel="stylesheet">
          <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
          
          <style>
            /* Estilos capturados del documento original */
            ${allStyles}
            
            /* Estilos adicionales para impresión */
            @page {
              size: ${cartaPageSize.size};
            }
            
            @media print {
              body { 
                background: white !important;
              }
              .no-print { 
                display: none !important; 
              }
              [data-testid="export-buttons"] {
                display: none !important;
              }
              /* Forzar saltos de página */
              [data-testid="page"] {
                page-break-after: always;
                // margin-bottom: 0;
              }
              [data-testid="page"]:last-child {
                page-break-after: auto;
              }
            }
            
            /* Estilos base para la impresión */
            body {
              font-family: 'Roboto', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              background: white;
            }
            
            /* Eliminar márgenes extra de Material-UI */
            #${contentElementId} {
              background: white !important;
            }
            
            /* Asegurar que los colores se muestren */
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            /* Estilos específicos para tablas */
            // table {
            //   border-collapse: collapse;
            //   width: 100%;
            //   margin-bottom: 20px;
            // }
            .caratula {
              margin: 0 !important;
              padding: 0 !important;
            }
            .pagina-comun{
              margin: 0 !important;
              padding: 20mm 20mm !important;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
              color: black
            }

           

            .css-axmyti-MuiPaper-root-MuiTableContainer-root {
            max-height: none !important;
            }

            th {
              font-weight: 600;
            }
            
            /* Estilos para gráficos */
            .recharts-wrapper {
              margin: 20px 0;
            }
            
            /* Mantener estructura de páginas */
            .MuiPaper-root {
            //   box-shadow: none !important;
              background: white !important;
            }
            
            /* Eliminar márgenes específicos de las páginas */
            [data-testid="page"] {
              box-sizing: border-box !important;
            }
            
            /* Asegurar que el contenido ocupe toda la página */
            .MuiBox-root {
            //   margin: 0 !important;
            }
            
            /* Eliminar padding del contenedor principal */
            div[style*="width: 216mm"] {
              background: white !important;
            }
          </style>
        </head>
        <body>
        <div>
        
        ${clonedContent.outerHTML}
        </div>
          
          <button class="no-print" onclick="window.print(); window.close();" style="
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 24px;
            background: #1976d2;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 600;
            z-index: 10000;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            font-family: 'Roboto', Arial, sans-serif;
          ">
            🖨️ Imprimir / Guardar PDF
          </button>
          
          <script>
            // Auto-activar impresión después de cargar
            window.onload = function() {
              setTimeout(function() {
                window.focus();
              }, 1000);
            }
          </script>
        </body>
        </html>
      `);

      printWindow.document.close();

      // Dar tiempo para cargar
      setTimeout(() => {
        printWindow.focus();
      }, 1000);
    }
  };

  return (
    <Button variant="contained" color="primary" startIcon={<PictureAsPdf />} onClick={handleExportPDF} sx={{ ml: 1 }}>
      Exportar PDF (Carta)
    </Button>
  );
};

export default SimplePDFExporter;
