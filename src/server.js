require('dotenv').config();

const app = require('./app');
const { verificarConexion, pool } = require('./config/db');
const port = Number(process.env.PORT || 3000);

async function iniciarServidor() {
  try {
    await verificarConexion();
  } catch (error) {
    // IA: MySQL puede no estar disponible al iniciar. Solucion manual: mantener
    // Express activo y responder HTTP 500 en operaciones de datos hasta reconectar.
    console.error('MySQL no esta disponible. La API iniciara y las operaciones de datos responderan HTTP 500 hasta reconectar.');
    console.error(error.message);
  }

  const server = app.listen(port, () => {
    console.log(`API disponible en http://localhost:${port}`);
  });

  const cerrarServidor = () => {
    server.close(async () => {
      await pool.end();
      process.exit(0);
    });
  };

  process.on('SIGINT', cerrarServidor);
  process.on('SIGTERM', cerrarServidor);
}

iniciarServidor();
