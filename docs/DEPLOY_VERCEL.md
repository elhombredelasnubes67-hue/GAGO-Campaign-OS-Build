# Despliegue en Vercel — GAGO CAMPAIGN OS

## Estado de verificación

Esta documentación describe la configuración prevista. **No se ha verificado el despliegue automático** porque no se dispone de credenciales de Vercel, GitHub ni PostgreSQL en este entorno.

Los comandos y archivos de configuración están preparados para su ejecución manual.

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
