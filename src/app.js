const express = require('express');
const cors = require('cors');
const path = require('path');
const proyectosRoutes = require('./routes/proyectosRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Interfaz web servida por la misma aplicacion que expone la API.
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/api/health', (req, res) => {
  res.status(200).json({ estado: 'ok', servicio: 'API de proyectos de investigacion' });
});

app.use('/api/proyectos', proyectosRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada.' });
});

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  const esJsonInvalido = error instanceof SyntaxError && error.status === 400 && 'body' in error;
  if (esJsonInvalido) {
    return res.status(400).json({ error: 'El cuerpo de la solicitud no contiene JSON valido.' });
  }
  console.error('Error no controlado en la API:', error.message);
  return res.status(500).json({ error: 'Error interno del servidor.' });
});

module.exports = app;
