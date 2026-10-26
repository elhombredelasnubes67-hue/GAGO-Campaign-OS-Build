# 🚀 Guía rápida de inicio — GAGO CAMPAIGN OS

## Para desplegar en 10 minutos

### Requisitos previos

- Node.js 18+ instalado → https://nodejs.org
- Cuenta en Vercel → https://vercel.com (unirse al equipo `manuelgagoeduextrem-7548`)
- Cuenta en Neon → https://neon.tech (PostgreSQL gratuito)

---

### Paso 1: Clonar y preparar

```bash
git clone <url-del-repositorio>
cd gago-campaign-os
npm install
```

### Paso 2: Crear base de datos Neon

1. Vaya a https://neon.tech → "New Project"
2. Nombre: `gago-campaign-os`
3. Copie la cadena de conexión (empieza con `postgresql://...`)
4. Aplique las migraciones:

```bash
psql "SU_CADENA_DE_CONEXION" < migrations/001_initial_schema.sql
```

### Paso 3: Desplegar en Vercel

```bash
# Instalar Vercel CLI
npm install -g vercel

# Login
vercel login

# Primer despliegue (preview)
vercel --team manuelgagoeduextrem-7548
```

### Paso 4: Configurar variables

En el panel de Vercel → su proyecto → Settings → Environment Variables:

| Variable | Valor |
|----------|-------|
| `DATABASE_URL` | Cadena de Neon |
| `APP_ORIGIN` | URL del proyecto en Vercel |
| `APP_ENV` | `production` |
| `SESSION_TTL_HOURS` | `24` |

O con CLI:

```bash
vercel env add DATABASE_URL production
vercel env add APP_ORIGIN production
vercel env add APP_ENV production
vercel env add SESSION_TTL_HOURS production
```

### Paso 5: Desplegar a producción

```bash
vercel --prod --team manuelgagoeduextrem-7548
```

### Paso 6: Crear administrador

```bash
go run cmd/create-admin/main.go \
  --email admin@su-dominio.com \
  --name "Prof. Manuel GAGO FERNÁNDEZ" \
  --org "GAGO Campaign OS"
```

### ✅ Listo

Acceda a la URL de Vercel e inicie sesión.

---

## Modo demostración (sin base de datos)

Si solo quiere probar la interfaz sin configurar PostgreSQL:

```bash
npm install
npm run dev
```

Abra http://localhost:3000 y haga clic en "Entrar en modo demostración".

Los datos se almacenan en memoria y se pierden al recargar.

---

## Estructura del proyecto

```
gago-campaign-os/
├── api/index.go              → Backend Go para Vercel
├── src/                      → Frontend React
│   ├── pages/                → Páginas de la aplicación
│   ├── components/           → Componentes reutilizables
│   └── lib/                  → Store, tipos, utilidades
├── migrations/               → SQL para PostgreSQL
├── docs/                     → Documentación técnica
├── vercel.json               → Configuración de Vercel
└── deploy.sh                 → Script de despliegue
```

## Soporte

- Documentación completa en `/docs`
- Arquitectura en `docs/ARQUITECTURA.md`
- Despliegue en `docs/DEPLOY_VERCEL.md`
- Base de datos en `docs/CONFIG_NEON.md`
