# Despliegue en Vercel — GAGO CAMPAIGN OS

## Equipo Vercel

**Nombre del equipo:** `manuelgagoeduextrem-7548`

## Estado de preparación

✅ **Frontend:** Compilado y verificado (Vite + React + TypeScript)
✅ **API Go:** Estructura base preparada en `/api/index.go`
✅ **Migraciones SQL:** Completas en `/migrations/001_initial_schema.sql`
✅ **Configuración Vercel:** `vercel.json` configurado
✅ **Documentación:** Completa

⏳ **Pendiente:** Ejecutar despliegue real con credenciales de Vercel

## Despliegue rápido (5 pasos)

## Configuración de Vercel

### vercel.json (raíz del repositorio)

```json
{
  "buildCommand": "cd frontend && npm run build",
  "outputDirectory": "frontend/dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/api/:path*", "destination": "/api" },
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "functions": {
    "api/**/*.go": {
      "runtime": "@vercel/go@3.0.0"
    }
  }
}
```

### Estructura de funciones Go para Vercel

```
api/
  health.go          → GET /api/health
  auth/
    login.go         → POST /api/auth/login
    logout.go        → POST /api/auth/logout
    me.go            → GET /api/auth/me
  products/
    index.go         → GET/POST /api/products
    [id].go          → GET/PUT/DELETE /api/products/:id
  campaigns/
    index.go         → GET/POST /api/campaigns
    [id].go          → GET/PUT/DELETE /api/campaigns/:id
  ... (resto de endpoints)
```

### Variables de entorno en Vercel

Configurar en el panel de Vercel → Settings → Environment Variables:

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | Cadena de conexión PostgreSQL | `postgresql://user:pass@host:5432/db` |
| `APP_ORIGIN` | URL pública de la aplicación | `https://mi-app.vercel.app` |
| `APP_ENV` | Entorno | `production` |
| `SESSION_TTL_HOURS` | Duración de sesión | `24` |

### Base de datos

Opciones compatibles con Vercel:
- **Neon** (PostgreSQL serverless, recomendado para Vercel)
- **Supabase** (PostgreSQL gestionado)
- **Railway** (PostgreSQL)
- Instancia propia con acceso público

### Migraciones

Ejecutar manualmente antes del primer despliegue:

```bash
psql $DATABASE_URL < migrations/001_initial_schema.sql
```

No ejecutar migraciones automáticamente en cada petición de función.

### Crear administrador inicial

```bash
# Desde local, conectando a la base de datos remota
go run cmd/create-admin/main.go --email admin@empresa.com --name "Admin" --org "Mi Org"
```

### Verificación posterior al despliegue

1. Acceder a la URL pública → debe mostrar la pantalla de login
2. `GET /api/health` → debe devolver `{"status":"ok"}` sin revelar información interna
3. Iniciar sesión con las credenciales del administrador
4. Crear un producto de prueba
5. Crear una campaña vinculada al producto
6. Verificar que los datos persisten tras recargar

## Limitaciones conocidas

- Las funciones serverless de Vercel tienen un límite de ejecución (10s hobby, 60s pro)
- No se pueden mantener procesos persistentes en segundo plano
- Las importaciones grandes deben tener tamaño acotado
- No hay sistema de archivos persistente (solo la base de datos)
- Las conexiones a PostgreSQL deben usar pool o conexiones efímeras

## Separación Preview / Production

- **Preview**: se despliega en cada PR. Usar una base de datos de pruebas.
- **Production**: solo desde la rama principal. Base de datos de producción.

Configurar `DATABASE_URL` diferente para cada entorno en Vercel.

---

## Despliegue paso a paso (equipo manuelgagoeduextrem-7548)

### 1. Instalar Vercel CLI

```bash
npm install -g vercel
```

### 2. Login en Vercel

```bash
vercel login
```

### 3. Desplegar preview (primera vez)

```bash
vercel --team manuelgagoeduextrem-7548
```

Esto creará un proyecto en Vercel y le dará una URL temporal.

### 4. Configurar variables de entorno

```bash
# Ir al panel de Vercel → su proyecto → Settings → Environment Variables
# O usar CLI:

vercel env add APP_ORIGIN production
# Introduzca: https://su-proyecto.vercel.app

vercel env add APP_ENV production
# Introduzca: production

vercel env add SESSION_TTL_HOURS production
# Introduzca: 24

vercel env add DATABASE_URL production
# Introduzca la cadena de conexión de Neon
```

### 5. Crear base de datos Neon

Ver [docs/CONFIG_NEON.md](CONFIG_NEON.md) para instrucciones detalladas.

Resumen rápido:
1. Crear cuenta en https://neon.tech
2. Crear proyecto `gago-campaign-os`
3. Copiar cadena de conexión
4. Aplicar migraciones: `psql $DATABASE_URL < migrations/001_initial_schema.sql`

### 6. Desplegar a producción

```bash
vercel --prod --team manuelgagoeduextrem-7548
```

### 7. Crear primer administrador

```bash
go run cmd/create-admin/main.go \
  --email admin@su-dominio.com \
  --name "Prof. Manuel GAGO FERNÁNDEZ" \
  --org "GAGO Campaign OS"
```

### 8. Verificar despliegue

```bash
# Health check
curl https://su-proyecto.vercel.app/api/health
# Esperado: {"status":"ok","timestamp":"...","version":"1.0.0"}

# Frontend
open https://su-proyecto.vercel.app
# Debe mostrar la pantalla de login
```

## Estructura de archivos para Vercel

```
/
├── api/
│   └── index.go              → Función serverless Go (GET /api/*)
├── dist/                     → Frontend compilado (output de Vite)
├── migrations/
│   └── 001_initial_schema.sql
├── vercel.json               → Configuración de Vercel
├── package.json              → Dependencias frontend
└── ...
```

## Variables de entorno requeridas

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | Cadena de conexión PostgreSQL | `postgresql://user:pass@host/db?sslmode=require` |
| `APP_ORIGIN` | URL pública (para CORS) | `https://gago-campaign-os.vercel.app` |
| `APP_ENV` | Entorno | `production` |
| `SESSION_TTL_HOURS` | Duración sesión | `24` |

## Troubleshooting

### Error: "Function failed to compile"

- Verifique que `api/index.go` tiene `package handler`
- Verifique que `vercel.json` tiene la configuración correcta

### Error: "Database connection failed"

- Verifique que `DATABASE_URL` está configurada en Vercel
- Verifique que las migraciones se aplicaron correctamente
- Verifique que Neon permite conexiones desde Vercel (IPs)

### Error: "CORS blocked"

- Verifique que `APP_ORIGIN` coincide con la URL de Vercel
- Verifique que la función Go establece los headers CORS

## Comandos útiles

```bash
# Ver logs en tiempo real
vercel logs --team manuelgagoeduextrem-7548

# Listar despliegues
vercel ls --team manuelgagoeduextrem-7548

# Eliminar despliegue
vercel rm <deployment-url> --team manuelgagoeduextrem-7548

# Promover preview a producción
vercel promote <deployment-url> --team manuelgagoeduextrem-7548
```
