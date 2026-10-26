#!/bin/bash
# GAGO CAMPAIGN OS — Script de despliegue en Vercel
# Equipo: manuelgagoeduextrem-7548
# Prof. Manuel GAGO FERNÁNDEZ

set -e

echo "═══════════════════════════════════════════════════════════"
echo "  GAGO CAMPAIGN OS — Despliegue en Vercel"
echo "  Equipo: manuelgagoeduextrem-7548"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Paso 1: Verificar dependencias
echo "▶ Paso 1: Verificar dependencias..."
command -v node >/dev/null 2>&1 || { echo "❌ Node.js no instalado. Instale desde https://nodejs.org"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm no instalado."; exit 1; }
command -v vercel >/dev/null 2>&1 || { echo "❌ Vercel CLI no instalado."; echo "  Ejecute: npm install -g vercel"; exit 1; }
echo "  ✅ Dependencias OK"
echo ""

# Paso 2: Instalar dependencias del frontend
echo "▶ Paso 2: Instalar dependencias..."
npm install
echo "  ✅ Dependencias instaladas"
echo ""

# Paso 3: Verificar compilación
echo "▶ Paso 3: Verificar compilación..."
npm run build
echo "  ✅ Compilación exitosa"
echo ""

# Paso 4: Login en Vercel
echo "▶ Paso 4: Iniciar sesión en Vercel..."
echo "  Si ya tiene sesión activa, se saltará este paso."
vercel login --team manuelgagoeduextrem-7548
echo ""

# Paso 5: Desplegar
echo "▶ Paso 5: Desplegar en Vercel..."
echo ""
echo "  Opciones de despliegue:"
echo "  ─────────────────────────────────────────────────────────"
echo "  a) vercel                    → Despliegue de preview"
echo "  b) vercel --prod             → Despliegue de producción"
echo "  c) vercel --team manuelgagoeduextrem-7548  → Equipo específico"
echo ""
echo "  Comando recomendado:"
echo "  vercel --prod --team manuelgagoeduextrem-7548"
echo ""

# Paso 6: Configurar variables de entorno
echo "▶ Paso 6: Configurar variables de entorno..."
echo ""
echo "  Ejecute los siguientes comandos:"
echo "  ─────────────────────────────────────────────────────────"
echo ""
echo "  vercel env add APP_ORIGIN production"
echo "  # Introduzca la URL de su proyecto (ej: https://gago-campaign-os.vercel.app)"
echo ""
echo "  vercel env add APP_ENV production"
echo "  # Introduzca: production"
echo ""
echo "  vercel env add SESSION_TTL_HOURS production"
echo "  # Introduzca: 24"
echo ""
echo "  vercel env add DATABASE_URL production"
echo "  # Introduzca la cadena de conexión de Neon/Supabase"
echo ""

# Paso 7: Base de datos
echo "▶ Paso 7: Configurar base de datos PostgreSQL..."
echo ""
echo "  Opciones recomendadas:"
echo "  ─────────────────────────────────────────────────────────"
echo "  1. Neon (https://neon.tech) — PostgreSQL serverless, gratuito"
echo "  2. Supabase (https://supabase.com) — PostgreSQL gestionado"
echo "  3. Railway (https://railway.app) — PostgreSQL con plan gratuito"
echo ""
echo "  Después de crear la base de datos:"
echo "  psql \$DATABASE_URL < migrations/001_initial_schema.sql"
echo ""

# Paso 8: Crear administrador
echo "▶ Paso 8: Crear primer administrador..."
echo ""
echo "  go run cmd/create-admin/main.go \\"
echo "    --email admin@su-dominio.com \\"
echo "    --name 'Prof. Manuel GAGO FERNÁNDEZ' \\"
echo "    --org 'GAGO Campaign OS'"
echo ""

echo "═══════════════════════════════════════════════════════════"
echo "  Despliegue preparado. Siga los pasos anteriores."
echo "═══════════════════════════════════════════════════════════"
