#!/bin/bash
# Script para verificar configuración de Netlify antes del deployment

echo "🔍 Verificando configuración de Netlify..."

# Verificar archivos necesarios
echo "📁 Verificando archivos de configuración..."

if [ -f "public/_redirects" ]; then
    echo "✅ _redirects encontrado"
else
    echo "❌ _redirects NO encontrado"
    exit 1
fi

if [ -f "netlify.toml" ]; then
    echo "✅ netlify.toml encontrado"
else
    echo "❌ netlify.toml NO encontrado"
    exit 1
fi

# Verificar estructura del proyecto
echo "📦 Verificando estructura del proyecto..."

if [ -f "package.json" ]; then
    echo "✅ package.json encontrado"
else
    echo "❌ package.json NO encontrado"
    exit 1
fi

if [ -f "index.html" ]; then
    echo "✅ index.html encontrado"
else
    echo "❌ index.html NO encontrado"
    exit 1
fi

if [ -f "vite.config.ts" ]; then
    echo "✅ vite.config.ts encontrado"
else
    echo "❌ vite.config.ts NO encontrado"
    exit 1
fi

# Verificar comandos de build
echo "🔨 Verificando comandos de build..."

if grep -q '"build".*"tsc -b && vite build"' package.json; then
    echo "✅ Comando de build correcto"
else
    echo "⚠️  Verificar comando de build en package.json"
fi

# Verificar directorio de output
echo "📤 Verificando configuración de output..."

if [ -d "dist" ]; then
    echo "✅ Directorio dist existe"
elif [ -d "build" ]; then
    echo "⚠️  Directorio build existe (verificar config en netlify.toml)"
else
    echo "ℹ️  Directorio de build se creará durante el deployment"
fi

# Test de build local (opcional)
echo "🧪 ¿Ejecutar test de build local? (y/N)"
read -r response
if [[ "$response" =~ ^[Yy]$ ]]; then
    echo "🔄 Ejecutando npm run build..."
    npm run build
    
    if [ $? -eq 0 ]; then
        echo "✅ Build local exitoso"
        
        if [ -d "dist" ]; then
            echo "📊 Archivos generados en dist:"
            ls -la dist/
        fi
    else
        echo "❌ Error en build local"
        exit 1
    fi
fi

echo "🎉 Verificación completada. El proyecto está listo para Netlify!"
echo ""
echo "📝 Pasos para deployment en Netlify:"
echo "1. Conectar repositorio en Netlify Dashboard"
echo "2. Configurar variables de entorno (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)"
echo "3. Deploy automático activado"
echo ""
echo "🔗 URLs importantes después del deployment:"
echo "   - Dashboard: https://tu-app.netlify.app/dashboard"
echo "   - Evaluaciones: https://tu-app.netlify.app/evaluation/[token]"