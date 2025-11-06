# 🚀 Setup do Clube do Grito - Build Android Automático

## ✅ O que já está pronto:

- ✅ Capacitor instalado e configurado
- ✅ Projeto Android completo na pasta `android/`
- ✅ GitHub Actions configurado (.github/workflows/android-build.yml)
- ✅ Package: `com.institutoogrito.clubedogrito`
- ✅ Versão: 1.0.0 (versionCode: 1)
- ✅ SDK mínimo: Android 7.0 (API 24)
- ✅ SDK alvo: Android 15 (API 35)

---

## 📋 Passo a passo para criar o repositório:

### 1. Criar novo repositório no GitHub

```bash
# No GitHub.com, crie um novo repositório chamado:
clubedogrito-android
```

### 2. Preparar arquivos para commit

```bash
# Copiar arquivos essenciais para nova pasta
mkdir clubedogrito-android
cd clubedogrito-android

# Copiar do projeto original:
cp -r ../android ./
cp -r ../.github ./
cp ../capacitor.config.ts ./
cp ../package.json ./
cp ../package-lock.json ./
cp ../.gitignore.android ./.gitignore

# Copiar código fonte
cp -r ../client ./
cp -r ../server ./
cp -r ../shared ./
cp -r ../public ./

# Copiar configurações
cp ../vite.config.ts ./
cp ../tsconfig.json ./
cp ../tailwind.config.ts ./
cp ../postcss.config.js ./
cp ../components.json ./
```

### 3. Inicializar Git e fazer primeiro commit

```bash
git init
git add .
git commit -m "Initial commit - Clube do Grito Android"
```

### 4. Conectar ao repositório GitHub

```bash
# Substitua SEU_USUARIO pelo seu usuário do GitHub
git remote add origin https://github.com/SEU_USUARIO/clubedogrito-android.git
git branch -M main
git push -u origin main
```

### 5. Aguardar o build automático! 🎉

- Vá em: **Actions** no GitHub
- Você verá o workflow "Build Android APK/AAB" rodando
- Aguarde ~5-10 minutos
- Baixe os artefatos gerados!

---

## 📦 Como baixar o .aab gerado:

1. Vá em **Actions** > última execução com ✅
2. Role até **Artifacts**
3. Baixe:
   - `android-release-aab` ← **Este é o arquivo para Play Store!**
   - `sha256-checksum` ← Hash de verificação
   - `android-release-apk` ← Para testes locais

---

## 🔐 (OPCIONAL) Adicionar assinatura automática:

Se quiser que o GitHub assine automaticamente:

### 1. Preparar keystore em base64:

```bash
# Se você tem o keystore:
base64 upload-keystore.jks > keystore.txt

# Copie o conteúdo de keystore.txt
```

### 2. Adicionar secrets no GitHub:

- Vá em: **Settings** > **Secrets and variables** > **Actions**
- Clique em **New repository secret**
- Adicione:
  - `KEYSTORE_BASE64` = conteúdo do keystore.txt
  - `KEYSTORE_PASSWORD` = 123456 (ou sua senha)
  - `KEY_ALIAS` = upload
  - `KEY_PASSWORD` = 123456 (ou sua senha)

### 3. Descomentar seção de assinatura no workflow

Edite `.github/workflows/android-build.yml` e descomente as linhas de assinatura.

---

## 🎯 Resultado Final:

Toda vez que você fizer `git push`, o GitHub:
- ✅ Builda o app automaticamente
- ✅ Gera o .aab assinado
- ✅ Gera SHA256
- ✅ Disponibiliza para download

**Upload direto na Play Console!** 🚀

---

## ❓ Problemas?

- Build falhou? Verifique os logs em Actions
- .aab não gerado? Veja se o workflow completou 100%
- Erro de assinatura? Verifique os secrets no GitHub

---

## 📱 Testando o APK localmente:

```bash
# Baixe o android-release-apk
# Instale no celular:
adb install app-release-unsigned.apk
```

---

**Pronto! Seu app está configurado para builds automáticos! 🎉**
