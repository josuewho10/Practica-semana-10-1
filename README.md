# API de seguimiento de proyectos de investigacion

API REST para registrar proyectos, responsables, lineas de investigacion, fechas, estado y porcentaje de avance. La implementacion usa Node.js 20+, Express, MySQL y `mysql2/promise`.

Incluye una interfaz web adaptable a movil y escritorio, servida por Express en la misma direccion que la API. Desde el panel se pueden listar, buscar, filtrar, crear, editar y eliminar proyectos.

> **Nota sobre la guia:** el encabezado menciona Python, pero el objetivo, los recursos y los pasos de la practica solicitan Node.js + Express + MySQL. Este proyecto sigue los pasos concretos del CRUD con MySQL.

## Estructura

```text
public/
  index.html
  styles.css
  app.js
src/
  app.js
  server.js
  config/db.js
  controllers/proyectosController.js
  routes/proyectosRoutes.js
database/schema.sql
postman/Seguimiento_Proyectos.postman_collection.json
.env.example
.gitignore
```

## Requisitos

- Node.js LTS 20.x y npm.
- MySQL (por ejemplo, el que incluye XAMPP o Laragon).
- Postman, Insomnia o Thunder Client.

## Instalacion y ejecucion

1. Abre una terminal en la carpeta del proyecto y ejecuta `npm install`.
2. En phpMyAdmin o en el cliente MySQL, ejecuta el contenido de `database/schema.sql`. Crea `db_lab10` y la tabla `proyectos_investigacion`; incluye dos registros de ejemplo.
3. Copia `.env.example` como `.env` y coloca tus valores locales de MySQL. No subas `.env` a GitHub; `.gitignore` ya lo excluye.
4. Inicia el servidor con `npm run dev` (o `npm start`).
5. Abre `http://localhost:3000` para usar la interfaz web. La API sigue disponible bajo `/api` en el mismo servidor.
6. Comprueba `GET http://localhost:3000/api/health` y, si lo necesitas, importa la coleccion JSON de `postman/`.

## Modelo de datos

| Campo | Tipo | Regla |
|---|---|---|
| `id` | entero autoincremental | Identificador del proyecto |
| `titulo` | varchar(180) | Obligatorio |
| `resumen` | texto | Obligatorio |
| `linea_investigacion` | varchar(120) | Obligatorio |
| `investigador_principal` | varchar(140) | Obligatorio |
| `facultad` | varchar(140) | Obligatorio |
| `fecha_inicio` | DATE | Obligatorio |
| `fecha_fin` | DATE o NULL | No anterior a fecha_inicio |
| `estado` | ENUM | propuesto, en_evaluacion, aprobado, en_ejecucion, finalizado, cancelado |
| `porcentaje_avance` | 0-100 | Por defecto 0 |
| `created_at`, `updated_at` | timestamp | Administrados por MySQL |

## Endpoints previstos

| Metodo | Ruta | Respuesta esperada |
|---|---|---|
| GET | `/api/proyectos` | 200, arreglo JSON; acepta filtro opcional `?estado=en_ejecucion` |
| GET | `/api/proyectos/:id` | 200; 400 si el ID no es valido; 404 si no existe |
| POST | `/api/proyectos` | 201 al crear; 400 ante datos invalidos |
| PUT | `/api/proyectos/:id` | 200 al actualizar; 400 ante datos invalidos; 404 si no existe |
| DELETE | `/api/proyectos/:id` | 200 al eliminar; 400 ante ID invalido; 404 si no existe |

Todos los endpoints reciben y devuelven JSON. La coleccion de Postman incluye un ejemplo de cada operacion y una consulta para provocar un 404. La interfaz web consume estos endpoints para mantener la lista sincronizada con MySQL.

## Validaciones y errores

El controlador valida identificadores positivos, campos de texto, estados permitidos, fechas reales y rango de avance (0-100). Las consultas usan `pool.execute` con placeholders. Los endpoints devuelven codigos 200, 201, 400, 404 o 500 segun el resultado, siempre como JSON. Los errores internos se registran localmente y la respuesta no expone stack traces.

La guia exige que al menos el 70% de la logica de controladores y rutas se escriba manualmente y prohibe pedir a la IA el CRUD completo listo para copiar y pegar. Este proyecto contiene una implementacion completa generada como referencia, pero eso no cumple esa regla de autoria de la practica. Si se entrega tal cual, explicalo al docente y verifica si acepta apoyo de IA; otra opcion es estudiar el codigo y reescribir esa logica con tus propias decisiones.

## Pruebas HTTP y evidencias

Importa `postman/Seguimiento_Proyectos.postman_collection.json` en Postman. Selecciona `baseUrl` (por defecto `http://localhost:3000`) y ejecuta las peticiones. La guia pide evidencias visuales de la estructura, configuracion de DB, codigo del controlador y respuestas 200/201 y errores 404/500. Guarda capturas de tu propio entorno y agrega tu enlace de GitHub cuando hayas creado y publicado el repositorio; verifica que `.env` no forme parte del commit.

### Estado de verificacion de este entorno

Se reviso la sintaxis de los archivos JavaScript, el JSON de la coleccion y sus scripts. Con la base real activa se verificaron `GET` lista (200), `POST` (201), `PUT` (200), `GET` por id (200), validacion invalida (400), id inexistente (404), `DELETE` (200) y consulta despues de borrar (404). El registro temporal de prueba se elimino al terminar. Tambien se verifico una respuesta 500 JSON en un servidor de prueba aislado con el puerto de MySQL no disponible; ese proceso temporal se cerro y el servidor principal continuo en el puerto 3000.

## GitHub

Antes de subir, revisa `git status` y confirma que `.env` y `node_modules/` esten ignorados. No se publico ningun repositorio desde este proyecto local.
