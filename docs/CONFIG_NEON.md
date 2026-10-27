# Configuración de PostgreSQL con Neon — GAGO CAMPAIGN OS

## Por qué Neon

- **Serverless**: Escala automáticamente, compatible con Vercel
- **Gratis**: Plan gratuito con 0.5 GB de almacenamiento
- **Rápido**: Branching para desarrollo/preview
- **Seguro**: Conexión SSL obligatoria

## Paso 1: Crear cuenta en Neon

1. Visite https://neon.tech
2. Regístrese con GitHub (recomendado) o email
3. Verifique su cuenta

## Paso 2: Crear proyecto

1. En el panel de Neon, haga clic en "New Project"
2. Nombre: `gago-campaign-os`
3. Región: Elija la más cercana (ej: `Europe West (Ireland)`)
4. Haga clic en "Create Project"

## Paso 3: Obtener cadena de conexión

1. En la página del proyecto, busque "Connection Details"
2. Copie la cadena de conexión en formato:
   ```
   postgresql://user:password@ep-cool-name-123456.eu-central-1.aws.neon.tech/dbname?sslmode=require
   ```

## Paso 4: Aplicar migraciones

### Opción A: Desde terminal local

```bash
# Instalar psql si no lo tiene
# macOS: brew install postgresql
# Ubuntu: sudo apt install postgresql-client
# Windows: https://www.postgresql.org/download/windows/

# Aplicar migraciones
psql "postgresql://user:password@ep-cool-name-123456.eu-central-1.aws.neon.tech/dbname?sslmode=require" < migrations/001_initial_schema.sql
```

### Opción B: Desde SQL Editor de Neon

1. En Neon, vaya a "SQL Editor"
2. Copie el contenido de `migrations/001_initial_schema.sql`
3. Pegue y ejecute

## Paso 5: Configurar en Vercel

```bash
# Añadir variable de entorno en Vercel
vercel env add DATABASE_URL production
# Pegue la cadena de conexión de Neon cuando se solicite

# Repetir para preview y development si lo desea
vercel env add DATABASE_URL preview
vercel env add DATABASE_URL development
```

## Paso 6: Crear primer administrador

```bash
# Conecte a la base de datos
psql "postgresql://user:password@ep-cool-name-123456.eu-central-1.aws.neon.tech/dbname?sslmode=require"

# Ejecute el comando de creación de administrador
go run cmd/create-admin/main.go \
  --email admin@su-dominio.com \
  --name "Prof. Manuel GAGO FERNÁNDEZ" \
  --org "GAGO Campaign OS"
```

## Paso 7: Verificar conexión

Después del despliegue, verifique que la API puede conectarse:

```bash
curl https://su-proyecto.vercel.app/api/health
# Debe devolver: {"status":"ok","timestamp":"...","version":"1.0.0"}
```

## Alternativas a Neon

### Supabase

1. Visite https://supabase.com
2. Cree un proyecto nuevo
3. Vaya a Settings → Database
4. Copie "Connection string" → "URI"
5. Use esa cadena en `DATABASE_URL`

### Railway

1. Visite https://railway.app
2. Cree un proyecto nuevo
3. Añada PostgreSQL como servicio
4. Copie la variable `DATABASE_URL`
5. Use esa cadena en Vercel

## Seguridad

- **Nunca** suba `DATABASE_URL` a Git
- Use variables de entorno de Vercel (encriptadas)
- Rotación de contraseñas periódica recomendada
- Active 2FA en Neon/Supabase/Railway

## Costes

| Proveedor | Plan gratuito | Límites |
|-----------|--------------|---------|
| Neon | 0.5 GB almacenamiento | 1 proyecto, branching limitado |
| Supabase | 0.5 GB almacenamiento | 2 proyectos, 50 MB upload |
| Railway | $5 crédito/mes | Sin límites fijos |

Para uso en producción con tráfico moderado, cualquier proveedor es suficiente inicialmente.
