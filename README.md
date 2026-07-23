# AgendaIA

App de escritorio para organizacion personal. Tareas, recordatorios, Kanban, Pomodoro y mas.

## Descargar e Instalar

Ve a [**Releases**](https://github.com/Snakerrrr/AgendaIA/releases/latest) y descarga:

| Sistema | Archivo |
|---------|---------|
| Windows | `AgendaIA-X.X.X.Setup.exe` |
| macOS | `AgendaIA-X.X.X.dmg` o `.zip` |

**Windows:** Ejecuta el .exe y se instala automaticamente.
**macOS:** Abre el .dmg, arrastra AgendaIA a Aplicaciones.

## Funcionalidades

| Funcion | Descripcion |
|---------|-------------|
| Dashboard | Resumen del dia con estadisticas |
| Tareas | Crear, editar, filtrar con prioridad y urgencia |
| Habitos | Tareas recurrentes que se regeneran cada dia |
| Kanban | Vista de columnas con drag & drop |
| Eisenhower | Matriz de urgencia vs importancia |
| Vista Semanal | Agenda por horas tipo Google Calendar |
| Foco del Dia | Top 3 prioridades diarias |
| Pomodoro | Timer de 25 min con sesiones |
| Ideas | Captura rapida con conversion a tareas |
| Calendario | Vista mensual |
| Estadisticas | Graficos de productividad |
| Recordatorios | Notificaciones nativas del SO |
| Busqueda | Ctrl+K (Cmd+K en Mac) |
| Captura rapida | Ctrl+Shift+A (Cmd+Shift+A en Mac) |
| Mini Widget | Click en tray para resumen rapido |

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
npm run make     # generar instalador para tu SO
```

**Stack:** Electron, React 19, TypeScript, Tailwind CSS, SQLite (sql.js), Zustand, date-fns

**Compilar para otro SO:** No se puede cross-compilar. Para generar el .dmg necesitas un Mac. El workflow de GitHub Actions compila para ambos automaticamente al crear un tag `vX.X.X`.
