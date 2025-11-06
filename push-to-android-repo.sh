#!/bin/bash

echo "🚀 Preparando push para repositório Android..."
echo ""

# 1. Copiar .gitignore correto
echo "📋 Copiando .gitignore..."
cp .gitignore.android .gitignore

# 2. Remover remote antigo e adicionar novo
echo "🔗 Configurando novo repositório remoto..."
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/DevGrito/app_playstore_abb.git

# 3. Verificar se há mudanças
echo "📝 Verificando mudanças..."
git status

# 4. Adicionar arquivos essenciais para Android
echo "➕ Adicionando arquivos..."
git add .github/workflows/
git add capacitor.config.ts
git add android/
git add package.json package-lock.json
git add client/ server/ shared/ public/
git add vite.config.ts tsconfig.json
git add tailwind.config.ts postcss.config.js
git add components.json
git add SETUP_GITHUB.md
git add .gitignore

# 5. Fazer commit
echo "💾 Criando commit..."
git commit -m "Initial commit - Clube do Grito Android com GitHub Actions

- Capacitor configurado (com.institutoogrito.clubedogrito)
- Projeto Android completo (minSdk 24, targetSdk 35)
- GitHub Actions para build automático do .aab
- Documentação de setup incluída" || echo "⚠️  Nenhuma mudança para commitar (pode ser que já esteja commitado)"

# 6. Configurar branch main
echo "🌿 Configurando branch main..."
git branch -M main

# 7. Fazer push
echo "🚀 Fazendo push para GitHub..."
git push -u origin main --force

echo ""
echo "✅ PRONTO! Acesse:"
echo "   https://github.com/DevGrito/app_playstore_abb"
echo ""
echo "🤖 O GitHub Actions iniciará automaticamente!"
echo "   https://github.com/DevGrito/app_playstore_abb/actions"
