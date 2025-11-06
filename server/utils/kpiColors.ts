type KpiColor = 'green' | 'yellow' | 'red' | 'gray' | 'blue';

interface KpiInput {
  id: string;
  valor: number;
  meta?: number;
  tipo: 'percent' | 'count';
}

interface KpiResult {
  color: KpiColor;
  progress: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function getKpiColor({ id, valor, meta, tipo }: KpiInput): KpiResult {
  // Sem meta para contagens = azul (caso especial: alunos em formação)
  if (tipo === 'count' && !meta) {
    return { color: 'blue', progress: 100 };
  }

  // Converter NPS (-100 a +100) para escala 0-100
  let valorNormalizado = valor;
  if (id === 'nps') {
    valorNormalizado = (valor + 100) / 2;
  }

  // REGRA: Frequência (percentual)
  // Azul: > meta, Verde: 80-100%, Amarelo: 50-79%, Vermelho: < 50%
  if (id === 'frequencia') {
    const metaValue = meta || 90;
    let color: KpiColor;
    
    if (valorNormalizado > metaValue) {
      color = 'blue'; // Acima da meta
    } else if (valorNormalizado >= metaValue * 0.8) {
      color = 'green'; // 80-100% da meta
    } else if (valorNormalizado >= metaValue * 0.5) {
      color = 'yellow'; // 50-79% da meta
    } else {
      color = 'red'; // Abaixo de 50%
    }
    
    return {
      color,
      progress: clamp(valorNormalizado, 0, 100)
    };
  }

  // REGRA: Evasão (menor é melhor)
  if (id === 'evasao') {
    const metaValue = meta || 8;
    let color: KpiColor;
    
    if (valorNormalizado <= metaValue) {
      color = 'green';
    } else if (valorNormalizado <= metaValue * 1.15) {
      color = 'yellow';
    } else {
      color = 'red';
    }
    
    return {
      color,
      progress: 100 - clamp(valorNormalizado, 0, 100)
    };
  }

  // REGRA: Critério de Sucesso (percentual)
  // Azul: > meta, Verde: 80-100%, Amarelo: 50-79%, Vermelho: < 50%
  if (id === 'criterioSucesso') {
    const metaValue = meta || 85;
    let color: KpiColor;
    
    if (valorNormalizado > metaValue) {
      color = 'blue'; // Acima da meta
    } else if (valorNormalizado >= metaValue * 0.8) {
      color = 'green'; // 80-100% da meta
    } else if (valorNormalizado >= metaValue * 0.5) {
      color = 'yellow'; // 50-79% da meta
    } else {
      color = 'red'; // Abaixo de 50%
    }
    
    return {
      color,
      progress: clamp(valorNormalizado, 0, 100)
    };
  }

  // REGRA: NPS / Pesquisa de Satisfação (count)
  // Azul: > meta, Verde: 80-100%, Amarelo: 50-79%, Vermelho: < 50%
  if (id === 'nps') {
    const metaValue = meta || 70;
    let color: KpiColor;
    
    if (valorNormalizado > metaValue) {
      color = 'blue'; // Acima da meta
    } else if (valorNormalizado >= metaValue * 0.8) {
      color = 'green'; // 80-100% da meta
    } else if (valorNormalizado >= metaValue * 0.5) {
      color = 'yellow'; // 50-79% da meta
    } else {
      color = 'red'; // Abaixo de 50%
    }
    
    return {
      color,
      progress: Math.min(100, (valorNormalizado / metaValue) * 100)
    };
  }

  // REGRA: Indicadores de contagem
  // Azul: > meta, Verde: 80-100%, Amarelo: 50-79%, Vermelho: < 50%
  if (tipo === 'count' && meta) {
    let color: KpiColor;
    const percentual = (valorNormalizado / meta) * 100;
    
    if (valorNormalizado > meta) {
      color = 'blue'; // Acima da meta
    } else if (percentual >= 80) {
      color = 'green'; // 80-100% da meta
    } else if (percentual >= 50) {
      color = 'yellow'; // 50-79% da meta
    } else {
      color = 'red'; // Abaixo de 50%
    }
    
    return {
      color,
      progress: Math.min(100, percentual)
    };
  }

  // REGRA PADRÃO: Percentuais gerais
  // Azul: > meta, Verde: 80-100%, Amarelo: 50-79%, Vermelho: < 50%
  if (tipo === 'percent' && meta) {
    let color: KpiColor;
    
    if (valorNormalizado > meta) {
      color = 'blue'; // Acima da meta
    } else if (valorNormalizado >= meta * 0.8) {
      color = 'green'; // 80-100% da meta
    } else if (valorNormalizado >= meta * 0.5) {
      color = 'yellow'; // 50-79% da meta
    } else {
      color = 'red'; // Abaixo de 50%
    }
    
    return {
      color,
      progress: clamp(valorNormalizado, 0, 100)
    };
  }

  // Fallback: cinza
  return { color: 'gray', progress: 0 };
}

// Mapeamento de cores para classes CSS do Tailwind
export function getColorClass(color: KpiColor): string {
  switch (color) {
    case 'blue':
      return 'bg-blue-500'; // Azul = superou a meta
    case 'green':
      return 'bg-green-500';
    case 'yellow':
      return 'bg-yellow-500';
    case 'red':
      return 'bg-red-500';
    case 'gray':
    default:
      return 'bg-gray-300';
  }
}
