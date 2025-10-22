# Servidor Node.js para API de Puppeteer

## Instalación

1. Instalar dependencias adicionales:
```bash
npm install express cors
```

2. Crear y ejecutar el servidor:
```bash
node server.js
```

## Uso

El servidor estará disponible en `http://localhost:3001/api/generate-pdf`

La aplicación Vite puede hacer requests a esta API para generar PDFs con Puppeteer.

## Alternativa

Si no quieres ejecutar el servidor separado, el componente automáticamente usará el método de respaldo (ventana de impresión del navegador) que funciona igual de bien.