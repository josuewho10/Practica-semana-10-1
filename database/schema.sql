CREATE DATABASE IF NOT EXISTS db_lab10
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE db_lab10;

CREATE TABLE IF NOT EXISTS proyectos_investigacion (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  titulo VARCHAR(180) NOT NULL,
  resumen TEXT NOT NULL,
  linea_investigacion VARCHAR(120) NOT NULL,
  investigador_principal VARCHAR(140) NOT NULL,
  facultad VARCHAR(140) NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NULL,
  estado ENUM('propuesto', 'en_evaluacion', 'aprobado', 'en_ejecucion', 'finalizado', 'cancelado') NOT NULL DEFAULT 'propuesto',
  porcentaje_avance TINYINT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT chk_proyectos_avance CHECK (porcentaje_avance BETWEEN 0 AND 100),
  CONSTRAINT chk_proyectos_fechas CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio),
  INDEX idx_proyectos_estado (estado),
  INDEX idx_proyectos_facultad (facultad)
) ENGINE=InnoDB;

-- Datos de ejemplo para practicar. Ejecuta este bloque una sola vez si deseas
-- poblar la tabla; elimina estos INSERT si tu docente pide ingresar datos manualmente.
INSERT INTO proyectos_investigacion
  (titulo, resumen, linea_investigacion, investigador_principal, facultad, fecha_inicio, fecha_fin, estado, porcentaje_avance)
VALUES
  ('Sistema de monitoreo de calidad del agua', 'Prototipo de bajo costo para registrar indicadores de calidad del agua en zonas rurales.', 'Tecnologia ambiental', 'Ana Torres', 'Ingenieria de Sistemas', '2026-03-01', '2027-02-28', 'en_ejecucion', 35),
  ('Analisis de datos para la deteccion temprana de anemia', 'Estudio exploratorio de variables asociadas a anemia en poblacion escolar.', 'Salud publica y datos', 'Luis Rojas', 'Ciencias de la Salud', '2026-06-01', NULL, 'aprobado', 0);
