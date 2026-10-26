# GAGO CAMPAIGN OS

**Sistema operativo para gestión de campañas publicitarias**

Prof. Manuel GAGO FERNÁNDEZ

---

## Qué hace

GAGO CAMPAIGN OS es una herramienta para:

- Organizar productos y servicios
- Preparar campañas publicitarias
- Redactar anuncios con control de versiones
- Reunir evidencias de afirmaciones comerciales
- Solicitar revisión y aprobación de expedientes
- Exportar expedientes (JSON, CSV, HTML)
- Importar resultados reales desde CSV
- Calcular métricas (CTR, CPC, CPM, CPA, ROAS)

**Recorrido completo:** Producto → Campaña → Anuncios → Evidencias → Revisión → Aprobación → Exportación → Resultados.

## Qué NO está integrado

- Publicación automática en plataformas publicitarias
- Validación de certificados digitales UE (requisito futuro)
- Integración con proveedores de IA (interfaz preparada, desactivada)
- Generación de PDF desde servidor (se usa impresión del navegador)
- Almacenamiento de objetos persistente (solo referencias HTTPS)

## Requisitos

- Node.js 18+ (solo para construir el frontend)
- Go 1.21+ (para el backend)
- PostgreSQL 14+ (para persistencia)

## Instalación

```bash
# Clonar repositorio
git clone <url>
cd gago-campaign-os

# Frontend
cd frontend
npm install
npm run dev

# Backend (en otra terminal)
cd ..
go mod download
go run cmd/server/main.go
```

## Desarrollo local

```bash
# Frontend con hot-reload
cd frontend && npm run dev

# Backend con hot-reload (air)
go install github.com/air-verse/air@latest
air
```

## Base de datos

### Variables de entorno

```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/gago_campaigns
APP_ORIGIN=http://localhost:3000
APP_ENV=development
SESSION_TTL_HOURS=24
```

### Migraciones

```bash
# Aplicar migraciones
psql $DATABASE_URL < migrations/001_initial_schema.sql
```

### Crear primer administrador

```bash
go run cmd/create-admin/main.go \
  --email admin@empresa.com \
  --name "Prof. Manuel GAGO FERNÁNDEZ" \
  --org "Mi Organización"
```

El comando solicita la contraseña de forma interactiva. No se almacena en texto plano.

## Pruebas

```bash
# Frontend
cd frontend && npm run typecheck

# Backend
go test ./...
```

## Build

```bash
cd frontend && npm run build
```

El resultado se genera en `frontend/dist/`.

## Despliegue

Ver [docs/DEPLOY_VERCEL.md](docs/DEPLOY_VERCEL.md) para instrucciones de despliegue en Vercel con funciones Go.

## Arquitectura

Ver [docs/ARQUITECTURA.md](docs/ARQUITECTURA.md) para diagramas y decisiones técnicas.

## Licencia

Software propietario. Todos los derechos reservados. Prof. Manuel GAGO FERNÁNDEZ.

---

*Nota: Este repositorio contiene el frontend funcional en modo demostración. El backend Go y las migraciones SQL están incluidos como referencia para despliegue completo con PostgreSQL.*
