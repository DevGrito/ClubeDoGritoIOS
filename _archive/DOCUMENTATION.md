# Clube do Grito - Documentação Completa

## 📋 Visão Geral

**Clube do Grito** é uma plataforma de gestão educacional e impacto social desenvolvida para o **Instituto O Grito**. A plataforma oferece funcionalidades completas para gerenciar estudantes, professores, conselheiros, administradores e doadores, com foco em acompanhamento de atividades educacionais, doações financeiras, vendas de ingressos para eventos e relatórios de impacto social.

### Missão
Potencializar o impacto social através da tecnologia, oferecendo ferramentas para gestão eficiente de programas educacionais e sociais.

---

## 🎯 Principais Funcionalidades

### 1. Sistema de Ingressos Digital
- **Venda de ingressos** com QR Code único
- **Pagamento integrado** via PIX e Stripe (cartão de crédito)
- **Sistema de cotas corporativas** para empresas patrocinadoras
- **Busca inteligente** por telefone/email com normalização automática
- **Validação e resgate** de ingressos via QR Code scanner
- **Download de PDF** com ingresso após pagamento confirmado

### 2. Dashboard Financeiro Consolidado
- **Visualização por departamento**: Psicossocial, Negócios Sociais, Inclusão Produtiva, Esporte & Cultura
- **Comparativo META vs REALIZADO** mensal e anual
- **Gráficos interativos** de receitas e despesas
- **Dados sincronizados** entre Digital Ocean PostgreSQL e Replit (Neon)

### 3. Gestão de Programas Educacionais

#### Casa Sonhar (Psicossocial)
- Acompanhamento de famílias vulneráveis
- Atendimentos individuais (Método Grito)
- Vínculo com programas de Inclusão Produtiva e PEC

#### Polo Esportivo Cultural (PEC)
- Gestão de atividades esportivas e culturais
- Controle de frequência
- Vínculo com famílias do Psicossocial

#### Inclusão Produtiva
- Gestão de participantes e cursos
- Laboratório Vozes do Futuro
- Cursos presenciais e EAD
- Indicadores mensais de frequência e desempenho

### 4. Sistema de Patrocinadores
- Cadastro de patrocinadores por categoria (Bronze, Silver, Gold, Master, Diamante, Oficial)
- Gestão de contratos e projetos ativos
- Dashboard com estatísticas e investimentos
- **Dados filtrados por ano** (ex: patrocinadores de 2024)

### 5. Sistema de Doações
- Integração com **Stripe** para doações recorrentes
- Sincronização automática de status de assinaturas
- CRM de doadores com histórico completo
- Dashboard com métricas de arrecadação

### 6. Controle de Acesso por Perfil
- **Leo Martins**: Acesso administrativo completo
- **Conselheiros**: Visualização de métricas institucionais
- **Professores**: Gestão de alunos e frequência
- **Alunos**: Dashboard pessoal com progresso
- **Desenvolvedores**: Painel especial para testes e gestão

### 7. Progressive Web App (PWA)
- **Instalável** em dispositivos móveis e desktop
- **Offline-first** com Service Worker
- **Cache inteligente** para performance
- **Ícones e temas** personalizados

---

## 🛠️ Stack Tecnológico

### Frontend
- **React 18** - Framework UI
- **TypeScript** - Type safety
- **Vite** - Build tool e dev server
- **Wouter** - Roteamento client-side
- **TanStack Query v5** - Gerenciamento de estado assíncrono
- **Tailwind CSS** - Estilização utility-first
- **Shadcn/UI** - Componentes UI acessíveis
- **Radix UI** - Primitivos de componentes
- **Recharts** - Gráficos e visualizações
- **React Hook Form** - Formulários controlados
- **Zod** - Validação de schemas

### Backend
- **Node.js** - Runtime
- **Express.js** - Framework web
- **TypeScript** - Type safety
- **Drizzle ORM** - ORM type-safe
- **PostgreSQL** - Banco de dados relacional
  - **Digital Ocean PostgreSQL** (143.198.136.16:5433) - Produção
  - **Neon PostgreSQL** - Desenvolvimento/Replit

### Integrações Externas
- **Stripe** - Pagamentos e assinaturas recorrentes
- **Twilio** - SMS e autenticação por telefone
- **Google Cloud Storage** - Armazenamento de arquivos
- **Google Slides API** - Geração de relatórios em PDF

### DevOps e Ferramentas
- **Drizzle Kit** - Migrations e schema management
- **VitePWA** - Progressive Web App
- **Node Cron** - Tarefas agendadas
- **Workbox** - Service Worker e cache

---

## 🏗️ Arquitetura

### Estrutura Monorepo
```
clube-do-grito/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── pages/         # Páginas da aplicação
│   │   ├── components/    # Componentes reutilizáveis
│   │   ├── lib/          # Utilidades e configurações
│   │   └── hooks/        # Custom React hooks
│   └── public/           # Assets estáticos
├── server/               # Backend Express
│   ├── routes.ts        # Definição de rotas API
│   ├── storage.ts       # Interface de storage
│   ├── db.ts           # Conexão com banco
│   └── index.ts        # Entry point
├── shared/             # Código compartilhado
│   └── schema.ts      # Schema Drizzle (DB models)
└── attached_assets/   # Assets enviados pelo usuário
```

### Fluxo de Dados
1. **Cliente** faz requisição → React Query
2. **API** Express processa → Validação Zod
3. **Storage** abstração → Drizzle ORM
4. **Database** PostgreSQL → Retorna dados
5. **Cache** TanStack Query → Atualiza UI

### Segurança
- **Autenticação** via telefone + SMS (Twilio)
- **Sessões** armazenadas com express-session
- **Senhas** hasheadas com bcryptjs
- **Secrets** gerenciados via variáveis de ambiente
- **CORS** configurado para produção

---

## 💾 Modelo de Dados

### Principais Entidades

#### Usuários
```typescript
users
├── id (serial)
├── telefone (unique)
├── nome
├── email
├── senha_hash
├── papel (enum: aluno, professor, conselheiro, admin)
└── ativo (boolean)
```

#### Ingressos
```typescript
ingressos
├── id
├── numero (unique)
├── nome_completo
├── telefone
├── email
├── metodo_pagamento (pix, stripe)
├── stripe_checkout_session_id
├── qr_code_data
├── status (pendente, confirmado, resgatado, expirado)
└── resgatado_em
```

#### Patrocinadores
```typescript
patrocinadores
├── id
├── nome
├── categoria (oficial, diamante, master, gold, silver, bronze)
├── tipo (empresa, pessoa_fisica)
├── valor_patrocinio
├── status (ativo, renovacao, pendente, cancelado)
├── data_inicio
└── data_fim
```

#### Financeiro Consolidado
```typescript
financeiro_consolidado
├── id
├── ano
├── mes
├── departamento
├── receita_contas_a_receber
└── despesa_contas_a_pagar
```

#### Metas Mensais
```typescript
conselho_metas_mensais
├── id
├── departamento
├── ano
├── mes (1-12)
├── meta_contas_a_receber
└── meta_contas_a_pagar
```

---

## 🔌 APIs Principais

### Autenticação
- `POST /api/auth/register` - Registro de usuário
- `POST /api/auth/login` - Login com telefone/senha
- `POST /api/auth/logout` - Logout

### Ingressos
- `POST /api/pagamento/stripe` - Criar sessão de pagamento
- `POST /api/pagamento/pix` - Gerar QR Code PIX
- `GET /api/ingresso/search` - Buscar ingresso por telefone/email
- `POST /api/ingresso/validar` - Validar QR Code
- `POST /api/ingresso/resgatar` - Resgatar ingresso

### Cotas Empresas
- `GET /api/cotas-empresas` - Listar cotas disponíveis
- `POST /api/cotas-empresas/validar` - Validar cota antes do pagamento

### Financeiro
- `GET /api/financeiro/consolidado` - Dados consolidados
- `GET /api/financeiro/metas/:departamento` - Metas por departamento

### Patrocinadores
- `GET /api/patrocinadores?ano=2024` - Lista patrocinadores (filtro por ano)

### Gestão à Vista
- `GET /api/gestao-vista/meta-realizado` - Dados META vs REALIZADO

### Doadores (Stripe)
- `POST /api/donors/sync-stripe` - Sincronizar status com Stripe

---

## 🎨 Design System

### Cores Principais
- **Amarelo O Grito**: `#FFCC00`
- **Verde Folha**: `#3E8E41`
- **Laranja**: `#FF8C42`
- **Roxo**: `#7B2CBF`
- **Azul**: `#3b82f6`

### Tipografia
- **Fonte**: Inter (Google Fonts)
- **Tamanhos**: Sistema modular Tailwind

### Componentes Shadcn/UI
- Button, Card, Dialog, Form
- Input, Select, Checkbox, Switch
- Toast, Alert, Progress
- Tabs, Accordion, Dropdown

---

## 📊 Dashboards Disponíveis

### 1. Dashboard Leo Martins (`/leo-martins`)
- **KPIs Principais**: Doadores, Patrocinadores, Alunos, Colaboradores
- **Metas e Realizados**: Com percentuais
- **Gráfico Nosso Impacto**: Performance por setor
- **Filtros**: Por mês e ano
- **Seções**: Doadores, Patrocinadores, Alunos, Colaboradores

### 2. Dashboard Conselho (`/conselho`)
- **Seletor de Departamento**: 4 departamentos
- **Gráficos Financeiros**: META vs REALIZADO mensal
- **Totalizadores Anuais**: Receitas e despesas consolidadas
- **Histórias Inspiradoras**: Carrossel de impacto

### 3. Dashboard Inclusão Produtiva
- **Indicadores por Projeto**: Lab Vozes, Cursos 30h, EAD CGD
- **Frequência e Desempenho**: Por mês
- **Metas Individuais**: Por indicador

---

## 🔧 Configuração

### Variáveis de Ambiente

#### Banco de Dados
```
DO_DATABASE_URL=postgresql://...
DO_DB_HOST=143.198.136.16
DO_DB_PORT=5433
DO_DB_NAME=clubedogrito
DO_DB_USER=...
DO_DB_PASSWORD=...
```

#### APIs Externas
```
STRIPE_SECRET_KEY=sk_...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...
```

#### Google Cloud
```
GOOGLE_APPLICATION_CREDENTIALS=...
GCS_BUCKET_NAME=clubedogrito
```

### Instalação

```bash
# Instalar dependências
npm install

# Rodar migrations
npm run db:push

# Iniciar desenvolvimento
npm run dev
```

---

## 🐛 Problemas Conhecidos e Soluções

### 1. Drizzle ORM - Caractere `&`
**Problema**: `eq()` do Drizzle não compara strings com `&` (ex: "Esporte & Cultura")

**Solução**: Usar SQL raw
```typescript
const result = await db.execute(sql`
  SELECT * FROM conselho_metas_mensais
  WHERE departamento = ${departamento}
`);
```

### 2. Busca de Telefone
**Problema**: Formatos diferentes (+55, parênteses, hífens)

**Solução**: Normalização via SQL
```sql
WHERE REGEXP_REPLACE(telefone, '[^0-9]', '', 'g') = ${cleanPhone}
```

---

## 📈 Métricas de Impacto

### Dados Rastreados
- **Crianças Impactadas**: 995 (meta anual)
- **Famílias Acompanhadas**: Programa Decolagem
- **Pessoas Formadas**: Programas de capacitação
- **Atendimentos Psicossociais**: Método Grito
- **Doadores Ativos**: Meta 1.500
- **Patrocinadores**: 59 em 2024

---

## 🚀 Deploy e PWA

### Build de Produção
```bash
npm run build
```

### Service Worker
- **Auto-update**: Automático
- **Cache**: 6MB máximo
- **Offline**: Fallback para /index.html

### Instalação PWA
1. Acessar via HTTPS
2. Clicar em "Instalar app" no navegador
3. App abre em modo standalone

---

## 📝 Changelog Recente

### Outubro 2025
- ✅ **Migração de metas** para banco de dados
- ✅ **Correção SQL** para "Esporte & Cultura"
- ✅ **Filtro de ano** para patrocinadores
- ✅ **Metas nos cards** (Doadores: 1.500, Alunos: 995)
- ✅ **PWA** totalmente configurado

---

## 👥 Contribuidores

**Instituto O Grito**
- Desenvolvimento e manutenção
- Gestão de conteúdo

---

## 📄 Licença

Propriedade do **Instituto O Grito** - Todos os direitos reservados.

---

## 📞 Suporte

Para questões técnicas ou suporte:
- **Site**: [Instituto O Grito](https://www.ogrito.org.br)
- **Dashboard**: Acessar `/leo-martins` com credenciais de admin
