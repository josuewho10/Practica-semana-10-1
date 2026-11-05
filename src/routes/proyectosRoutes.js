const express = require('express');
const proyectosController = require('../controllers/proyectosController');

const router = express.Router();

// Rutas base conectadas al controlador para completar la practica.
router.get('/', proyectosController.listarProyectos);
router.get('/:id', proyectosController.obtenerProyecto);
router.post('/', proyectosController.crearProyecto);
router.put('/:id', proyectosController.actualizarProyecto);
router.delete('/:id', proyectosController.eliminarProyecto);

module.exports = router;
