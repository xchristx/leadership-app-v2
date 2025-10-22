const express = require('express');
const cors = require('cors');
const generatePDF = require('../api/generate-pdf');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ruta para generar PDF
app.post('/api/generate-pdf', generatePDF);

// Ruta de salud
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'PDF Generator API' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor PDF API ejecutándose en http://localhost:${PORT}`);
  console.log(`📄 Endpoint disponible en http://localhost:${PORT}/api/generate-pdf`);
});

module.exports = app;