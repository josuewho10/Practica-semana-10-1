const estadosPermitidos = [
  'propuesto', 'en_evaluacion', 'aprobado',
  'en_ejecucion', 'finalizado', 'cancelado'
];

const { pool } = require('../config/db');
const camposTexto = [
  'titulo', 'resumen', 'linea_investigacion',
  'investigador_principal', 'facultad'
];

function validarId(valor) {
  if (typeof valor !== 'string' || !/^[1-9]\d*$/.test(valor)) return null;
  const id = Number(valor);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function fechaValida(valor) {
  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const fecha = new Date(`${valor}T00:00:00.000Z`);
  return !Number.isNaN(fecha.getTime()) && fecha.toISOString().slice(0, 10) === valor;
}

function validarProyecto(body, parcial = false) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'El cuerpo debe ser un objeto JSON.' };
  }

  const requeridos = parcial
    ? Object.keys(body)
    : [...camposTexto, 'fecha_inicio', 'estado', 'porcentaje_avance'];
  const permitidos = new Set([...camposTexto, 'fecha_inicio', 'fecha_fin', 'estado', 'porcentaje_avance']);
  const desconocidos = Object.keys(body).filter((campo) => !permitidos.has(campo));
  if (desconocidos.length) return { error: `Campos no permitidos: ${desconocidos.join(', ')}.` };
  if (parcial && requeridos.length === 0) return { error: 'Incluye al menos un campo para actualizar.' };

  const datos = {};
  for (const campo of requeridos) {
    if (!Object.prototype.hasOwnProperty.call(body, campo)) {
      return { error: `El campo ${campo} es obligatorio.` };
    }
  }

  for (const campo of camposTexto) {
    if (Object.prototype.hasOwnProperty.call(body, campo)) {
      if (typeof body[campo] !== 'string' || !body[campo].trim()) {
        return { error: `El campo ${campo} debe ser un texto no vacio.` };
      }
      datos[campo] = body[campo].trim();
    }
  }

  for (const campo of ['fecha_inicio', 'fecha_fin']) {
    if (Object.prototype.hasOwnProperty.call(body, campo)) {
      if (body[campo] === null && campo === 'fecha_fin') {
        datos[campo] = null;
      } else if (!fechaValida(body[campo])) {
        return { error: `El campo ${campo} debe tener una fecha real en formato YYYY-MM-DD${campo === 'fecha_fin' ? ' o ser null' : ''}.` };
      } else {
        datos[campo] = body[campo];
      }
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, 'estado')) {
    if (!estadosPermitidos.includes(body.estado)) {
      return { error: `El estado debe ser uno de: ${estadosPermitidos.join(', ')}.` };
    }
    datos.estado = body.estado;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'porcentaje_avance')) {
    if (!Number.isInteger(body.porcentaje_avance) || body.porcentaje_avance < 0 || body.porcentaje_avance > 100) {
      return { error: 'porcentaje_avance debe ser un entero entre 0 y 100.' };
    }
    datos.porcentaje_avance = body.porcentaje_avance;
  }

  const fechaInicio = datos.fecha_inicio ?? body.fecha_inicio;
  const fechaFin = datos.fecha_fin ?? body.fecha_fin;
  if (fechaInicio && fechaFin && fechaFin < fechaInicio) {
    return { error: 'fecha_fin no puede ser anterior a fecha_inicio.' };
  }
  return { datos };
}

function responderError(res, error) {
  // No se envian detalles internos ni stack traces en la respuesta HTTP.
  console.error('Error en la API de proyectos:', error.message);
  return res.status(500).json({ error: 'Error interno del servidor.' });
}

async function listarProyectos(req, res) {
  try {
    const { estado } = req.query;
    if (estado && !estadosPermitidos.includes(estado)) {
      return res.status(400).json({ error: `El estado debe ser uno de: ${estadosPermitidos.join(', ')}.` });
    }
    const sql = estado
      ? 'SELECT * FROM proyectos_investigacion WHERE estado = ? ORDER BY id DESC'
      : 'SELECT * FROM proyectos_investigacion ORDER BY id DESC';
    const [proyectos] = await pool.execute(sql, estado ? [estado] : []);
    return res.status(200).json(proyectos);
  } catch (error) {
    return responderError(res, error);
  }
}

async function obtenerProyecto(req, res) {
  const id = validarId(req.params.id);
  if (!id) return res.status(400).json({ error: 'El id debe ser un entero positivo.' });
  try {
    const [proyectos] = await pool.execute(
      'SELECT * FROM proyectos_investigacion WHERE id = ?', [id]
    );
    if (!proyectos.length) return res.status(404).json({ error: 'Proyecto no encontrado.' });
    return res.status(200).json(proyectos[0]);
  } catch (error) {
    return responderError(res, error);
  }
}

async function crearProyecto(req, res) {
  const validacion = validarProyecto(req.body);
  if (validacion.error) return res.status(400).json({ error: validacion.error });
  const datos = { fecha_fin: null, porcentaje_avance: 0, ...validacion.datos };
  try {
    const sql = `INSERT INTO proyectos_investigacion
      (titulo, resumen, linea_investigacion, investigador_principal, facultad,
       fecha_inicio, fecha_fin, estado, porcentaje_avance)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const valores = [
      datos.titulo, datos.resumen, datos.linea_investigacion,
      datos.investigador_principal, datos.facultad, datos.fecha_inicio,
      datos.fecha_fin, datos.estado, datos.porcentaje_avance
    ];
    const [resultado] = await pool.execute(sql, valores);
    const [proyectos] = await pool.execute(
      'SELECT * FROM proyectos_investigacion WHERE id = ?', [resultado.insertId]
    );
    return res.status(201).json(proyectos[0]);
  } catch (error) {
    return responderError(res, error);
  }
}

async function actualizarProyecto(req, res) {
  const id = validarId(req.params.id);
  if (!id) return res.status(400).json({ error: 'El id debe ser un entero positivo.' });
  const validacion = validarProyecto(req.body);
  if (validacion.error) return res.status(400).json({ error: validacion.error });
  const datos = { fecha_fin: null, porcentaje_avance: 0, ...validacion.datos };
  try {
    const [existentes] = await pool.execute(
      'SELECT id FROM proyectos_investigacion WHERE id = ?', [id]
    );
    if (!existentes.length) return res.status(404).json({ error: 'Proyecto no encontrado.' });
    await pool.execute(
      `UPDATE proyectos_investigacion SET titulo = ?, resumen = ?, linea_investigacion = ?,
       investigador_principal = ?, facultad = ?, fecha_inicio = ?, fecha_fin = ?,
       estado = ?, porcentaje_avance = ? WHERE id = ?`,
      [datos.titulo, datos.resumen, datos.linea_investigacion,
        datos.investigador_principal, datos.facultad, datos.fecha_inicio,
        datos.fecha_fin, datos.estado, datos.porcentaje_avance, id]
    );
    const [actualizados] = await pool.execute(
      'SELECT * FROM proyectos_investigacion WHERE id = ?', [id]
    );
    return res.status(200).json(actualizados[0]);
  } catch (error) {
    return responderError(res, error);
  }
}

async function eliminarProyecto(req, res) {
  const id = validarId(req.params.id);
  if (!id) return res.status(400).json({ error: 'El id debe ser un entero positivo.' });
  try {
    const [resultado] = await pool.execute(
      'DELETE FROM proyectos_investigacion WHERE id = ?', [id]
    );
    if (!resultado.affectedRows) return res.status(404).json({ error: 'Proyecto no encontrado.' });
    return res.status(200).json({ mensaje: 'Proyecto eliminado correctamente.', id });
  } catch (error) {
    return responderError(res, error);
  }
}

module.exports = {
  listarProyectos,
  obtenerProyecto,
  crearProyecto,
  actualizarProyecto,
  eliminarProyecto,
  estadosPermitidos
};
