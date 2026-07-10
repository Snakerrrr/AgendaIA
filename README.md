# AgendaIA

Aplicacion de escritorio para organizacion personal con gestion de tareas, recordatorios y productividad.

## Descargar

Ve a la seccion de [Releases](../../releases) y descarga el archivo `AgendaIA-1.0.0.Setup.exe`.

## Funcionalidades

- **Dashboard** con resumen del dia, progreso y accesos rapidos
- **Tareas** con prioridad, urgencia, categorias, fechas y subtareas
- **Vista Kanban** con drag & drop entre columnas
- **Matriz Eisenhower** para organizar por urgencia/importancia
- **Vista Semanal** tipo agenda por horas
- **Foco del Dia** con Top 3 prioridades
- **Pomodoro Timer** con sesiones de 25 min y descansos
- **Ideas/Notas** con conversion rapida a tareas
- **Calendario** mensual con tareas por dia
- **Estadisticas** de productividad con graficos
- **Recordatorios** con notificaciones nativas de Windows
- **Busqueda global** con Ctrl+K
- **Tareas recurrentes** (diarias, semanales, mensuales)
- **Modo No Molestar** para pausar notificaciones
- **System Tray** para mantener la app corriendo en segundo plano
- **Atajo global** Ctrl+Shift+A para captura rapida desde cualquier app
- **Inicio automatico** con Windows
- **Fondos animados** (Particulas, Sakura, Sistema Solar)
- **8 colores de acento** personalizables
- **Tema oscuro/claro**
- **Sonidos** de feedback al completar tareas
- **Fuentes cyberpunk** (Orbitron + Rajdhani)

## Stack

- Electron + Vite + TypeScript
- React 19 + Tailwind CSS 3
- SQLite (sql.js) local
- Zustand para estado
- date-fns para fechas

## Desarrollo

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm start

# Generar el .exe instalador
npm run make
```

Los datos se guardan localmente en `%APPDATA%/agendaia/agendaia.db`.
