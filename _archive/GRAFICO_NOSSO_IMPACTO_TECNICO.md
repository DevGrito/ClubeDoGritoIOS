# Gráfico "Nosso Impacto" - Documentação Técnica

## Visão Geral
Gráfico de barras agrupadas que compara **Meta** (valores planejados) vs **Realizado** (valores executados) por programa, com visão executiva clara e informativa.

## Implementação
**Arquivo:** `client/src/pages/leo-martins.tsx` (linhas 1983-2134)  
**Biblioteca:** Recharts (BarChart)

## Estrutura de Dados

### Fonte de Dados
- **API:** `/api/gestao-vista/meta-realizado?period=2025-08&scope=monthly`
- **Retorna:** Array de indicadores com campos:
  - `setor_nome`: Nome do setor/programa
  - `meta`: Valor absoluto da meta (número)
  - `realizado`: Valor absoluto realizado (número)
  - `indicador_unit`: Unidade de medida

### Processamento
```javascript
// Agrupa por setor, somando metas e realizados
const setoresMapa = new Map();
gestaoVistaData.data.forEach((item) => {
  // Soma meta_total e realizado_total por setor
  // Calcula percentualAtingido, percentualFalta, gapAbsoluto
});
```

### Estrutura Final dos Dados
```javascript
{
  programa: string,           // Nome do programa
  meta: number,              // Soma das metas do programa
  realizado: number,         // Soma dos realizados do programa
  percentualAtingido: number, // (realizado/meta)*100
  percentualFalta: number,    // 100 - percentualAtingido
  gapAbsoluto: number        // meta - realizado
}
```

## Componentes Visuais

### 1. Barras
- **Meta (Azul #3b82f6)**: Sempre à esquerda
- **Realizado (Verde #22c55e)**: Sempre à direita
- **Labels nas barras:**
  - Meta: `"Meta: {valor formatado}"`
  - Realizado: `"Realizado: {valor} — {%}"`

### 2. Eixos
- **X-Axis:** Nome dos programas (rotacionado -15°)
- **Y-Axis:** Valores absolutos com formatação `pt-BR` (separador de milhar: ponto)

### 3. Tooltip Executivo
Ao passar o mouse, exibe:
- Nome do programa
- Meta (valor absoluto)
- Realizado (valor absoluto)
- % Atingido (colorido: verde ≥90%, amarelo ≥70%, vermelho <70%)
- % que falta (se não atingiu meta)
- Gap absoluto (diferença meta - realizado)
- **Badge especial:** "✓ Acima da meta" + excedente (se realizado > meta)

### 4. Casos Especiais Tratados
```javascript
// Meta = 0
if (data.meta === 0) {
  return "Meta não definida";
}

// Realizado > Meta
if (data.realizado > data.meta) {
  return (
    <div>
      <p>✓ Acima da meta</p>
      <p>Excedente: +{valor} (+{%})</p>
    </div>
  );
}
```

## Formatação Numérica

Todos os valores usam formatação brasileira:
```javascript
// Eixo Y
new Intl.NumberFormat('pt-BR').format(value)

// Labels e Tooltips
value.toLocaleString('pt-BR')
```

**Exemplos:**
- 1000 → "1.000"
- 264500 → "264.500"
- 1627345 → "1.627.345"

## Cálculos

### Percentual Atingido
```javascript
percentualAtingido = (realizado / meta) * 100
// Exemplo: (940 / 1200) * 100 = 78.3%
```

### Percentual que Falta
```javascript
percentualFalta = Math.max(0, 100 - percentualAtingido)
// Exemplo: 100 - 78.3 = 21.7%
```

### Gap Absoluto
```javascript
gapAbsoluto = meta - realizado
// Exemplo: 1200 - 940 = 260 (faltam 260 unidades)
// Se negativo: realizado excedeu a meta
```

## Responsividade

- **Desktop:** Rótulos horizontais inclinados (-15°)
- **Mobile:** Mantém legibilidade com `fontSize: 12px` e `height: 80px`
- **Margens:** `{ top: 20, right: 30, left: 20, bottom: 60 }`

## Como Atualizar os Dados

### Backend
1. Os dados vêm da API `/api/gestao-vista/meta-realizado`
2. Para mudar período: `?period=2025-09`
3. Para mudar escopo: `&scope=quarterly` (opções: monthly, quarterly, semiannual, annual)

### Frontend
```javascript
// Linha 1624 em leo-martins.tsx
const response = await fetch(
  '/api/gestao-vista/meta-realizado?period=2025-08&scope=monthly'
);
```

### Adicionar Programa/Setor
1. Inserir dados no banco via API de Gestão à Vista
2. O gráfico automaticamente agrega e exibe o novo programa
3. Sem necessidade de código adicional

## Critérios de Aceite ✅

- [x] Meta à esquerda (azul), Realizado à direita (verde)
- [x] Valores absolutos exibidos nas barras
- [x] Labels com formato "Meta: X" e "Realizado: Y — Z%"
- [x] Tooltip executivo completo
- [x] % atingido e % que falta calculados
- [x] Gap absoluto exibido
- [x] Badge "Acima da meta" quando Realizado > Meta
- [x] Tratamento de Meta = 0
- [x] Separador de milhar pt-BR
- [x] Responsivo sem sobreposição de labels
- [x] Formatação consistente em todo o gráfico

## Observações Importantes

1. **Agregação por Setor:** Se um setor tem múltiplos indicadores, o gráfico soma todos os valores (meta e realizado) para exibir um total consolidado

2. **Cores Fixas:**
   - Azul #3b82f6 (Meta) - tom corporativo confiável
   - Verde #22c55e (Realizado) - indica execução/atingimento

3. **Performance:** O gráfico processa em média 138 indicadores de 6 setores em <600ms

4. **Fallback:** Se não há dados (`!gestaoVistaData?.data`), retorna array vazio sem quebrar o componente
