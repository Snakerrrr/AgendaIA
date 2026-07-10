# AgendaIA

App de escritorio para organizacion personal. Tareas, recordatorios, Kanban, Pomodoro y mas.

## Descargar e Instalar

1. Ve a [**Releases**](https://github.com/Snakerrrr/AgendaIA/releases/latest)
2. Descarga `AgendaIA-1.0.0.Setup.exe`
3. Ejecutalo y listo

## Funcionalidades

| Funcion | Descripcion |
|---------|-------------|
| Dashboard | Resumen del dia con estadisticas |
| Tareas | Crear, editar, filtrar con prioridad y urgencia |
| Kanban | Vista de columnas con drag & drop |
| Eisenhower | Matriz de urgencia vs importancia |
| Vista Semanal | Agenda por horas tipo Google Calendar |
| Foco del Dia | Top 3 prioridades diarias |
| Pomodoro | Timer de 25 min con sesiones |
| Ideas | Captura rapida con conversion a tareas |
| Calendario | Vista mensual |
| Estadisticas | Graficos de productividad |
| Recordatorios | Notificaciones nativas de Windows |
| Busqueda | Ctrl+K para buscar en todo |
| Captura rapida | Ctrl+Shift+A desde cualquier app |

## Personalizacion

- 3 fondos animados (Particulas, Sakura, Sistema Solar)
- 8 colores de acento
- Tema oscuro/claro
- Fuentes cyberpunk (Orbitron + Rajdhani)
- Sonidos de feedback

## Para Desarrolladores

```bash
git clone https://github.com/Snakerrrr/AgendaIA.git
cd AgendaIA
npm install
npm start        # modo desarrollo
npm run make     # generar .exe
```

**Stack:** Electron, React 19, TypeScript, Tailwind CSS, SQLite (sql.js), Zustand, date-fns
