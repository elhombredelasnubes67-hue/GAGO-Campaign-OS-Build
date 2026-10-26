# Procedencia del código — GAGO CAMPAIGN OS

## Código existente reutilizado

**Ninguno.** El repositorio estaba vacío (solo configuración base de Vite + React + TypeScript + Tailwind CSS).

No se han encontrado componentes de:
- PYME OS
- ATIENDE
- GAGO Open Artifact Foundry
- SECURITY GATEWAY

## Código nuevo

Todo el código de la aplicación ha sido escrito específicamente para GAGO CAMPAIGN OS:

### Frontend (React + TypeScript + Tailwind CSS)
- `src/App.tsx` — Componente principal con enrutamiento
- `src/lib/types.ts` — Tipos TypeScript del modelo de datos
- `src/lib/store.tsx` — Store de estado con modo demostración
- `src/components/Layout.tsx` — Layout con navegación lateral
- `src/pages/LoginPage.tsx` — Pantalla de inicio de sesión
- `src/pages/Dashboard.tsx` — Panel de control
- `src/pages/ProductsPage.tsx` — Gestión de productos y servicios
- `src/pages/CampaignsPage.tsx` — Gestión de campañas
- `src/pages/CreativesPage.tsx` — Gestión de anuncios con versiones
- `src/pages/EvidencePage.tsx` — Evidencias comerciales
- `src/pages/ReviewsPage.tsx` — Revisiones y aprobaciones
- `src/pages/ResultsPage.tsx` — Resultados y métricas
- `src/pages/ImportExportPage.tsx` — Importaciones y exportaciones
- `src/pages/SettingsPage.tsx` — Configuración

### Backend (Go) — Referencia
- `migrations/001_initial_schema.sql` — Esquema de base de datos

### Documentación
- `README.md`
- `docs/DEPLOY_VERCEL.md`
- `docs/ARQUITECTURA.md`
- `docs/FORMATO_CSV.md`
- `docs/VERIFICACION.md`
- `docs/PROCEDENCIA.md` (este archivo)

## Dependencias y licencias

### Frontend (package.json)

| Paquete | Licencia | Uso |
|---------|----------|-----|
| `react` | MIT | UI framework |
| `react-dom` | MIT | Renderizado DOM |
| `react-router-dom` | MIT | Enrutamiento |
| `lucide-react` | ISC | Iconos |
| `date-fns` | MIT | Manipulación de fechas |
| `uuid` | MIT | Generación de IDs |
| `framer-motion` | MIT | Animaciones |
| `recharts` | MIT | Gráficos |
| `@dnd-kit/*` | MIT | Drag & drop |
| `tailwindcss` | MIT | CSS utility-first |
| `vite` | MIT | Build tool |
| `typescript` | Apache-2.0 | Tipado |

### Backend Go (previsto)

| Paquete | Licencia | Uso |
|---------|----------|-----|
| `stdlib` | BSD | Base del lenguaje |
| `pgx` | MIT | Driver PostgreSQL |
| `chi` | MIT | Router HTTP |

## Ausencia de acceso a fuentes no disponibles

- No se ha accedido a la Biblioteca de ChatGPT ni a proyectos externos
- No se han utilizado archivos de PYME OS, ATIENDE ni otros proyectos
- No se han copiado interfaces de plataformas publicitarias
- No se han inventado APIs ni endpoints de servicios externos
- Todo el código es original para este proyecto
