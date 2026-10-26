# Arquitectura — GAGO CAMPAIGN OS

## Componentes

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (Vite)                    │
│  React + TypeScript + Tailwind CSS                    │
│  Páginas: Dashboard, Productos, Campañas, Anuncios,  │
│           Evidencias, Revisiones, Resultados,         │
│           Importar/Exportar, Configuración            │
└──────────────────────┬──────────────────────────────┘
                       │ /api/*
┌──────────────────────▼──────────────────────────────┐
│                  Backend (Go)                         │
│  api/         → Handlers HTTP                        │
│  internal/    → Lógica de negocio                    │
│    auth/      → Autenticación y sesiones             │
│    campaigns/ → Gestión de campañas                  │
│    products/  → Productos y servicios                │
│    creatives/ → Anuncios y versiones                 │
│    evidence/  → Evidencias comerciales               │
│    approvals/ → Revisiones y aprobaciones            │
│    metrics/   → Importación y cálculo de métricas    │
│    exports/   → Generación de exportaciones          │
│    audit/     → Registro de eventos                  │
│    database/  → Conexión y consultas                 │
│    http/      → Middleware y utilidades              │
└──────────────────────┬──────────────────────────────┘
                       │ SQL parametrizado
┌──────────────────────▼──────────────────────────────┐
│                 PostgreSQL                            │
│  organizations, users, sessions, products,           │
│  campaigns, creatives, evidence_records,             │
│  review_requests, metric_rows, audit_events...       │
└─────────────────────────────────────────────────────┘
```

## Flujo de datos

1. **Usuario** interactúa con el frontend React
2. **Frontend** envía peticiones HTTP a `/api/*`
3. **Backend Go** valida, autoriza y procesa
4. **PostgreSQL** persiste los datos
5. **Respuesta JSON** vuelve al frontend

## Autenticación

- Login con email + contraseña
- Contraseñas con Argon2id
- Sesiones persistentes en base de datos
- Cookie HttpOnly, Secure (producción), SameSite=Lax
- CSRF token para operaciones de escritura
- Caducidad configurable (SESSION_TTL_HOURS)
- Revocación explícita de sesiones

## Aislamiento

- Cada recurso tiene `organization_id`
- Todas las consultas filtran por organización del usuario
- Los IDs de recursos no constituyen autorización
- La autorización se verifica en el servidor, no solo en la interfaz

## Decisiones técnicas

| Decisión | Justificación |
|----------|--------------|
| Go para backend | Rendimiento, tipado fuerte, compilación a binario único |
| PostgreSQL | Fiabilidad, integridad referencial, NUMERIC para dinero |
| UUIDs como PK | Evita enumeración, compatible con distribución |
| Versiones explícitas | Trazabilidad de cambios, control de concurrencia |
| Hash SHA-256 de instantáneas | Detección de cambios post-revisión |
| Importes en unidades menores | Evita errores de coma flotante |
| Sin localStorage como BD | No es fiable ni persistente entre dispositivos |
| Plantillas locales para generación | Funciona sin claves de IA, determinista |

## Límites

- No hay publicación automática en plataformas publicitarias
- No hay validación de certificados digitales UE
- No hay integración con proveedores de IA activa
- No hay generación de PDF desde servidor
- No hay almacenamiento de archivos binarios persistente
- Las funciones serverless tienen límites de tiempo y memoria
- No se mantienen procesos en segundo plano
