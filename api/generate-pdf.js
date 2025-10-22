// API endpoint para generar PDF con Puppeteer
// Este archivo es opcional y requiere un servidor Node.js

const puppeteer = require('puppeteer');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  let browser;
  
  try {
    const { html, options = {}, filename } = req.body;

    if (!html) {
      return res.status(400).json({ error: 'HTML es requerido' });
    }

    // Configuración por defecto
    const defaultOptions = {
      format: 'Letter',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      },
      ...options
    };

    // Lanzar navegador en modo headless
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();

    // Configurar viewport para mejor calidad
    await page.setViewport({
      width: 1200,
      height: 1600,
      deviceScaleFactor: 2
    });

    // Configurar el contenido HTML
    await page.setContent(html, {
      waitUntil: ['networkidle0', 'domcontentloaded'],
      timeout: 30000
    });

    // Esperar a que los gráficos y elementos se carguen completamente
    await page.waitForTimeout(2000);

    // Evaluar JavaScript en la página para asegurar renderizado completo
    await page.evaluate(() => {
      return new Promise((resolve) => {
        // Esperar a que todos los elementos canvas estén renderizados
        const checkCanvases = () => {
          const canvases = document.querySelectorAll('canvas');
          if (canvases.length === 0) {
            resolve(true);
            return;
          }
          
          let allLoaded = true;
          canvases.forEach(canvas => {
            const ctx = canvas.getContext('2d');
            if (ctx) {
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const isEmpty = imageData.data.every(value => value === 0);
              if (isEmpty) allLoaded = false;
            }
          });
          
          if (allLoaded) {
            resolve(true);
          } else {
            setTimeout(checkCanvases, 100);
          }
        };
        
        setTimeout(checkCanvases, 500);
      });
    });

    // Generar PDF
    const pdf = await page.pdf(defaultOptions);

    await browser.close();

    // Configurar headers para descarga
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', pdf.length);
    res.setHeader('Content-Disposition', `attachment; filename="${filename || 'reporte.pdf'}"`);
    
    // Enviar el PDF
    res.end(pdf);

  } catch (error) {
    console.error('Error generando PDF:', error);
    
    if (browser) {
      await browser.close();
    }
    
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error.message
    });
  }
}