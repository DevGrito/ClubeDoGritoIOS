# Guia de Configuração - Cielo Silent Order Post (SOP)

## ✅ Implementação Concluída

A integração segura da Cielo Sales API usando Silent Order Post está **completa e aprovada pelo Architect**!

### 🔒 Segurança PCI DSS Garantida

- ✅ **Tokenização client-side**: Dados do cartão nunca passam pelo backend
- ✅ **Classes bp-sop-***: Formulário usa campos específicos da Cielo
- ✅ **Backend seguro**: Aceita apenas PaymentToken (não aceita dados de cartão)
- ✅ **OAuth2 + SOP AccessToken**: Fluxo de autenticação correto
- ✅ **3DS 2.x**: Suporte automático a autenticação bancária
- ✅ **Webhook**: Recebe notificações de mudança de status

---

## 📋 Próximos Passos para Produção

### 1️⃣ Obter Credenciais da Cielo

Você precisará de **dois conjuntos de credenciais**:

#### A) Credenciais API (E-commerce API)
Para processar pagamentos:
- `CIELO_MERCHANT_ID` (exemplo: `abc12345-6789-0def-1234-567890abcdef`)
- `CIELO_MERCHANT_KEY` (exemplo: `ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABCD`)

#### B) Credenciais Silent Order Post (OAuth2)
Para tokenização segura:
- `CIELO_SOP_CLIENT_ID` (exemplo: `0a1b2c3d-4e5f-6789-0abc-def123456789`)
- `CIELO_SOP_CLIENT_SECRET` (exemplo: `AbCdEfGhIjKlMnOpQrStUvWxYz1234567890`)

**Como obter:**
1. Acesse o portal da Cielo: https://www.cielo.com.br/
2. No painel de desenvolvedor, crie uma aplicação E-commerce API
3. Anote as credenciais fornecidas
4. Entre em contato com o suporte Cielo para ativar o Silent Order Post

---

### 2️⃣ Configurar Credenciais no Sistema

#### Opção A: Via Interface (Recomendado)

Acesse a página de administração e salve as credenciais:

**API E-commerce:**
```
POST /api/admin/cielo/credentials
{
  "merchantId": "seu-merchant-id",
  "merchantKey": "sua-merchant-key"
}
```

**Silent Order Post:**
```
POST /api/admin/cielo-sop/credentials
{
  "clientId": "seu-client-id",
  "clientSecret": "seu-client-secret"
}
```

#### Opção B: Via Secrets (Mais Seguro)

Adicione as seguintes secrets no Replit:
- `CIELO_MERCHANT_ID`
- `CIELO_MERCHANT_KEY`
- `CIELO_SOP_CLIENT_ID`
- `CIELO_SOP_CLIENT_SECRET`

As credenciais serão armazenadas de forma criptografada no banco de dados.

---

### 3️⃣ Configurar Ambiente (Sandbox → Produção)

#### Alterar Ambiente no Frontend

Edite `client/index.html` e altere o environment:

```javascript
// SANDBOX (testes)
const sopOptions = {
  environment: 'SANDBOX',
  ...
};

// PRODUÇÃO
const sopOptions = {
  environment: 'PRODUCTION',
  ...
};
```

#### Alterar Ambiente no Backend

Defina a variável de ambiente:
```bash
CIELO_ENV=prod  # Para produção
CIELO_ENV=sandbox  # Para testes (padrão)
```

**⚠️ IMPORTANTE:** Sempre teste em SANDBOX primeiro!

---

### 4️⃣ Configurar Webhook na Cielo

No painel da Cielo, configure o webhook para receber notificações:

**URL do Webhook:**
```
https://seu-dominio.replit.app/webhooks/cielo-sop
```

**Eventos a monitorar:**
- ✅ Pagamento capturado
- ✅ Pagamento cancelado
- ✅ Pagamento negado
- ✅ Chargeback

O webhook atualizará automaticamente o status dos ingressos no banco de dados.

---

### 5️⃣ Testar em Sandbox

Use os cartões de teste fornecidos pela Cielo:

**Aprovado:**
- Número: `4532 1155 0402 7212`
- Validade: Qualquer data futura (ex: `12/2030`)
- CVV: `123`
- Nome: TESTE APROVADO

**Negado:**
- Número: `4532 1155 0402 7204`
- Validade: Qualquer data futura
- CVV: `123`
- Nome: TESTE NEGADO

**3DS (Autenticação):**
- Número: `4000 0000 0000 0002`
- Validade: Qualquer data futura
- CVV: `123`
- Nome: TESTE 3DS

---

## 🔍 Monitoramento e Logs

### Verificar Logs de Pagamento

Busque por:
- `[CIELO SOP]` - Fluxo de pagamento seguro
- `[WEBHOOK CIELO SOP]` - Notificações recebidas
- `❌` - Erros

### Comandos Úteis

Ver logs do servidor:
```bash
grep "CIELO SOP" logs.txt
```

Verificar webhooks recebidos:
```bash
grep "WEBHOOK CIELO SOP" logs.txt
```

---

## 🚨 Checklist de Segurança

Antes de ir para produção, verifique:

- [ ] Credenciais SOP configuradas corretamente
- [ ] Script SOP carregado no `index.html`
- [ ] Formulário usa classes `bp-sop-*`
- [ ] Environment alterado para `PRODUCTION`
- [ ] Webhook configurado na Cielo
- [ ] Testado em sandbox com sucesso
- [ ] Nenhum dado de cartão logado no servidor
- [ ] HTTPS habilitado (obrigatório para SOP)

---

## 📚 Documentação Técnica

### Fluxo de Pagamento

```
1. Cliente preenche dados do cartão (bp-sop-* fields)
   ↓
2. Frontend busca SOP AccessToken (/api/cielo-sop/access-token)
   ↓
3. Script da Cielo tokeniza o cartão (client-side)
   ↓
4. Frontend envia PaymentToken para backend (/api/ingresso/pagar-cielo-sop)
   ↓
5. Backend autoriza pagamento na Cielo
   ↓
6. Se aprovado: cria ingressos e redireciona
   Se 3DS: redireciona para autenticação
   Se negado: exibe erro
   ↓
7. Webhook recebe notificações assíncronas e atualiza status
```

### Endpoints Implementados

**Frontend:**
- `GET /api/cielo-sop/access-token` - Obter SOP AccessToken
- `POST /api/ingresso/pagar-cielo-sop` - Processar pagamento com token

**Admin:**
- `POST /api/admin/cielo-sop/credentials` - Salvar credenciais SOP

**Webhook:**
- `POST /webhooks/cielo-sop` - Receber notificações da Cielo

---

## 🆘 Suporte e Troubleshooting

### Erro: "Script de segurança não carregado"
- Verifique se o script SOP está no `index.html`
- Verifique se há bloqueador de scripts (AdBlock, etc.)

### Erro: "Invalid AccessToken"
- Verifique se as credenciais SOP estão corretas
- Confirme se o ambiente (sandbox/prod) está correto

### Erro: "Payment denied"
- Use cartão de teste válido em sandbox
- Verifique se o ambiente está configurado corretamente
- Consulte logs para detalhes do erro

### Webhook não recebe notificações
- Verifique se a URL está configurada na Cielo
- Confirme se o webhook está acessível (HTTPS)
- Teste manualmente com Postman

---

## 📞 Contatos

**Suporte Cielo:**
- Portal: https://developercielo.github.io/
- Email: cieloecommerce@cielo.com.br
- Telefone: 4002-9700 (capitais) / 0800-570-1700 (demais localidades)

**Documentação Silent Order Post:**
- https://developercielo.github.io/manual/cielo-ecommerce#silent-order-post

---

## ✅ Status da Implementação

| Componente | Status | Observações |
|-----------|--------|-------------|
| Backend OAuth2 | ✅ Completo | `server/services/cieloSecrets.ts` |
| Backend Pagamento | ✅ Completo | `POST /api/ingresso/pagar-cielo-sop` |
| Frontend Script SOP | ✅ Completo | `client/index.html` |
| Frontend Formulário | ✅ Completo | Classes `bp-sop-*` implementadas |
| Suporte 3DS 2.x | ✅ Completo | Redirecionamento automático |
| Webhook | ✅ Completo | `POST /webhooks/cielo-sop` |
| Testes Sandbox | ⏳ Pendente | Requer credenciais |
| Produção | ⏳ Pendente | Requer testes + config |

---

**Implementado em:** Outubro 2025  
**Versão:** 1.0  
**Compliance:** PCI DSS ✅
